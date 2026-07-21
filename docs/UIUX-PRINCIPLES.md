# BRH Frontend — UI/UX Principles

**Version:** v1.1
**Last updated:** 2026-07-20
**Status:** Authoritative. Single source of truth for UI/UX decisions.

**Audience:** Future Claude sessions, the user's review, and any future
contributor. **Read before any UI/UX work on the BRH frontend.** When this
file and the code disagree, the code is wrong — not the doc — unless a
newer ADR supersedes it.

This is the equivalent of `docs/adr/` in the backend repo. We treat
UI/UX decisions with the same rigour as architectural decisions:
sourced, opinionated, versioned. When the next Claude session is asked
"how do our citations render?" or "should reasoning be visible by
default?" or "what's our line-height convention?" — the answer is
here, not re-derived.

---

## 1. Design philosophy

Six principles. Each is non-negotiable unless a future ADR supersedes it.

1. **Tokens over magic numbers.** Every color, spacing, radius, and font
   size is a CSS variable (`--background`, `--primary`) consumed via
   Tailwind utilities (`bg-background`, `text-primary`). No
   `bg-blue-500`, no `p-[13px]`, no `#abc` in component files.

2. **AI Elements first, custom only when needed.** When a chat primitive
   already exists in [AI Elements](https://elements.ai-sdk.dev) —
   `Conversation`, `Message`, `MessageResponse`, `Reasoning`, `Tool`,
   `Source`, `Sources`, `PromptInput`, `Loader`, `Suggestions` — use
   it. Custom code only when the use case is genuinely new.

3. **Streaming is the only model.** The UI never assumes content is
   fully received. There are explicit states (idle, thinking, streaming,
   complete, error), and every component is rendered with the
   possibility of tokens still arriving.

4. **Citations are non-negotiable.** Every grounded claim links to a
   `source-document` part emitted by the backend (ADR-0018 of the
   backend repo). The Sources footer mirrors the academic citation
   style of the BRH RDDCF corpus — volume / numéro / topic.

5. **Reasoning is operator-grade, not end-user.** End users see the
   answer and the citations. The ReAct trace (`reasoning-start` /
   `reasoning-delta` / `reasoning-end`) is collapsed by default under
   a "Afficher le raisonnement" toggle. Reasoning is for operators and
   power users, not for end users.

6. **French-only.** The BRH corpus and the backend are French-only.
   Every user-facing string — placeholder text, button labels, error
   messages, accessibility labels — is French. (`aria-*` attributes are
   French where spoken; `lang="fr"` set on `<html>`.)

---

## 2. Theming

- **Semantic CSS variables** declared once in `app/globals.css` under
  `:root` (light) and `.dark` (dark). All components reference these
  tokens via Tailwind utilities — never raw color values.
- **OKLCH color format.** More perceptually uniform than HSL across
  hue shifts; recommended for `oklch()` values in token definitions.
  This is the [shadcn default since v4](https://ui.shadcn.com/docs/theming).
- **Dark mode** is class-strategy: a `.dark` class on `<html>`.
  Activation: read `prefers-color-scheme` once at boot, persist user
  override in `localStorage`. Never use the `prefers-color-scheme` CSS
  media query directly — it forces the system preference and ignores
  user intent.
- **Tokens we own** (defined in `globals.css`):
  `background` / `foreground`, `card` / `card-foreground`, `popover` /
  `popover-foreground`, `primary` / `primary-foreground`, `secondary` /
  `secondary-foreground`, `muted` / `muted-foreground`, `accent` /
  `accent-foreground`, `destructive` / `destructive-foreground`,
  `border`, `input`, `ring`, `chart-1`…`chart-5`, `radius`.
- **`cn()` utility** for conditional classes — defined in
  `lib/utils.ts` by the shadcn init. Use it for every conditional
  `className`. `cn()` already resolves `tailwind-merge` utility
  conflicts.
- **Brand color is the BRH institutional navy.** Pulled directly from
  the official [brh.ht](https://www.brh.ht) stylesheet — see
  `docs/brand/BRH-PALETTE.md` for the full extraction. The deep navy
  `#05155b` is the dominant brand color across the BRH site (header,
  splash, primary buttons). It maps cleanly onto the shadcn `primary`
  token. **Default to it.** Switch only if the user requests a
  different accent.

---

## 3. Typography

- **Four sizes.** Body, subheading, heading, display. Mapped to
  Tailwind defaults (`text-sm`, `text-base`, `text-lg`, `text-xl` for
  prose; `text-2xl` / `text-3xl` reserved for page-level display).
- **Two weights.** `font-normal` and `font-semibold`. **No `font-bold`
  except in display headings, and even there, semibold wins.** Adding
  bold is the typography equivalent of adding more accent colors —
  noise.
- **Body line-height: 1.6.** Generous for reading. Tailwind's
  `leading-relaxed` (1.625) or `leading-7` (1.75) on prose content.
- **Max content width: 720–768 px** for the message column. Anything
  wider and line length hurts readability (the WCAG 2.2 SC 1.4.10
  reflow clause; well-established readability research). The viewport
  uses whitespace around this column, not content expansion.
- **Mono font** reserved for code blocks (we don't have them yet but
  the slot exists). Defaults to `JetBrains Mono` or
  `font-mono` Tailwind utility.
- **`leading-trim` / `text-balance`** on headings to avoid awkward
  wrap. Tailwind's `text-balance` utility.
- **BRH font stack** (extracted from brh.ht — the official site uses
  Montserrat + Roboto, with Poppins as a system fallback):
  - **Headings:** `Montserrat`, fallback `ui-sans-serif, system-ui,
    sans-serif`. Weights 600 (`font-semibold`) and 500 (`font-medium`).
  - **Body & UI:** `Roboto`, fallback the same chain. Weights 400
    and 500 only.
  - Both via `next/font/google` so they're self-hosted at build time
    (no third-party font requests, GDPR-friendly).
  - The BRH official site also loads `fontAwesome` for icons — we do
    NOT follow that; we use `lucide-react` (the AI Elements default
    and the Vercel AI SDK pattern).

---

## 4. Spacing

- **8-pt grid.** All spacing values are multiples of 4 or 8. Tailwind's
  `gap-2` (8px), `gap-4` (16px), `gap-6` (24px), `gap-8` (32px).
  **No arbitrary values** (`p-[13px]` is forbidden) unless they are
  justified in a comment referencing the 8-pt grid deviation.
- **`gap-*` with flex/grid only.** No `space-x-*` / `space-y-*`. The
  `gap` utilities are RTL-safe (they map to logical properties).
- **Section padding**: 16 px horizontal on mobile, 24 px on ≥`md`,
  32 px on ≥`lg`. Page-level vertical rhythm via `py-8` / `py-16`.

---

## 5. Color

- **60 / 30 / 10 rule.**
  - 60 % neutral: `bg-background`, `text-foreground`.
  - 30 % complementary: `bg-card`, `text-muted-foreground`, `border`.
  - 10 % accent: one of `primary` (CTAs, focus rings) or
    `destructive` (errors). Never both at the same volume.
- **One accent.** The `primary` token is the only chromatic color in
  any given screen. Reserve `primary` for actions (send button, active
  state, focus ring). Use `secondary` for less important actions.
- **Contrast:** 4.5:1 minimum for body text, 3:1 for UI elements and
  graphical objects. Verified once with axe-core; refuted by data
  whenever a token is changed.
### BRH institutional palette (extracted 2026-07-20 from brh.ht)

These tokens are the live reference for every chroma decision on the
frontend. The full extraction (sources, screenshots, manifest) lives
at `docs/brand/BRH-PALETTE.md`.

| Role                    | Hex       | Where it appears on brh.ht                                   |
|-------------------------|-----------|--------------------------------------------------------------|
| `primary` (BRH navy)    | `#05155b` | Header, splash background, brand wordmark                    |
| `primary-2` (navy alt)  | `#213a8c` | Navigation hover, secondary surfaces                          |
| `accent` (teal)         | `#005c8a` | Links, info highlights, "Taux de Référence" callouts         |
| `destructive` (red)     | `#e02a20` | Hover/data-color accents on social icons (rare)              |
| `muted` (cool grey-bl)  | `#f1f5f9` | Page surface, card backgrounds                                |
| `background` / `fg`     | `#fff` / `#05155b` | Default light theme                                |

**Token-to-shadcn mapping.** Once confirmed:
- `--primary` → `#05155b` → `oklch(...)` form for the shadcn
  default.
- `--primary-foreground` → `#ffffff` (the wordmark dark variant uses
  white text on `#05155b`).
- `--accent` → `#005c8a`.
- `--destructive` → `#e02a20`.
- `--muted` and `--background` → warm neutral (~`#f1f5f9`, with a
  slight blue cast that matches the BRH surface).

**Wordmark / logo.** The BRH ships a "BRH" wordmark in two variants:
- Light variant (white background, navy letters): `Brh_logo.png` at
  251 × 123 px. Source: `https://www.brh.ht/wp-content/themes/brh/img/logo.png`.
- Dark variant (navy background, white letters): `logo-dark.png` at
  251 × 123 px RGBA. Source: `https://www.brh.ht/wp-content/uploads/logo-dark.png`.

Both files live at `public/` (light: `brh-logo-light.png`, dark:
`brh-logo-dark.png`). Use the dark variant on `bg-primary` surfaces,
the light variant on white.
variant on `bg-primary` surfaces, the light variant on white.

### Note on chromatic neutrality

The 60/30/10 rule still binds — even with `#05155b` as `primary`,
the rest of the screen stays neutral. `primary` shows up only on:
the header bar, the focused input ring, the Send button (when not
streaming), the "thinking" dot accent, and active source-chip
borders. Anywhere else, use `muted` or `secondary`.

---

## 6. Components — when to use what

| Need                                          | Use                                                                                |
|-----------------------------------------------|------------------------------------------------------------------------------------|
| Chat container with auto-scroll               | `Conversation` + `ConversationContent` + `ConversationScrollButton` (AI Elements)   |
| Message row (role-based alignment)            | `Message` + `MessageContent` (AI Elements)                                         |
| Markdown rendering with streaming             | `MessageResponse` (AI Elements)                                                    |
| Reasoning block (collapsed by default)         | `Reasoning` + `ReasoningContent` + `ReasoningTrigger` (AI Elements)                 |
| Tool call indicator                           | `Tool` (AI Elements)                                                               |
| Source citations footer                       | `Sources` + `SourcesTrigger` + `SourcesContent` + `Source` (AI Elements)           |
| Prompt input (textarea + submit)              | `PromptInput` + `PromptInputTextarea` + `PromptInputSubmit` (AI Elements)          |
| Stop generating (replaces send mid-stream)    | `PromptInputSubmit` automatic morph (status === 'streaming')                       |
| Buttons, dialogs, dropdowns                   | `shadcn/ui` base components                                                        |
| Loader / pulsing carets                       | `Loader` (AI Elements)                                                             |
| Suggestion chips                              | `Suggestion` + `Suggestions` (AI Elements)                                         |
| New primitive not covered above               | Build on the shadcn primitives; copy into `components/ui/`. Never an `npm` dep.    |

---

## 7. Chat UI specifics

### Reasoning visibility

- **Default: hidden.** End user sees only the assistant's text answer
  and the Sources footer.
- **Collapse trigger:** "Afficher le raisonnement" toggle under the
  answer. Default closed. Reveals the ReAct trace (`Thought / Action /
  Observation` chunks) for power users and operators debugging a
  query.
- **Mapping:** the `reasoning-start` / `reasoning-delta` /
  `reasoning-end` frames emitted by the backend (ADR-0018 in the
  backend repo) map to the `Reasoning` AI Elements component.

### Sources

- Render as a `Sources` footer block below the assistant's text.
- Each source = a `Source` chip with the citation label (`"Vol. 3 — n°1
  — Inclusion financière"`, with the source file as a fallback). Per
  ADR-0015 the corpus is RDDCF — these labels mirror the volume /
  numéro / topic convention of the printed publications.
- **Refusals carry no sources.** When the backend's refusal string is
  in the body, the Sources block is omitted (see `is_refusal` in
  backend `src/query/refusal.py`).
- No inline `[N]` superscript markers in v1. Source chips are the
  citation surface. Inline markers can be added later (Phase 2) when
  the LLM emits them reliably.

### Refusals

- When the backend refuses, the assistant message renders the refusal
  text in the standard `Message` styling (no error colour, no badge).
- **A refusal is an answer.** It is not a failure state. The user's
  next action is to rephrase, not to retry the same question.

### Errors

- Stream-aware errors (the `error` part in the Vercel AI SDK UI
  Message Stream Protocol) render as an inline message in the
  conversation, via `useChat`'s `error` state.
- Each error has **one line human-readable** + **one recovery action**.
  The action button re-submits the last user message.
- **Never a blank toast or a silent drop.** Six failure modes we
  distinguish explicitly (per
  [Metacto](https://www.metacto.com/blogs/ai-chat-ux-patterns-production)):
  pre-stream network drop, mid-stream network drop, provider 5xx /
  rate limit, content-filter refusal, tool error, in-stream error
  event. Each maps to a different message + a different button label.

### TTFT and streaming signal

- Show a `Loader` immediately when the user hits Send.
- Replace it with the first `text-delta` token — **no fade, no delay**.
- A pulsing caret or `Loader` dot at the end of the streaming text
  until the stream finishes. (Cursor uses a thin bar; ChatGPT a
  pulsing dot; Claude.ai a small square. Any of these work; consistency
  matters more than the choice.)

### Stop generating

- The `PromptInputSubmit` morphs into a Stop button when
  `status === 'streaming'` (AI Elements handles this).
- **Same physical slot, same size, same position** as the Send button.
  No hunt, no menu.
- **`Esc` bound at the page level** when the composer is focused or
  generation is active.
- After stop: the partial response **stays visible**, marked as
  interrupted, with options to keep / edit-and-resend / discard.

---

## 8. Streaming UX

- **Auto-scroll rule.** Auto-scroll only when the viewport is within
  ~100 px of the bottom at the moment a delta renders. If the user
  has scrolled up, lock the position and show a "Jump to latest"
  floating button (Perplexity behaviour; see Setproduct).
- **Memoization discipline.** The prior message list
  (`messages.slice(0, -1)`) is memoized — its references do not
  change on stream delta. Only the **tail** (`messages[messages.length - 1]`)
  re-renders per token. Use `React.memo` with a shallow-equality
  check keyed on message id and trailing text length.
- **Stable references.** Each part renderer (text, reasoning, tool,
  source) is individually memoized so unchanged parts bail out even
  within the active message.
- **`useChat`'s built-in throttle** is fine for the default case
  (~50 ms ≈ 20 Hz). Don't roll our own.
- **Markdown buffering.** Buffer partial tokens for incomplete
  constructs (`**partial`, unclosed code fences). The
  `MessageResponse` component (AI Elements) handles this; do not
  roll our own markdown renderer.

---

## 9. Accessibility

### ARIA

- The message list has `role="log"` with `aria-live="polite"` and
  `aria-atomic="false"` — only the new message is announced, not the
  full history. We **don't** announce every streamed token — that's
  an overwhelming flood of audio (callsphere.ai / WCAG authors all
  warn against this).
- A **separate `role="status"` region (`sr-only`)** announces
  transient state changes only:
  - `"L'agent réfléchit…"` at the start of a turn.
  - `"Réponse reçue"` at the end of a turn.
  - `aria-live="assertive"` only for true errors.
- Each message carries a screen-reader-only header naming the sender
  (`"Utilisateur"` / `"Agent"`), an `aria-label` on the article
  container, and a timestamp in machine-readable form.

### Focus

- **Auto-focus** the `PromptInput` on page load.
- **After sending**, focus stays on the input. **No focus theft** when
  a new message arrives.
- **Dialogs and source expanders** trap focus inside and return focus
  to the trigger on close (Radix primitives handle this; do not
  override).
- Visible focus indicator on every interactive element. `outline: none`
  is forbidden without a replacement (`focus-visible:ring-2
  focus-visible:ring-ring`).

### Keyboard

- All controls reachable via `Tab` / `Shift+Tab`. Logical order:
  composer → send/stop → message rows (per-message actions) → global
  header actions.
- `Cmd+Enter` (macOS) / `Ctrl+Enter` (Win/Linux) sends. `Shift+Enter`
  inserts a newline. Standard convention — match Claude.ai / Cursor.
- `Esc` stops generation when active; closes open dialogs /
  expanded source cards otherwise.
- **Up / Down arrows** navigate between messages in the history when
  the conversation list is the active surface.

### Visual

- 4.5:1 contrast for body text, 3:1 for UI elements and graphical
  objects (WCAG AA).
- Body text ≥ 14 px, timestamps ≥ 12 px, **never below 11 px** anywhere.
- **Don't rely on color alone.** Distinguish user / assistant by
  position (left or right alignment) AND a `role` attribute AND an
  avatar — three axes, not just colour.
- Respect `prefers-reduced-motion`. Disable shimmer / pulse /
  caret blink in this mode.

### Testing (three-layer matrix)

The WCAG literature converges on ~30–40% automated coverage. The rest
needs human eyes and ears.

1. **Automated.** `axe-core` (or Lighthouse a11y audit) on every PR
   to the chat page. CI gate.
2. **Manual keyboard.** Tab through the entire UI without a mouse on
   every release. Verify focus visibility, tab order, and that no
   interactive element is unreachable.
3. **Screen reader.** VoiceOver (macOS) + NVDA (Windows). Verify
   announcement timing for `aria-live` regions, message order, and
   that the streaming announcement fires exactly once at turn end.

Two screen readers, every release. If we only ever test with one, we
ship a UI half the world can't use.

---

## 10. Anti-patterns — what NOT to do

These are the things we have explicitly rejected.

- ❌ **Raw hex / oklch in component files** (`bg-blue-500`,
  `text-[#abc]`). Breaks theming and dark mode.
- ❌ **Manual `dark:*` classes.** Use semantic tokens; dark mode is
  handled by `.dark`.
- ❌ **`space-x-*` / `space-y-*`.** Use `gap-*`. RTL-unsafe.
- ❌ **Magic-number spacing** (`mt-3 mb-5 p-2` not on the 4-pt grid).
- ❌ **Custom `@keyframes` animation.** Use shadcn's `shimmer` /
  `scroll-fade` utilities. Don't add animation primitives.
- ❌ **`outline-none` without a replacement** focus indicator. Always
  provide a visible focus state via `focus-visible:ring-*`.
- ❌ **Raw `size-4` on icon children of shadcn components.** The
  components handle icon sizing via `data-icon`. Add `size-*`
  utilities only on standalone icons.
- ❌ **Auto-scroll when the user scrolled up.** Violates the
  Perplexity / Setproduct rule.
- ❌ **Steal focus from the input when a new message arrives.** Use
  the live region to announce, don't move the caret.
- ❌ **Bubble UI for assistant messages.** Messenger framing
  undermines tool framing for serious chat (Claude / Cursor /
  Perplexity / ChatGPT all use full-width assistant messages). Use
  alignment + role to distinguish.
- ❌ **Generic error toasts.** "Something went wrong" forces the
  user to guess. Each error type ships a specific message + a
  recovery action.
- ❌ **Forever-spinning "thinking dots".** When the agent emits
  reasoning, show it (under the collapsible). When it doesn't, don't
  fake it. Animation that runs forever erodes trust.
- ❌ **Per-token `aria-live` announcements.** Announce stream-start
  and stream-end only, per callsphere.ai and W3C ARIA APG.
- ❌ **Anthropomorphic persona without transparency.** The agent is
  the BRH RDDCF assistant, named plainly. No stock-photo avatar.
  No fictional name. No "I'm a real person" framing.
- ❌ **Showing every captured source verbatim.** The Sources footer
  is a chip list, not a wall of citations. Show what was used,
  curated; not everything that was retrieved.

---

## 11. Component-local overrides

When a one-off style override is needed (a specific surface needs a
non-standard tweak), do it with a Tailwind utility class passed via
`className` at the call site — **not** by editing the shared component
file. The shared component is a stable system; per-call-site styling is
the expectation.

**Exception:** a genuinely new variant (e.g. a "warning" message
type that doesn't exist yet) goes into the component file with a `cva`
entry. Document the decision as a new entry below.

| Component | Variant | Reason | Date |
|---|---|---|---|
| _(none yet)_ | | | |

---

## 12. Versioning

This doc follows semver.

- **v1.x — backward-compatible additions.** New anti-pattern, new
  component recommendation, new failure-mode mapping.
- **v2.x — breaking changes.** Switching reasoning visible-by-default,
  adding a new theme, swapping `useChat` for a non-Vercel transport.

When updating, append a row to the **Changelog** at the bottom and
bump the header (`Version:` line).

When a rule here is contradicted by a decision in
`/home/lourvens/project/brh-intelligence-queryengine/docs/adr/`,
the backend ADR is authoritative for shared concerns; bump this doc
to record the alignment.

---

## Changelog

- **2026-07-20 — v1.1.** Filled in the BRH institutional palette
  (extracted live from brh.ht via `agent-browser` + `curl`):
  `primary = #05155b` (BRH navy), `accent = #005c8a` (BRH teal),
  `destructive = #e02a20`, BRH wordmark in light/dark variants
  saved to `public/`, BRH font stack added
  (Montserrat headings + Roboto body, via `next/font/google`).
  See `docs/brand/BRH-PALETTE.md` for the full extraction (sources,
  screenshots, hex dump). The 60/30/10 rule still binds — these are
  the chroma accents, not the volume.

- **2026-07-20 — v1.0.** Initial principles set. Establishes
  semantic-token theming (no raw colors), AI-Elements-first
  composition, reasoning-collapsed-by-default, full-width assistant
  messages, polite live region for non-stream announcements, 8-pt
  spacing grid, 60/30/10 color rule, the WCAG-aligned accessibility
  matrix (axe + keyboard + VoiceOver + NVDA). Sources from the
  Exa research sweep over `ai-sdk.dev`, `ui.shadcn.com`,
  `aiuxdesign.guide`, `callsphere.ai`, `setproduct.com`,
  `jasonlaster.com`, `lazarev.agency`, `metacto.com`, `thefrontkit.com`,
  `spiderhunts.com`, `sourcefeed.dev`, and the academic literature on
  source transparency & citation presentation.
