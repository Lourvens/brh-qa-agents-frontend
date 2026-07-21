---
name: agent-browser-frontend-smoke
description: Use `agent-browser` CLI to smoke-test the BRH Intelligence QueryEngine frontend (localhost:3000) — visual verify chrome, snapshot the accessibility tree, exercise a chat turn, and read mid-stream state
---

# `agent-browser` — BRH frontend smoke-test skill

Use the `agent-browser` CLI (v0.x; in this env at
`/home/lourvens/.bun/bin/agent-browser`) to drive the BRH frontend
end-to-end:

- **Visual smoke:** open `localhost:3000`, screenshot, verify
  the BRH chrome (header wordmark, primary navy, French copy).
- **Accessibility snapshot:** `snapshot -i` — verify `lang="fr"`,
  `role="log"` on the conversation, focus state on the prompt
  input, axe-passable contrast on the primary CTA.
- **Chat interaction:** focus the textarea, type a question about
  RDDCF (e.g. *"Que dit la RDDCF sur l'éducation financière?"*),
  submit, screenshot the streaming + final state with sources.
- **External site brand reconnaissance:** (separate use case,
  document only) `agent-browser` + `curl` to extract brand
  tokens from `brh.ht` and other institutional sites.

The frontend is a Next.js 16 App Router app at
`/home/lourvens/project/brh-intelligence-queryengine-frontend/`.
See the front-end's `docs/UIUX-PRINCIPLES.md` for what the visual
chrome SHOULD look like (BRH palette, Montserrat/Roboto, French
strings) so the smoke test has a reference.

## When to invoke

- After landing a UI change, before reporting it done.
- When the build is green but you want a sanity check the page
  actually renders (CSS only fails at runtime).
- After upgrading a shadcn / AI Elements bundle.
- When validating focus management, role=log live region, or any
  ARIA structure that lint can't catch.
- When the user asks "does it work?" — this is the canonical
  answer.

Do **not** invoke for unit tests (run pytest), backend smoke
(curl `/ask`), or build verification (`bun run build`). This
skill is for the rendered, interactive surface only.

## Pre-flight (mandatory)

Per the project-wide rule, **probe before starting anything**:

```bash
curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/
curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/status
curl -s -o /dev/null -w '%{http_code}' http://localhost:6006/healthz
```

- If `:3000` returns 2xx, **reuse** the running dev server — do
  not start another.
- If `:3000` is down, start it: `cd
  /home/lourvens/project/brh-intelligence-queryengine-frontend &&
  BRH_BACKEND_URL=http://localhost:8000 bun next dev --port 3000 &`.
  Wait until the next log line reads "Ready" before proceeding.
- If `:8000` is down, start it from the backend project: `cd
  /home/lourvens/project/brh-intelligence-queryengine &&
  .venv/bin/uvicorn src.api.app:app --port 8000 &`. Wait for
  `Application startup complete` before proceeding.

**Mandatory env flag for this Linux env:** every `agent-browser` command
needs `--args "--no-sandbox"` because Chrome's user-namespace sandbox
is blocked on this distro. See "Gotchas" below.

## Common patterns

### Open the page and screenshot the chrome

```bash
agent-browser close --all
agent-browser --args "--no-sandbox" open http://localhost:3000
agent-browser wait 4000                # let hydration settle
agent-browser screenshot /tmp/brh-smoke.png
```

Useful when: any UI change that affects header, theme, or first
paint. Compares against the BRH chrome spec in
`docs/UIUX-PRINCIPLES.md` and the live `brh.ht` reference in
`docs/brand/BRH-PALETTE.md`.

### Accessibility snapshot (interactive-only by default)

```bash
agent-browser snapshot -i
```

`-i` filters out non-interactive nodes (text, decorative spans).
Look for:
- `<html lang="fr">` in the root `<html>` element (use
  `agent-browser get attr <html> lang`).
- `role="log"` on the conversation container
  (`role="log" aria-live="polite"` per the principles doc §9).
