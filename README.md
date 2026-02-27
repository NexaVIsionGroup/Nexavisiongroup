# NexaVision Group — Revenue Infrastructure Site

## Stack
- **Framework:** Next.js 14 (App Router)
- **CMS:** Sanity v3 (everything editable)
- **Styling:** Tailwind CSS + custom design tokens
- **Animation:** Framer Motion
- **Hosting:** Vercel
- **Fonts:** Outfit (display), Space Grotesk (body), JetBrains Mono (mono/console)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env.local

# 3. Create a Sanity project at sanity.io/manage
#    Add your project ID to .env.local

# 4. Run development server
npm run dev

# 5. Run Sanity Studio (separate terminal)
npm run sanity:dev
```

The site works immediately with fallback data — no Sanity connection required to see the design.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (fonts, metadata, global bg)
│   └── page.tsx            # Homepage (fetches from Sanity)
├── components/
│   ├── layout/             # Navbar, Footer
│   ├── sections/           # Homepage sections (Hero, Anthill, Modules, etc.)
│   └── ui/                 # Reusable components (SectionWrapper, etc.)
├── lib/
│   ├── animations.ts       # Framer Motion presets
│   ├── fallback-data.ts    # Static data when Sanity isn't connected
│   ├── fonts.ts            # Font configuration
│   └── utils.ts            # cn() utility
└── styles/
    └── globals.css         # Tailwind + NexaVision design system

sanity/
├── lib/
│   ├── client.ts           # Sanity client configuration
│   └── queries.ts          # GROQ queries
└── schemas/
    ├── index.ts            # Schema registry
    ├── siteSettings.ts     # Global settings (logo, nav, footer, SEO)
    ├── homepage.ts         # All homepage sections
    ├── industry.ts         # Industry vertical documents
    ├── demo.ts             # Demo system documents
    ├── caseStudy.ts        # Systems Lab case studies
    └── pricingPage.ts      # Pricing page content
```

## Sanity Content Model

| Document         | Purpose                              | Editable Fields                                    |
|-----------------|--------------------------------------|----------------------------------------------------|
| Site Settings   | Logo (with size/offset!), nav, footer, SEO | Logo position, width, height, offset X/Y, all nav items, footer columns, social links |
| Homepage        | Every homepage section               | Hero text, console panel, anthill items, modules, pricing tiers, CTAs |
| Industries      | Vertical landing pages               | Name, pain points, key modules, signature module, stats |
| Demos           | Interactive demo entries             | Title, modules, thumbnail, live URL, status |
| Case Studies    | Systems Lab entries                  | Modules built, flow diagrams, results, screenshots |
| Pricing Page    | Dedicated pricing page               | Tiers, features, FAQ |

## Design System

### Colors
- **nv-abyss** `#0A1628` — primary background
- **nv-teal** `#00E5CC` — primary accent
- **nv-violet** `#7B5EA7` — secondary accent
- **nv-ember** `#FF6B35` — warm highlight

### Component Classes
- `.nv-glass` — glass panel with blur
- `.nv-card` — hairline border card with hover
- `.nv-module-card` — signature motif card with glow edge
- `.nv-btn-primary` — teal glow CTA button
- `.nv-btn-ghost` — outlined secondary button
- `.nv-console` — command center panel
- `.nv-chip` — tag/chip element
- `.nv-section-label` — uppercase tracking label
- `.nv-gradient-text-teal` — gradient text effect

## Deployment

Push to GitHub → Vercel auto-deploys. Add env vars in Vercel dashboard.
```
