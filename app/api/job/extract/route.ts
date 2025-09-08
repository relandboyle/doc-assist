import { NextRequest, NextResponse } from "next/server"
export const runtime = 'nodejs'
import { auth } from "@/auth"

function extractMeta(html: string, name: string, attr: "property" | "name" = "property") {
  const pattern = new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`, "i")
  const match = html.match(pattern)
  return match ? match[1] : undefined
}

function extractTitle(html: string) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m ? m[1] : undefined
}

function tryParseJsonLd(html: string): { title?: string; company?: string; description?: string } | null {
  const scripts = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))
  for (const match of scripts) {
    const jsonText = match[1]
    try {
      const parsed = JSON.parse(jsonText)
      const candidates = Array.isArray(parsed) ? parsed : [parsed]
      for (const node of candidates) {
        if (!node) continue
        // Sometimes wrapped in @graph
        const graph = Array.isArray(node?.['@graph']) ? node['@graph'] : null
        const nodes = graph || [node]
        for (const n of nodes) {
          const type = (n?.['@type'] || n?.type)
          if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) {
            const title: string | undefined = n.title || n.name
            const company: string | undefined = n?.hiringOrganization?.name || n?.hiringOrganization?.legalName
            // Some sites put HTML in description
            let description: string | undefined = n.description
            if (typeof description === 'string') {
              // Remove HTML tags for plain text
              description = description.replace(/<[^>]+>/g, '').replace(/\s+\n/g, '\n').trim()
            }
            return { title, company, description }
          }
        }
      }
    } catch {
      // ignore parse errors and try next script
    }
  }
  return null
}

function splitCompanyAndTitle(raw: string): { title?: string; company?: string } {
  if (!raw) return {}
  const separators = [' — ', ' – ', ' - ', ' | ', ' @ ', ' at ']
  for (const sep of separators) {
    if (raw.includes(sep)) {
      const parts = raw.split(sep).map((p) => p.trim()).filter(Boolean)
      if (parts.length >= 2) {
        // Heuristic: take leftmost as title, rightmost as company
        const left = parts[0]
        const right = parts[parts.length - 1]
        return { title: left, company: right }
      }
    }
  }
  return { title: raw }
}

function stripHtml(html: string | undefined): string | undefined {
  if (!html) return html
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<(?:p|div|li)[^>]*>/gi, (m) => (m.toLowerCase().startsWith('<li') ? '\n• ' : '\n'))
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\u00a0/g, ' ')
    .replace(/[\t ]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractViaKnownSelectors(html: string): { title?: string; company?: string; description?: string } | null {
  // LinkedIn job description often in show-more-less-html__markup or description__text
  const liDescMatch = html.match(/<div[^>]+class=["'][^"']*(?:show-more-less-html__markup|description__text)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)
  if (liDescMatch) {
    const desc = stripHtml(liDescMatch[1])
    return { description: desc }
  }

  return null
}

function extractHostname(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl)
    return u.hostname.toLowerCase()
  } catch {
    return null
  }
}

async function extractLinkedInHiringTeamWithPlaywright(_url: string): Promise<Array<{ name: string; title?: string }> | null> { return null }

function extractLinkedIn(html: string): { title?: string; company?: string; description?: string; hiringTeam?: Array<{ name: string; title?: string }> } | null {
  // Title selectors
  const titleMatch =
    html.match(/<h1[^>]+class=["'][^"']*(?:topcard__title|top-card-layout__title)[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<h1[^>]+data-test-id=["']job-title["'][^>]*>([\s\S]*?)<\/h1>/i)
  const title = titleMatch ? stripHtml(titleMatch[1]) : undefined

  // Company selectors
  const companyAnchor =
    html.match(/<a[^>]+class=["'][^"']*(?:topcard__org-name-link|top-card-layout__company-url|job-details-jobs-unified-top-card__company-name-link)[^"']*["'][^>]*>([\s\S]*?)<\/a>/i)
  const companySpan =
    html.match(/<span[^>]+class=["'][^"']*(?:topcard__flavor|top-card-layout__second-subline)[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)
  const companyRaw = companyAnchor?.[1] || companySpan?.[1]
  const company = companyRaw ? stripHtml(companyRaw) : undefined

  // Attempt to extract hiring team/person from the "Meet the hiring team" block
  let hiringTeam: Array<{ name: string; title?: string }> | undefined
  try {
    // Prefer selecting the information block directly, then look for children
    const infoBlock = html.match(/<[^>]*class=["'][^"']*hirer-card__hirer-information[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i)

    let extractedName: string | undefined
    let extractedTitle: string | undefined

    if (infoBlock) {
      const inner = infoBlock[1] || ""
      // Name via <strong> inside hirer-card__hirer-information
      const strongMatch = inner.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)
      if (strongMatch) {
        const nameText = stripHtml(strongMatch[1]) || ""
        const nameLines = nameText.split(/\n+/).map((l) => l.trim()).filter(Boolean)
        extractedName = nameLines[0]
      }
      // Title via .text-body-small inside the same block; second non-empty line
      const smallMatch = inner.match(/<[^>]*class=["'][^"']*text-body-small[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i)
      if (smallMatch) {
        const tText = stripHtml(smallMatch[1]) || ""
        const tLines = tText.split(/\n+/).map((l) => l.trim()).filter(Boolean)
        if (tLines.length >= 2) extractedTitle = tLines[1]
        else if (tLines.length === 1) extractedTitle = tLines[0]
      }
    }

    // Secondary: .jobs-poster__name strong if name not found
    if (!extractedName) {
      const posterBlock = html.match(/<[^>]*class=["'][^"']*jobs-poster__name[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i)
      if (posterBlock) {
        const inner = posterBlock[1] || ""
        const strongMatch = inner.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)
        if (strongMatch) {
          const nameText = stripHtml(strongMatch[1]) || ""
          const nameLines = nameText.split(/\n+/).map((l) => l.trim()).filter(Boolean)
          extractedName = nameLines[0]
        }
      }
    }

    if (extractedName) hiringTeam = [{ name: extractedName, title: extractedTitle }]
  } catch {}

  // Description handled elsewhere; return title/company and hiring team hints
  if (title || company || hiringTeam) return { title, company, hiringTeam }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { url } = await req.json()
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    let html = ""
    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://www.indeed.com/",
          "Cache-Control": "no-cache",
        },
      })
      html = await resp.text()
    } catch {
      // ignore
    }

    const host = extractHostname(url)

    // 1) Prefer JSON-LD JobPosting when available (often contains full description)
    const jsonLd = tryParseJsonLd(html)

    // 2) Fallbacks via OpenGraph/meta
    const ogTitle = extractMeta(html, "og:title")
    const ogDesc = extractMeta(html, "og:description")
    const siteName = extractMeta(html, "og:site_name")
    const metaDesc = extractMeta(html, "description", "name")
    const titleTag = extractTitle(html)

    // Domain-aware extraction hints
    const domainHints = host?.includes('linkedin') ? extractLinkedIn(html) : null

    let title = jsonLd?.title || domainHints?.title || ogTitle || titleTag
    let company = jsonLd?.company || domainHints?.company

    // If company is missing or title likely combines both, attempt a split
    if (title && (!company || (company && title?.toLowerCase().includes(company.toLowerCase())))) {
      // If company isn't clear and title likely contains both pieces, try to split
      const split = splitCompanyAndTitle(title)
      title = split.title || title
      company = split.company || company
    }

    // Last-resort fallback to siteName (even if it's a platform), only if we still don't have a company
    if (!company && siteName) {
      company = siteName
    }
    let description = jsonLd?.description || domainHints?.description
    if (!description) {
      const sel = extractViaKnownSelectors(html)
      description = sel?.description || ogDesc || metaDesc
    }
    description = stripHtml(description)

    const job: any = { url, company, title, description }
    const hiringTeam: Array<{ name: string; title?: string }> | undefined = domainHints?.hiringTeam
    if (host?.includes('linkedin')) job.hiringTeam = hiringTeam

    try {
      if (host?.includes('linkedin')) {
        // eslint-disable-next-line no-console
        console.log('[job/extract] LinkedIn job extracted', job)
      }
    } catch {}

    return NextResponse.json({ job })
  } catch (e) {
    return NextResponse.json({ error: "Failed to extract job details" }, { status: 500 })
  }
}


