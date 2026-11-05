# Story 1.1: Set up the project

Status: review

## Story

As Luka,
I want the empty game running in Chrome on the tablet and checked on every push,
so that every later story lands on a working base whose rules are enforced.

**Covers:** architecture setup, boundaries, error handling and CI; NFR5, NFR6.

## Acceptance Criteria

1. **Given** a fresh clone **When** `npm ci` and `npm run dev -- --host` run on the PC **Then** the game opens at `http://<PC IP>:5173` in Chrome on the Android tablet, showing an empty 1600 × 1000 logical scene in `SceneRoot`, scaled to fit, with a placeholder notebook area beside it **And** `package.json` pins the architecture's versions exactly, with `"type": "module"` and `"private": true`, `.npmrc` has `save-exact=true`, and `tsconfig.json` matches the architecture's (no `baseUrl`; `moduleResolution: "bundler"`)
2. **Given** development mode under React StrictMode **When** the app mounts **Then** `SceneRoot` survives the double mount of `@pixi/react`'s `<Application>` with one working canvas and no console errors
3. **Given** the tablet in portrait **When** the game is open **Then** an overlay asks to turn it, with its text from `src/content/text/hr.ts`, and disappears in landscape
4. **Given** the project **When** `npm run check`, `tsc --noEmit`, `npm test` and `npm run build` run **Then** all pass, and GitHub Actions runs them on every push (deployment comes in epic 6)
5. **Given** `src/architecture.test.ts` **When** a file in a pure folder imports `react`, `pixi.js`, `zustand`, `motion`, `ui/`, `store/`, `save/` or `audio/`, or a file in `ui/` or `app/` contains č, ć, đ, š or ž **Then** the test fails, shown by fixtures inside the test; `immer` is allowed in pure folders
6. **Given** a render error, a `window.onerror` or an `unhandledrejection` **When** it happens **Then** the error boundary shows the in-fiction "tap to restart" screen, the tap reloads the game, and the error is written to `matematika:errors`
7. **Given** the WebGL context is lost (forced with `WEBGL_lose_context`) **When** it is restored, or the page becomes visible again while it is still lost **Then** the scene remounts without a page reload

## Tasks / Subtasks

- [x] Scaffold by hand: `package.json`, `.npmrc`, exact installs from the architecture's Setup Commands (no Playwright browsers) (AC: 1)
- [x] `tsconfig.json`, `vite.config.ts` (with Vitest config and the `@/` alias), `biome.json`, limited to the app's own files (AC: 1, 4)
- [x] `index.html`, `src/main.tsx`, `src/app/` (App, error boundary, portrait overlay), `src/ui/scene/SceneRoot.tsx`, `src/content/text/hr.ts` (AC: 1, 2, 3, 6)
- [x] Context-loss watcher and remount in `SceneRoot` (AC: 7)
- [x] `src/architecture.test.ts` with fixtures (AC: 5)
- [x] `scripts/check-size.ts`, `.github/workflows/ci.yml` (AC: 4)
- [x] Unit tests; `npm run check && npm test && npm run build` green; dev server over LAN and StrictMode checked in a browser (AC: 1–7)
- [ ] **Luka:** open `http://<PC IP>:5173` in Chrome on the tablet, in landscape and portrait (AC: 1, 3). See "For Luka" below.

## Dev Notes