- The prompt textarea labelled in French
  (`aria-label="Posez une question sur la RDDCF…"`).
- A `<header>` containing the BRH wordmark `<img alt="Banque de
  la République d'Haïti" …>`.

If any of those is missing, the principles doc was breached — fix
the component before reporting done.

### Smoke-test a chat turn end-to-end

```bash
agent-browser snapshot -i | grep -E 'message|textarea|PromptInput'
agent-browser find role textbox fill "Que dit la RDDCF sur l'éducation financière ?"
agent-browser keyboard press Enter   # or click the submit button
agent-browser wait 3000              # first tokens
agent-browser screenshot /tmp/brh-streaming.png
agent-browser wait 8000              # let it finish
agent-browser screenshot /tmp/brh-final.png
```

Then read the final PNG and verify: the BRH navy header, the
assistant message body (in French), the "Voir les sources" /
"Voir la source" trigger, and that the prompt input is empty
again (state cleared on submit).

### Confirm the wire contract

```bash
# Hit /api/chat directly with a real message and inspect the SSE.
curl -N -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"id":"u1","role":"user","parts":[{"type":"text","text":"Que dit la RDDCF sur l'inclusion financière ?"}]}]}'
```

Expect the first frame: `data: {"type":"start","messageId":"..."}`.
Followed by `reasoning-start` / `reasoning-delta` /
`reasoning-end` and either `text-delta` (the assistant answer) or
`source-document` parts with `mediaType:"file"`.

### Read mid-stream state

```bash
agent-browser eval 'document.querySelectorAll(\"[data-message-role]\").length'
```

Patterns our message components tend to set:
- `data-state="streaming"` on the currently-streaming message.
- `data-slot="reasoning-trigger"` (AI Elements reasoning).
- A `Sources` block with `data-state` open / closed.

Use the AI Elements component names as `data-slot` selectors —
they are stable.

## Gotchas

1. **Chrome sandbox blocks in this env.** You will see:
   ```
   No usable sandbox! If you are running on Ubuntu 23.10+
   ```
   Always pass `--args "--no-sandbox"` to `agent-browser`. If the
   daemon is already running without it, `agent-browser close --all`
   first, then re-open with the flag.

2. **Empty `document.body` immediately after `open`.** The page
   is a Next.js SPA — hydration takes a beat. Always
   `agent-browser wait 3000..6000` before reading computed styles
   or taking a screenshot.

3. **`eval 'expr'` returns `""` for void expressions.** Use
   either a function form `eval '(() => ... )()'` or use
   `WebFetch` / `curl` for HTML extraction. For brand extraction
   from external sites, `curl https://brh.ht | grep '#…'` is faster
   and more reliable than `agent-browser eval` — see
   `docs/brand/BRH-PALETTE.md` for the proven extraction pattern.

4. **Don't leak the dev server.** When the smoke test finishes,
   `pkill -f "next dev"` only if the session-end cleanup didn't
   already do it. Verify ports clear with `ss -tlnp | grep
   -E ':(3000|8000)\b'`.

5. **Use `WebFetch` for prose, `agent-browser` for visuals.** If
   you only need the page text or a JSON dump, `WebFetch` is
   cheaper and doesn't require a browser. Reach for
   `agent-browser` only when you need pixels, the accessibility
   tree, or interactive verification.

## Output checklist

After a smoke test, you should be able to answer:

- [ ] Is the BRH wordmark rendering (dark variant on navy header)?
- [ ] Is `lang="fr"` set on `<html>`?
- [ ] Are user-facing strings in French ("Assistant RDDCF", "Voir
      les sources", "Posez une question sur la RDDCF…")?
- [ ] Does the streaming response start within ~2 s of submit?
- [ ] Does the final response include a Sources block when the
      answer cites documents?
- [ ] Does `Cmd+Enter` (or `Ctrl+Enter` on Linux) submit the form?

If any answer is "no", the change is not done. Iterate on the
component, then re-run this skill.
