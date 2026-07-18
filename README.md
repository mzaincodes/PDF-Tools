# PDF TOOLS — All Your PDF Tools in One Place

A production-ready, privacy-first PDF platform built with **Next.js 15**. Every operation runs
**entirely in the browser** — files are never uploaded to or stored on a server.

![Tools](https://img.shields.io/badge/tools-50%2B-6d28d9) ![Privacy](https://img.shields.io/badge/processing-100%25%20client--side-16a34a)

## ✨ Highlights

- **50+ tools** across Organize, Edit, Forms, Security, OCR, Convert and Utilities
- **100% in-browser** processing with pdf-lib, pdf.js, Fabric.js and Tesseract.js — no backend, no database
- **Full PDF editor** (text, images, shapes, freehand, highlight, signature, whiteout) that flattens back to PDF
- **Real encryption** (AES password protection, permissions) via `@cantoo/pdf-lib`
- **OCR** to searchable PDF or plain text, running on WebAssembly
- **Premium UI** — glassmorphism, gradients, Framer Motion, dark/light mode, fully responsive
- **SEO-complete** — dynamic metadata, JSON-LD, sitemap, robots, OpenGraph image, per-tool routes
- Accessible, keyboard-friendly, and **Vercel-ready**

## 🧱 Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Radix UI (shadcn-style) · Framer Motion ·
React Hook Form + Zod · React Dropzone · React-PDF / pdf.js · pdf-lib · @cantoo/pdf-lib ·
Fabric.js · Tesseract.js · JSZip · Lucide Icons · next-themes · Sonner

## 🚀 Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm run start        # serve the production build
npm run typecheck    # tsc --noEmit
```

## ☁️ Deploying to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import it in Vercel — the framework is auto-detected as Next.js.
3. (Optional) set `NEXT_PUBLIC_SITE_URL` to your production URL so canonical/OG links are absolute.

No environment variables, databases or serverless storage are required. An `.npmrc` with
`legacy-peer-deps=true` is included so the install succeeds on Vercel with React 19.

## 🗂 Project structure

```
src/
├── app/                     # App Router pages, routes & SEO metadata files
│   ├── tools/[slug]/        # dynamic page for every tool
│   ├── sitemap.ts robots.ts manifest.ts opengraph-image.tsx
│   └── about faq contact privacy terms not-found
├── components/
│   ├── ui/                  # shadcn-style primitives (button, dialog, …)
│   ├── layout/              # navbar, footer
│   ├── home/                # landing-page sections
│   ├── tools/               # workspace, upload, viewer, organizer, compare
│   ├── editor/              # Fabric.js PDF editor + signature pad
│   └── shared/              # logo, search, cards, reveal, page header
├── lib/
│   ├── tools.ts             # the tool registry (metadata for every tool)
│   ├── categories.ts        # tool categories
│   └── pdf/                 # all client-side processing (pdf-lib / pdf.js / OCR)
├── hooks/                   # local-storage, recent & favorite tools
└── types/                   # shared TypeScript types
```

## 🔐 Privacy model

```
Upload → stays in browser memory → processed locally → download → memory cleared
```

Nothing is persisted server-side. The only network requests beyond loading the app are the
Tesseract OCR language model (fetched from a CDN and cached in your browser on first OCR use).

## ✅ End-to-end QA

A browser-driven harness in [`_qa/`](_qa/) exercises **every tool** in real headless Chrome:
it uploads real files, clicks through each tool, captures the actual download and validates it
(page counts, ZIP entries, encryption state, extracted text).

```bash
node _qa/assets.mjs          # generate sample PDFs / images / office files
bash _qa/qa.sh               # build + serve + run all 62 checks
bash _qa/qa.sh --only=merge,ocr   # run a subset
SKIP_SLOW=1 bash _qa/qa.sh   # skip the OCR tests
```

Notable checks: office→PDF conversions are verified by round-tripping the output back through
the Extract Text tool; editor tools draw a real shape and assert it is burned into the exported
PDF; compression is measured against an image-heavy document.

## 🧪 Adding a new tool

1. Add an entry to `src/lib/tools.ts` (slug, category, handler, options, copy).
2. If it's a `processor`, add the function to `src/lib/pdf/*` and register it in `src/lib/pdf/index.ts`.
3. That's it — the route, page, SEO and UI are generated automatically.

---

Built for people who care about privacy. © PDFpro.
# PDF-Tools
<img width="2880" height="15764" alt="pdf-screenshot" src="https://github.com/user-attachments/assets/3b876495-731d-453d-8ec0-1457d5aa1bbe" />