- **Stack and commands:** architecture, Development Environment (exact versions, scripts, `tsconfig.json` options). TypeScript 7 removed `baseUrl`; `paths` alone carries `@/*`.
- **Structure:** architecture, Project Structure. `app/` holds App, the error boundary and the portrait overlay; `ui/scene/SceneRoot.tsx` holds `<Application>`, resize, resolution and context loss; all Croatian text in `content/text/hr.ts`.
- **Boundaries:** architecture, Architectural Boundaries table; `architecture.test.ts` scans imports. Pure folders: `math`, `room`, `fight`, `city`, `economy`, `workshop`, `links`, `playlog`.
- **Errors:** architecture, Error Handling. Render crash shows the in-fiction screen, the tap reloads; `window.onerror` and `unhandledrejection` write to `matematika:errors` (last 50). WebGL context loss remounts the scene on `webglcontextrestored`, and on `visibilitychange` back to visible while still lost.
- **Scene:** one logical scene of 1600 × 1000, scaled to fit the area beside the notebook; renderer resolution `min(devicePixelRatio, 2)`; WebGL only (no WebGPU).
- **Input:** `touch-action: none` on the canvas, `manipulation` elsewhere, `overscroll-behavior: none`, no hover states.
- **Security:** production builds get the CSP `<meta>` from `transformIndexHtml`; `main.tsx` imports `pixi.js/unsafe-eval`.
- **CI:** `npm ci` → `biome ci` → `tsc --noEmit` → `vitest run` → `vite build` → size check, on every push. No deployment until epic 6.

### For Luka (tablet check)

1. `npm ci`, then `npm run dev -- --host`. Vite prints a `Network:` address (tonight it was `http://192.168.0.146:5173/`).
2. The first time, Windows Firewall may ask whether Node.js may accept connections: allow it on private networks.
3. On the tablet, open that address in Chrome. Expect the grey-blue gridded 1600 × 1000 sheet, scaled to fit on the left, and the ruled notebook placeholder on the right. Turn to portrait: "Okreni uređaj vodoravno." covers the screen; turn back and it goes.
4. Port 5173 is strict: if something already holds it, the dev server stops with an error instead of moving to another port.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5), unattended overnight run.

### Calls Made

- **CSP and `pixi.js/unsafe-eval` added now**, from the architecture's Security section, although no 1.1 criterion names them; the production preview runs under the CSP with no violations.
- **Vite `base` stays `/`.** `/matematika/` for GitHub Pages waits for the hosting decision (ADR-10, epic 6), so the tablet URL is plain `:5173/`.
- **`server.port: 5173` with `strictPort`**, so the tablet's address never drifts silently.
- **`.gitattributes` with `* text=auto eol=lf`.** Git for Windows here has `core.autocrlf=true`; without it a fresh Windows clone has CRLF files and `npm run check` (Biome, LF) fails.
- **`tsconfig.json` adds what TypeScript 7 needs beyond the architecture's list:** `target`/`lib` ES2023 + DOM, `types: ["node", "vite/client"]` (the default became `[]` in TS 6), `skipLibCheck`, and an `include` list limited to the app's own files.
- **`architecture.test.ts` enforces the whole Boundaries table, not only the criterion's list:** pure folders may import only `immer`, other pure folders, `config` and `lib` (tests also `vitest`, `fast-check`, `node:*` and `content`); only `ui/scene` imports Pixi; `ui` never imports `save`, `audio` or `store/effects`; `store` never imports `ui` or `app`; `content` imports only other content and types from pure folders. Type-only imports count.
- **DOM and storage globals in pure folders are caught by Biome** (`noRestrictedGlobals`), which reads the syntax tree; Biome's `noRestrictedImports` mirrors the import rules in the editor.
- **Caught crashes are written to `matematika:errors` in development too.** The architecture's `log.error` writes there only in production; the criterion says the error is written, so the boundary and global handlers always write. The log lives in `src/lib/error-log.ts` (lib, so the later `log.error` can use it).
- **Chrome's benign "ResizeObserver loop" error is ignored** by the global handler, so it never shows the crash screen.
- **Placeholder texts in `hr.ts`:** "Stroj se zaglavio." / "Dodirni za ponovno pokretanje." / "Okreni uređaj vodoravno.", ungendered imperatives.
- **Notebook placeholder width `clamp(240px, 32%, 440px)`**; story 1.6 sets the real layout.
- **No empty pure folders were created;** each appears with its first story.
- **`playwright.config.ts` only sets `testDir: './e2e'`;** no browsers downloaded, no specs until epic 5.
- **CI uses `actions/checkout@v7` and `actions/setup-node@v7` (latest majors) with Node 26, on push only.**
- **Vite's chunk-size warning raised to 2,000 kB**, because Pixi alone passes 500 kB; the real budget is `check-size.ts` (30 MB total; it also reports gzipped JavaScript against the 1 MB target).
- **`biome migrate` replaced `"recommended": true` with `"preset": "recommended"`** (deprecated in Biome 2.6).
- **A remount also re-reads `devicePixelRatio`** (seen in testing: the first load ran at ratio 1 before the browser settled on 1.5).
- **No in-fiction "no WebGL" screen yet** (not a 1.1 criterion); a failed Pixi init lands on the crash screen through `unhandledrejection` for now.

