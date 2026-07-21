# BRH Intelligence QueryEngine — Frontend

Next.js 16 chat UI over the BRH FastAPI backend
(`/home/lourvens/project/brh-intelligence-queryengine/`). Built with
[AI Elements](https://elements.ai-sdk.dev) on top of
[shadcn/ui](https://ui.shadcn.com) (Base UI flavour), styled against
the [BRH institutional palette](docs/brand/BRH-PALETTE.md) and the
authoritative [UI/UX principles](docs/UIUX-PRINCIPLES.md).

The chat wire is the [Vercel AI SDK UI Message Stream
Protocol](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) —
header `x-vercel-ai-ui-message-stream: v1` — which the backend
already emits (ADR-0018 of the backend repo). This frontend never
parses the protocol by hand: it bridges `useChat`'s `{ messages }`
body to the backend's `{ question }` body, and lets the SDK parse
the stream end to end. Per the principles doc, the rules are:

- The reasoning trace is **collapsed by default** under a
  "Raisonnement de l'agent" toggle (operator-grade only).
- The Sources footer renders as typed source-document parts
  (`Voir les N sources`), not as in-prose `[N]` markers.
- A refusal is an answer, not an error; rendered in the standard
  Message styling, no destructive colour.

## Stack

- **Next.js 16.2** (App Router, Turbopack)
- **React 19.2**
- **Vercel AI SDK 7.0** — `ai`, `@ai-sdk/react` (`useChat`,
  `DefaultChatTransport`)
- **shadcn/ui (base-nova)** — Base UI primitives + `cn()` helper
- **AI Elements** — `Conversation`, `Message`, `Reasoning`, `Sources`,
  `PromptInput`, `Loader`
- **Tailwind v4** with semantic CSS variables, OKLCH, class-strategy
  dark mode (per the principles doc)
- **Montserrat** (headings) + **Roboto** (body), self-hosted via
  `next/font/google`
- **bun 1.3** as the package manager and script runner
- **lucide-react** for icons (we deliberately don't use `fontAwesome`
  like brh.ht)

## Surfaces

| Layer        | Where                                       | What                                            |
|--------------|----------------------------------------------|--------------------------------------------------|
| Page         | `app/page.tsx`                                | Chat UI: header, conversation, prompt input    |
| API adapter  | `app/api/chat/route.ts`                       | The one-file Vercel protocol adapter from ADR-0018 |
| AI primitives | `components/ai-elements/`                    | Conversation / Message / Reasoning / Sources / PromptInput / Loader |
| shadcn base  | `components/ui/`                              | button, hover-card, popover, tooltip, etc. (auto-installed) |
| Tokens + theme | `app/globals.css`                            | BRH palette in shadcn semantic variables       |
| Brand assets | `public/brh-logo-{light,dark}.png`            | BRH wordmark, served at `/brh-logo-*.png`    |

## Quick start

```bash
# 1. Install
bun install

# 2. Configure
cp .env.example .env.local
# optional: set BRH_BACKEND_URL=...

# 3. Boot the BRH FastAPI backend (in another terminal)
cd ../brh-intelligence-queryengine && \
  .venv/bin/uvicorn src.api.app:app --port 8000

# 4. Boot the frontend
bun next dev --port 3000
# → open http://localhost:3000
```

The adapter at `app/api/chat/route.ts` reads `BRH_BACKEND_URL`
(defaults to `http://localhost:8000`) and forwards each
`useChat`-shaped message body to the backend's `POST /ask`. The
backend's response stream is proxied back unchanged.

## Commands

```bash
bun next dev --port 3000        # dev server with HMR (Turbopack)
bun run build                  # production build (runs tsc --noEmit)
bun run start                  # serve the production build

# If you prefer bun's runtime for Next.js itself
bun --bun next dev --port 3000
```

## Configuration

| Env var              | Default                   | What                                                |
|----------------------|---------------------------|------------------------------------------------------|
| `BRH_BACKEND_URL`    | `http://localhost:8000`   | Where `/api/chat` forwards `POST /ask`. Set in dev / staging / prod via `.env.local` (gitignored). |

`app/api/chat/route.ts` is the only consumer.

## UI/UX rules

This project ships two design docs:

- [`docs/UIUX-PRINCIPLES.md`](docs/UIUX-PRINCIPLES.md) — every
  thematic / structural decision (theming, typography, spacing,
  color, components, chat behaviour, accessibility, anti-patterns).
  Single source of truth for any UI change.
- [`docs/brand/BRH-PALETTE.md`](docs/brand/BRH-PALETTE.md) —
  provenance for the BRH institutional tokens (extracted live from
  `brh.ht` on 2026-07-20; `#05155b` primary, `#005c8a` teal,
  Montserrat / Roboto). Re-run instructions live here too.

Before adding any UI, read the principles doc. When the principles
and the code disagree, the principles win unless a new ADR
supersedes them.

## Project layout

```
brh-intelligence-queryengine-frontend/
├── app/
│   ├── api/chat/route.ts       Vercel protocol adapter (POST -> /ask -> stream)
│   ├── layout.tsx              Montserrat + Roboto, <html lang="fr">, TooltipProvider
│   ├── globals.css             BRH palette in shadcn semantic CSS variables
│   └── page.tsx                Chat: Header, Conversation, PromptInputDock
├── components/
│   ├── ai-elements/            Conversation, Message, Reasoning, Sources, PromptInput, Loader + shimmer shim
│   ├── ui/                     base-nova shadcn primitives (button, hover-card, tooltip, ...)
│   └── brh-hero-icon.tsx       SVG mark for the empty state
├── lib/utils.ts                cn() helper from shadcn init
├── docs/
│   ├── UIUX-PRINCIPLES.md      Authoritative design rules (v1.x)
│   └── brand/BRH-PALETTE.md    Brand extraction provenance + re-run instructions
├── public/
│   ├── brh-logo-light.png      BRH wordmark, navy on white (251×123)
│   ├── brh-logo-dark.png       BRH wordmark, white RGBA (251×123)
│   └── ...                     create-next-app defaults
├── .env.example
├── postcss.config.mjs          @tailwindcss/postcss
├── tsconfig.json
├── components.json             shadcn registry config (style: base-nova)
└── package.json
```

## What follows this in the programme

Per the backend's `PROGRESSION.md` Next-up list and the frontend's
own backlog:

1. Multi-turn session memory — Postgres checkpointer on the backend,
   `id`-aware `useChat` + thread list UI here.
2. Reranker investigation — when the corpus grows large enough that
   retrieval quality matters.
3. Inline `[N]` citations in the assistant's prose (currently
   chip-style at the bottom of each message).
4. **Bundle pruning.** The AI Elements bundle installed components
   we don't use (artifact, canvas, checkpoint, …); we deleted the
   source files but the npm deps (`@xyflow/react`, `embla-carousel-react`,
   `motion`, `shiki`, `tokenlens`) are still in `package.json`.
   Worth a `bun remove` sweep before the first tag.

## Notes

- We do **not** ship ESLint; `bun run build` runs `tsc --noEmit` for
  type checking. If you want lint, `bunx --bun shadcn@latest add
  eslint-config` will re-wire it; do so with the principles doc open.
- We do **not** run a custom OpenTelemetry layer here; tracing lives
  on the backend (Phoenix / OpenInference, opt-in). If you want
  client-side tracing, register `phoenix.otel.register` in
  `instrumentation-client.ts` (Next.js convention) — out of scope
  for v1.
- We pin `shadcn@4.12.0` in the install instructions because
  `shadcn@latest` currently pulls in a transitive `systeminformation@^5.22.11`
  that bun cannot resolve in this environment. Worth re-checking on
  future shadcn releases.
