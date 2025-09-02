# Doc Tailor

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

Doc Tailor helps you generate targeted resumes and cover letters from reusable Google Docs templates, powered by the Vercel AI SDK and Google Gemini.

## What it does

- Folder setup: Choose or create a Google Drive folder, and the app creates subfolders: Resume Templates, Cover Letter Templates, Generated Resumes, and Generated Cover Letters. You can clear the selection later.
- Template library: Browse, preview, edit, and refresh your templates directly from Drive.
- Document Builder: Paste a LinkedIn job URL, extract details, generate focused keywords, and produce a targeted resume by inserting optimized bullets and a single-line skills list into your chosen template.
  - Inserts bullets at `{{Job 01 Bullets}}` as a bulleted list (12–15 items).
  - Inserts skills at `{{Skills List}}` as a single line with 15–25 items separated by the bullet character (•).
  - For .docx templates, you can Delete, Archive, or Keep the original after conversion.
- Generated files: New documents are saved in the appropriate Generated folder and can be opened immediately in Google Docs.

## Quick links

- Dashboard: [doc-tailor.com/dashboard](http://doc-tailor.com/dashboard)
- Guide: [doc-tailor.com/guide/templates](http://doc-tailor.com/guide/templates)
- Terms: [doc-tailor.com/terms](http://doc-tailor.com/terms)
- Privacy: [doc-tailor.com/privacy](http://doc-tailor.com/privacy)

## Tech

- Next.js App Router, TypeScript, Tailwind CSS
- Vercel AI SDK with `@ai-sdk/google` (Gemini 2.5 Flash)
- Google APIs (Drive, Docs)

## Development

1. Install dependencies and run the dev server:
   ```bash
   pnpm install
   pnpm dev
   ```
2. Add environment variables in `.env.local`:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_URL`
   - `GOOGLE_GENERATIVE_AI_API_KEY` (or `GOOGLE_API_KEY`)
3. Sign in with Google (Drive and Docs scopes). Some actions (e.g., delete originals) may require re-consent.

## Notes

- The app centers content next to a collapsible sidebar and reserves scrollbar space to avoid layout shifts.
