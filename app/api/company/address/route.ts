import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const company = searchParams.get("company")
    if (!company) return NextResponse.json({ error: "Missing company" }, { status: 400 })

    const key = process.env.GOOGLE_MAPS_API_KEY
    if (!key) return NextResponse.json({ error: "Maps API key not configured" }, { status: 500 })

    const query = encodeURIComponent(`${company} headquarters address`)
    const resp = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${key}`)
    const data = await resp.json().catch(() => ({} as any))
    const first = Array.isArray(data?.results) && data.results[0]
    const address = first?.formatted_address ? String(first.formatted_address) : ""

    return NextResponse.json({ address })
  } catch (e) {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 })
  }
}