### Completion Notes

- `SceneRoot` relies on `@pixi/react` 8.0.5's own StrictMode handling (its unmount queue cancels the simulated unmount while `init` is pending). Remounting is a new `key` on `<Application>`; the watcher is detached first, because Pixi's `destroy` calls `loseContext` on purpose. Destroying keeps textures (Pixi's default `destroy()`).
- Remounting after a loss that was never restored logs the browser warning "WebGL: INVALID_OPERATION: loseContext: context already lost" (Pixi's `destroy` on a lost context). It is a warning, not an error, and only on that path.
- `ResizeObserver` on the scene area calls `app.queueResize()`, so layout changes beside the canvas also refit it, not only window resizes.

### Test Results

- `npm run check` (Biome CI): 26 files, no errors. `tsc --noEmit`: no errors.
- `npm test`: 8 files, 120 tests passing (`architecture.test.ts` fixtures and the real tree; `error-log`, `crash`, `ErrorBoundary`, `PortraitOverlay`, `fit-scene`, `context-loss`, `check-size`).
- `npm run build`: 0.85 MB in 9 files; JavaScript 0.25 MB gzipped.
- In the desktop app's browser (Chromium), dev server started with `--host`:
  - Over the LAN address `http://192.168.0.146:5173` (an insecure context, like the tablet): one canvas, WebGL 2, resolution 1.5 at ratio 1.5, no console errors under StrictMode.
  - Scene fit: an 868 × 800 area gives scale 0.5425, centred at y = 128.75; at 640 × 360 the canvas follows the area and nothing scrolls.
  - Portrait 400 × 700: the overlay shows with the hr.ts text; landscape 640 × 360: it is hidden.
  - `WEBGL_lose_context`: lose then restore gave a new canvas without a reload. Lose, then `visibilitychange` while still lost, also gave a new canvas. One canvas each time, no crash screen.
  - `setTimeout(() => { throw … })` and `Promise.reject(…)` each showed the crash screen and wrote a `matematika:errors` entry (`error`, `unhandledrejection`); tapping reloaded the page. A real render error (during hot reload) was caught by the boundary and written with its component stack. Test entries were removed afterwards.
  - Production build via `vite preview`: CSP meta present, no CSP violations, no console messages, only same-origin requests.
- Not checked tonight: the Android tablet itself (Luka, above); GitHub Actions (nothing pushed), whose commands pass locally.

### File List

- `.gitignore` (modified), `.gitattributes`, `.npmrc`, `package.json`, `package-lock.json`
- `tsconfig.json`, `vite.config.ts`, `biome.json`, `playwright.config.ts`, `index.html`
- `.github/workflows/ci.yml`
- `scripts/check-size.ts`, `scripts/check-size.test.ts`
- `src/main.tsx`, `src/architecture.test.ts`
- `src/app/App.tsx`, `src/app/ErrorBoundary.tsx`, `src/app/ErrorBoundary.test.tsx`, `src/app/PortraitOverlay.tsx`, `src/app/PortraitOverlay.test.tsx`, `src/app/crash.ts`, `src/app/crash.test.ts`, `src/app/app.css`
- `src/ui/scene/SceneRoot.tsx`, `src/ui/scene/fit-scene.ts`, `src/ui/scene/fit-scene.test.ts`, `src/ui/scene/context-loss.ts`, `src/ui/scene/context-loss.test.ts`
- `src/lib/error-log.ts`, `src/lib/error-log.test.ts`
- `src/art/palette.ts`, `src/content/text/hr.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified), this story file
