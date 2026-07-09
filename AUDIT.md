# Neina Codebase Audit — Bugs Found & Fixes Applied

**Date:** 2026-07-08
**Scope:** Full repository sweep — resume tailoring (Inngest AI workflows), interviews, payments (Polar + Paystack), auth/session, dashboard, recruiter tools, resume editor/preview/PDF, tests, and build configuration.
**Method:** Full TypeScript compile of the project (`tsc --noEmit`), Prisma schema cross-checks, SDK signature verification against installed packages, Jest suite, and a production `next build`.

**Result: 17 issues found. All fixed. `tsc` is clean, all 42 Jest tests pass, and `next build` completes successfully.**

---

## 1. Critical — features that were broken at runtime

### 1.1 Resume tailoring crashed on every single run
**File:** `inngest/tailored.ts`
**Bug:** The `tailoredResumeCreated` Inngest function referenced five agent networks that did not exist anywhere (`nudgeTailoringNetwork`, `fullTailoringNetwork`, `refineTailoringNetwork`, `enrichTailoringNetwork`, `keywordsTailoringNetwork`), the keyword helper referenced a missing `keywordExtractionNetwork`, and the variable `resumeContent` was used without ever being declared. These were left over from a half-finished refactor (an unused `tailoringOrchestratorNetwork` was built to replace them but never wired in). Every "tailor my resume" request threw a `ReferenceError` — and the catch block then **deleted the user's tailored resume record**.
**Fix:** Rebuilt the six single-agent networks using the same pattern as the existing `coverLetterNetwork` (each agent's lifecycle writes its JSON output to `network.state.data.<agentId>`, which is exactly what the function reads back). Declared `resumeContent` from `event.data.content`, handling both the markdown (create) and JSON-string (retailor) payloads that `trpc/routers/_resume.ts` sends.

### 1.2 Polar subscription cancellation silently did nothing — users kept getting charged
**File:** `trpc/routers/_payment.ts`
**Bug:** `cancelSubscription` called `polar.subscriptions.cancel(...)`, a method that does not exist in the installed `@polar-sh/sdk` (v0.46). The call threw, the `catch` block logged a warning and carried on, and the procedure reported success — so the user's plan looked cancelled in the app while Polar continued billing them.
**Fix:** Replaced with `polar.subscriptions.update({ id, subscriptionUpdate: { cancelAtPeriodEnd: true } })`, the SDK's graceful cancel (access continues to period end; the existing `onSubscriptionRevoked` webhook then downgrades the user).

### 1.3 Polar checkout creation used a removed API shape — international payments broken
**File:** `trpc/routers/_payment.ts` (plan checkout **and** credit/minute top-ups)
**Bug:** Both `polar.checkouts.create` calls passed `productId: ...` and `customerExternalId: ...`. In SDK v0.46 these fields are `products: [...]` and `externalCustomerId`. The API rejects the request, so no international user could check out. The `externalCustomerId` one is especially important: the webhook fulfillment in `lib/auth.tsx` looks users up by `customer.externalId`, so even a checkout that succeeded wouldn't have credited the right account.
**Fix:** Updated both call sites to `products: [productId]` and `externalCustomerId: user.id`.

### 1.4 Dashboard job matching read a field that doesn't exist — every match score was random
**File:** `app/api/user/dashboard/route.ts`
**Bug:** The job scorer read `job.job_skills?.skill_text`. There is no `job_skills` relation on the `jobs` model (and the query didn't select it), so the skills list was always empty and **every job fell into the fallback branch: `Math.floor(Math.random() * 30)`**. The "top matched jobs" on the dashboard were random numbers.
**Fix:** Selected the `qualifications` string array (the field the schema actually has) and matched user skills against it.

### 1.5 Suspension check and role-based nav were type-blind
**Files:** `auth-client.ts`, `lib/auth.tsx`, `components/auth/SuspensionGuard.tsx`, `components/sidebar/nav-main.tsx`, `trpc/routers/_payment.ts`
**Bug (two parts):**
1. In `auth-client.ts` the Polar plugin was added as `polarClient() as any`. An `any` element widens the whole `plugins` array to `any[]`, which destroys the `inferAdditionalFields<typeof auth>()` typing — so `useSession()` lost `isSuspended`, `role`, and every other custom field on the client.
2. `polarCustomerId` / `polarSubscriptionId` were never registered in better-auth's `additionalFields`, so the server session in `_payment.ts` couldn't see them either.
**Fix:** Cast the plugin to `BetterAuthClientPlugin` instead of `any`, and registered both Polar fields in `additionalFields` (`input: false` so clients can't write them).

---

## 2. High — broken UI behavior and crash paths

### 2.1 `ResumePreview` used an unimported type
**File:** `components/resume/tailored/ResumePreview.tsx` — `ResumePreviewItem` was used in three places but never imported (it lives in `./templates/ClassicSingle`). Broke compilation of the whole tailored-resume preview. **Fix:** added it to the existing import.

### 2.2 Interview API routes had the wrong Next.js 15 params type
**Files:** `app/api/interviews/[id]/route.ts`, `app/api/interviews/[id]/analyze/route.ts`
In Next 15, `params` is a `Promise`. The code correctly `await`ed it but the signature declared the old sync shape, which fails Next's route-type validation during `next build`. **Fix:** typed `params: Promise<{ id: string }>`.

### 2.3 Tailored-resume page read the wrong score field
**File:** `app/(root)/resume/tailored/[id]/page.tsx`
The query can return either a `TailoredResume` (field: `scores`) or a primary `Resume` (field: `scoreData`); the page read `.scores` unconditionally. **Fix:** narrowed with `'scores' in resume` and fell back to `scoreData`. *(Note: the schema itself is inconsistent — see §5.)*

### 2.4 Word-match score bar never showed its color
**Files:** `components/ui/progress.tsx`, used by `components/resume/tailored/KeywordInsights.tsx`
`KeywordInsights` passed `indicatorClassName` (green/orange/red by score) but the `Progress` component didn't accept that prop. **Fix:** added `indicatorClassName` support to `Progress`.

### 2.5 Custom sections editor could crash on non-array data
**File:** `components/resume/editor/CustomSections.tsx`
The delete-entry handler spread the raw `customSections` prop (`[...customSections]`), which crashes when the AI returns the `Record` shape instead of an array. The component even had a `safeCustomSections` guard — it just wasn't used here. **Fix:** spread `safeCustomSections`.

### 2.6 Recruiter resume sheet: possible undefined access
**File:** `components/recruiter/ResumePreviewSheet.tsx` — `resume.name` where `resume` can be `undefined`. **Fix:** `resume?.name || candidateName`.

### 2.7 Landing page Lenis smooth-scroll ref was untyped
**File:** `components/landing/LandingPageClient.tsx` — `useRef()` with no argument (invalid in React 19 types) and an untyped `time` param; the ref then didn't match `ReactLenis`'s expected `LenisRef`. **Fix:** `useRef<LenisRef | null>(null)` and `time: number`.

---

## 3. Medium — type-system defects that hid bugs

### 3.1 `customSections` union made whole files un-typecheckable
**Files:** `components/resume/editor/types.ts`, `components/resume/pdf/ResumePDF.tsx`, `lib/converter.ts`
The inline `customSections?: {...}[] | Record<string, any>` union leaked `any` into every consumer (implicit-any errors, non-iterable spread errors). **Fix:** extracted a named `CustomSection` interface and normalized to `CustomSection[]` at each boundary (`Array.isArray` guard).

### 3.2 Skill helpers had an impossible-to-call signature
**File:** `lib/utils.ts` — `handleSkillArrayChange`, `addSkill`, `removeSkill` typed their category param as `keyof NonNullable<ResumeExtraction['skills']>`. Since `skills` is a union of a record and an array, that `keyof` collapses to array method names (`"push" | "slice" | ...`), so no real category like `"technical"` could ever be passed legally. **Fix:** typed the param as `string` (matching the runtime behavior, which already treats skills as a record).

### 3.3 Missing `JSX` namespace (React 19)
**File:** `components/resume/editor/ExperienceSection.tsx` — global `JSX.Element` no longer exists in React 19 types. **Fix:** `React.JSX.Element` with a React import.

### 3.4 `dragula` had no type declarations
**Files:** `components/resume/editor.tsx`, `components/resume/tailored/ResumeForm.tsx` — untyped import produced implicit-any errors across both drag-and-drop editors. **Fix:** installed `@types/dragula` (dev dependency).

---

## 4. Tooling & tests

### 4.1 Cypress's chai types clobbered Jest's `expect` project-wide
**File:** `tsconfig.json`
The main tsconfig included `cypress/**`, whose `/// <reference types="cypress" />` pulls chai's global `expect` into the same program as Jest's — every Jest matcher (`toBe`, `toBeInTheDocument`, …) became a type error. **Fix:** excluded `cypress/` and `cypress.config.ts` from the app tsconfig (Cypress runs with its own config).

### 4.2 Stale unit tests written against removed APIs
**Files:** `app/__test__/AddressSection.test.tsx`, `app/__test__/utils.test.ts`
- `AddressSection` gained required `personalInfo` / `handlePersonalInfoChange` props the tests never passed. **Fix:** added them to the test props.
- `utils.test.ts` used keys that no longer exist on `ResumeExtraction` (`'name'` → `'profile'`, address `'city'` → `'location'`) and constructed `AgentResult` (a class) as a plain literal. **Fix:** updated to the current API.

---

## 5. Known remaining issues (documented, not changed)

These are design-level inconsistencies I deliberately did not change without your sign-off:

1. **Schema naming inconsistency:** `Resume.scoreData` vs `TailoredResume.scores` hold the same kind of data under different names. A migration renaming one of them would remove the union-narrowing workarounds.
2. **`analysisData` is double-encoded:** `inngest/tailored.ts` writes `JSON.stringify(...)` into a Prisma `Json` column, so readers must handle both string and object shapes (the page already does). Storing the object directly would be cleaner.
3. **Dead code:** the unused `tailoringOrchestratorNetwork` in `inngest/tailored.ts` (the abandoned refactor that caused bug 1.1). Safe to delete once you confirm the per-mode networks are the intended design.
4. **Random fallback job scores:** jobs with no qualifications listed still get `Math.random() * 30` as a "match score" (pre-existing, comment says it's for demo purposes). Consider showing "no data" instead of a fake score.
5. **Failure-path UX:** when tailoring fails, `tailoredResumeCreated` deletes the resume record; the update/cover-letter flows reset status to `COMPLETED` even on failure. Both mask errors from the user.

---

## 6. Verification performed

| Check | Result |
|---|---|
| `tsc --noEmit` (full project incl. tests) | 0 errors |
| `jest` | 2 suites, 42/42 tests pass |
| `next build` (production) | Succeeds, all routes compiled |
| `.env` tracked in git? | No (properly ignored) |

### Files changed
- `inngest/tailored.ts`
- `trpc/routers/_payment.ts`
- `lib/auth.tsx`, `auth-client.ts`
- `app/api/user/dashboard/route.ts`
- `app/api/interviews/[id]/route.ts`, `app/api/interviews/[id]/analyze/route.ts`
- `app/(root)/resume/tailored/[id]/page.tsx`
- `components/resume/tailored/ResumePreview.tsx`
- `components/resume/editor/types.ts`, `CustomSections.tsx`, `ExperienceSection.tsx`
- `components/resume/pdf/ResumePDF.tsx`
- `components/recruiter/ResumePreviewSheet.tsx`
- `components/landing/LandingPageClient.tsx`
- `components/ui/progress.tsx`
- `lib/utils.ts`, `lib/converter.ts`
- `tsconfig.json`, `package.json` (+ `@types/dragula`)
- `app/__test__/AddressSection.test.tsx`, `app/__test__/utils.test.ts`

---

# Round 2 — UI/Responsiveness Fixes & Interview Bug Audit (2026-07-08)

## A. Resume editor — card layout & responsiveness

The editor's section cards used fixed two-column grids that never collapsed on small screens, and `col-span-2` items inside what should be a 1-column mobile grid actually force an overflowing implicit CSS grid column. Fixed across **all** editor sections (Experience, Education, Projects, Certifications, Awards, Publications, Address, Custom Sections):

1. `grid grid-cols-2` → `grid grid-cols-1 sm:grid-cols-2` (inputs stack on mobile, pair up from `sm:` up).
2. `col-span-2` → `col-span-full` (correct at every breakpoint; no phantom third column).
3. Entry cards restyled: `rounded-xl`, softer `border-gray-200/80`, `bg-gray-50/70`, tighter mobile padding (`p-4 sm:p-5`) — a cleaner, more modern look.
4. Section headers (`title + Add button`) now wrap on narrow screens instead of squeezing.
5. `editor.tsx` container: the `pl-10` gutter existed only for the drag handle, which is hidden on mobile — now `md:pl-10`, freeing ~24px of width on phones.
6. `SaveChangesPopup`: replaced unreliable `place-self-center` on a `fixed` element with proper `left-1/2 -translate-x-1/2` centering, capped width to the viewport, allowed wrapping.
7. `PrimaryResumeBuilder` / tailored `ResumeBuilder` headers: mobile alignment fixed (`items-start`), panel-toggle group no longer forces desktop borders/margins on mobile, container width widened on phones (`max-w-[98%]`).
8. `CreateTailoredResumeDialog`, `CustomSectionForm`, `JobDescriptionPanel`: fixed 2/3-column grids made responsive.

## B. Interview side — bugs found & fixed

### B.1 Voice interview: end-call phrase scheduled duplicate session-endings (bug)
`components/interview/ConversationComponent.tsx` — the MessageEngine callback fires on every message update; each time the agent's closing phrase ("i will now end the session") was present in the list it scheduled *another* 5-second `handleStopConversation` timeout → multiple `endSession` mutations and stale-closure microphone handling (mic could stay on). Fixed with a one-shot `endCallScheduledRef` guard and a `stopConversationRef` that always points at the latest closure.

### B.2 Avatar interview: duplicate camera acquisition leaked a stream (bug)
`app/interview-ai/VideoInterviewClient.tsx` — two separate `getUserMedia` effects both fired when the call became active, racing each other; one stream got orphaned so the camera light could stay on after the call ended. Removed the unguarded duplicate; the ref-guarded effect remains the single owner of the camera stream.

### B.3 Avatar mode minutes check never ran (bug)
`app/interview/[type]/page.tsx` — the "0 interview minutes remaining" check lived in `handleStartSession`, but Avatar mode redirects away in `handleConfigSubmit` before that function is ever called. The check now runs before the redirect.

### B.4 Interview UI responsiveness
- **Video call controls** were desktop-sized (~500px pill with `px-10 gap-14`) and overflowed phones — now scale down on mobile; the decorative "Studio" label hides below `sm`.
- **Self-view PIP** covered nearly half a phone screen (`w-44 h-56` at 375px) — now `w-28 h-40` on mobile, full size from `sm:` up.
- **Transcript drawer** was fixed `w-80` — now full-width on phones, `w-80` on desktop.
- **"Interview Preview" dialog** (the pre-interview card): pinned `top-24` could clip on short screens — now vertically centered on mobile, `top-24` on desktop.
- **Voice-interview caption box** (`ConvoTextStream`) was fixed `w-80` and could overflow ≤360px screens — now viewport-capped.
- **Interview type cards** (`InterviewCard`): added consistent min-heights so the five cards on /interview align instead of sizing to their text.
- **Interview result page** header now wraps (title + Export PDF button) on mobile.
- Config page feature tiles: `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`.

## C. Platform-wide card sweep

Audited dashboard, job search, blog, pricing, recruiter, and notification components for fixed multi-column grids. Almost all already used responsive `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` patterns. The A4 resume print templates intentionally keep fixed columns (they render a physical page). Two compact 2-column grids (recruiter filter chips, pricing credit packs) work at mobile widths and were left as designed.

## Verification (Round 2)

| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `next build` (production) | Succeeds |

---

# Round 3 — External Audit Report (Antigravity) Verification & Fixes (2026-07-08)

Worked through the 40-item external audit. Every claim was verified against the code before fixing; several were false positives. **Pricing items skipped per request** (pricing is being reworked).

## Fixed

| Item | What was done |
|---|---|
| BUG-004 | Interview result feedback: the markdown-to-HTML regex opened `<h3>` tags without closing them (and converted `\n` first, mangling headings). Rewrote as a proper mini-formatter — escapes raw HTML from the AI first, then converts `###`/`##` headings (closed tags), `**bold**`, list bullets, and newlines. |
| BUG-005 | Onboarding now has a client auth guard — signed-out visitors are redirected to sign-in instead of getting a silently failing submit. |
| BUG-006 / ISSUE-030 | Role and goal are now kept in sync: picking the "Recruiter" goal sets the recruiter role (and vice versa); picking "Job Seeker" clears a recruiting goal. Mismatched profiles/redirects no longer possible. |
| BUG-007 | Dashboard: the recruiter-application success dialog was set in state but never rendered — added the Dialog to `SearchParamsHandler`. |
| BUG-008 | Voice interview: added a 60-second rescue timeout for question-generation polling — the loading overlay can no longer spin forever if Inngest is down. Timeout is cleared on success and on unmount. |
| BUG-009 | Question count is clamped to 3–10 at submit time (mid-typing values like 0 previously hit the API's `min(3)` and produced a 400). |
| BUG-011 / ISSUE-026 | Result page: sessions without analysis now show a proper empty state with a "Start New Interview" CTA instead of raw placeholder text, and the score card labels its 0 as a placeholder. |
| ISSUE-012 | Onboarding: inline amber hint next to the Continue button explains exactly which field is missing. |
| ISSUE-013 | `fullName` is now sent as `name` and saved — added `name` to the `updateProfile` tRPC schema. |
| ISSUE-014 | Removed the dead hard-coded `/30` progress calculation on the credits card (bar was already hidden via `hideProgress`). |
| ISSUE-015 | Greeting now says "Good night" for hours 0–4. |
| ISSUE-016 | `InterviewCard` images got a `sizes` prop (fill images without it degrade LCP). |
| ISSUE-017 | Voice interview "End Call" now opens a confirmation dialog before ending the session. |
| ISSUE-018 | Summary screen: "Return to Dashboard" is also disabled while analysis runs. |
| ISSUE-019 | Removed the `@ts-ignore` on the tailored page scores — typed the parsed scores object instead. |
| ISSUE-021 | Resume upload input resets after upload (and after invalid-file rejection), so re-selecting the same file works. |
| ISSUE-022 | Support page shows a success card after submitting (with "Send Another"), preventing accidental double-submits. Also made its category/priority grid responsive. |
| ISSUE-024 | Minutes check now runs for **both** voice and avatar modes before starting (previously neither path effectively checked). |
| ISSUE-027/028 | Logos in the landing header and app sidebar: added `priority` and `h-auto` (fixes LCP + aspect-ratio console warnings). |
| ISSUE-029 | Dashboard "Generate Report" tracks the analyzing row — shows a spinner on that row and blocks concurrent clicks. |
| ISSUE-031 | Voice mode now goes through the briefing/confirmation step (it previously skipped straight to session creation; the briefing screen was unreachable dead code). |
| ISSUE-032 | Light version: the in-call timer pill now also shows remaining interview minutes. (Skipped the 30s server-poll suggestion — the server already tracks time via `/api/interviews/time`.) |
| ISSUE-033/034 | Dashboard and result page dates now use `date-fns` `format` instead of locale-dependent `toLocaleDateString`/`toLocaleTimeString` (with a null guard on `analyzedAt`). |
| ISSUE-037 | Recruiters now finish onboarding in 2 steps — the seeker-specific interests/preferences steps are skipped and the progress indicator adapts. |
| ISSUE-038 | `fetchResult` wrapped in `useCallback` with `params.id`, referenced in the effect deps. |
| ISSUE-039 | Invalid `/interview/[type]` values now redirect to `/interview`. |
| ISSUE-040 | Global error page rebuilt: Niena branding, clear message, error digest for support, "Try Again" (`reset()`), and a dashboard link. Sentry capture kept. |
| Bonus | Avatar mode dropped the technical topic (passed as an unused URL param) — now folded into the description like voice mode. |

## Verified false positives (no change needed)

- **BUG-001 / ISSUE-020:** `Activity` **is** a real React 19.2 export (this project runs React 19.2.0) — the `/resume` page never crashed. Still swapped to `Suspense` + `ResumePageSkeleton` since that gives an actual loading fallback and removes unused imports.
- **BUG-010:** Avatar mode does create a DB session — `/interview-ai` calls `createSession` itself from the URL params before starting (`createConversation`). No fix needed; minutes-check and topic handling were improved separately.
- **ISSUE-023:** `app/(root)/layout.tsx` already has a server-side auth guard (redirects to `/` when signed out, `/onboarding` when incomplete). The client layout doesn't need a second one.
- **ISSUE-035:** Job search already renders an empty state when zero jobs are returned.
- **ISSUE-036:** The sidebar already highlights the active route (`isActive={clientPathname === url}` in `nav-main.tsx`).

## Skipped

- **BUG-002 / BUG-003:** reported as already fixed in a prior session (Inngest fire-and-forget; eslint config variable).
- **ISSUE-025 (pricing verify page):** skipped — pricing is being reworked.

## Verification (Round 3)

| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `next build` (production) | Succeeds |

---

# Round 4 — Live Runtime Verification & Fixes (2026-07-09)

Booted the dev server and drove the app end-to-end in a real browser (signed up a throwaway test account, walked every core flow, then deleted the test data).

## Fixed

### 4.1 App wouldn't boot: Prisma 7 removed the `datasources` constructor option
**File:** `lib/prisma.ts`
Every DB-touching route 500'd (`PrismaClientConstructorValidationError`). Prisma 7's new client requires a driver adapter — switched to `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })` using the already-installed `@prisma/adapter-pg`. Verified: `/api/inngest`, dashboard API, auth, and interviews all work against the live Neon DB.

### 4.2 Every email signup failed with a 500 (two stacked bugs)
**File:** `lib/auth.tsx`
1. The Polar better-auth plugin takes its SDK instance as `client:`, but the config passed `polar:` — hidden by a `//@ts-ignore`. The plugin's client was `undefined`, so customer creation threw and **better-auth rolled back every signup**.
2. Even with the option fixed, an invalid/expired Polar token still hard-blocked signup. Set `createCustomerOnSignUp: false`: checkout already passes `externalCustomerId = user.id`, which makes Polar create/link the customer at purchase time, and webhooks look users up by that external ID — so signup no longer depends on Polar being up.
Verified: signup returns 200 and sign-in works.

### 4.3 Interview config page had horizontal scroll on mobile
Decorative 500px blur circles overflowed because the container was only `overflow-hidden` from `lg:` up — added `overflow-x-hidden`.

## Verified working live (smoke test)

- Landing page, blog, pricing render clean.
- Sign-up → email-verification gate → sign-in.
- Dashboard with real metric data and real (non-random) job matches.
- Resume page: upload UI, empty state, skeleton loading.
- Job search: filters, skeletons, empty state.
- **Voice interview end-to-end:** config → new briefing step → AI question generation (Inngest) → Agora connect → live agent conversation with streaming captions → End-Call confirmation dialog → session end + AI scoring → summary → full performance report with correctly formatted feedback headings (BUG-004 fix confirmed in-browser).
- The new 0-minutes guard correctly blocked interview start for a user with no minutes.

## Known cosmetic issue (documented, not fixed)

React logs a **hydration attribute mismatch** warning for auto-generated Radix IDs in the sidebar dropdown / notification bell (`id="radix-..."` differs between server and client render). It's dev-console noise — no user-facing breakage — but it's why the Next.js dev overlay shows an "Issue" badge. Root cause is a client-only conditional above those components shifting React's `useId` sequence; fixing it means making that part of the tree render identically on server and client.

## Verification (Round 4)

| Check | Result |
|---|---|
| `tsc --noEmit` (fresh, after clearing stale `.next` types) | 0 errors |
| Live browser smoke test of all core flows | Pass |
| Test data cleanup (smoke-test user + interviews) | Done |

---

# Round 5 — Avatar (Video) Interview: Live Test & Mobile Layout Fix (2026-07-09)

Ran the full avatar interview twice against live services (Anam avatar, question generation, timer, minute deduction, transcript, end-of-call analysis, performance report) using a temporary DIAMOND test account — **the entire video flow works end-to-end**. The test account and its interviews were deleted afterwards.

## The mobile layout bug (confirmed and fixed)

**Files:** `app/interview-ai/VideoInterviewClient.tsx`, `app/interview-ai/layout.tsx`

On phones the live call screen was badly off: the avatar video rendered only ~250px tall at the top, a large dead area sat below it, and the mic/hang-up controls were pushed below the fold. Desktop looked fine only because the native fullscreen request succeeds there — mobile browsers block `requestFullscreen`, exposing the broken in-flow layout.

Three stacked causes, all fixed:
1. The call UI declared its own `min-h-screen` inside the layout's header+main column, so the screen was viewport-height starting 116px down → bottom 116px (the controls) unreachable. **Fix:** the active call is now a true `fixed inset-0` fullscreen overlay — it no longer depends on the browser granting fullscreen.
2. The Anam `<video>` used percentage height that the SDK's inline styles defeated, so it collapsed to its intrinsic ratio (250px). **Fix:** the video is pinned with `absolute inset-0` (both in the class and the injected `!important` CSS), which stretches regardless of what the SDK sets.
3. The layout's `<main>` had `z-20`, creating a stacking context that trapped the overlay *below* the `z-[60]` header, leaving the header bleeding over the call. **Fix:** removed the z-index from `<main>`; the overlay now covers the full screen during a call.

Also fixed while testing at 375×812:
- The "Interview Preview" dialog clipped its **Enter Studio** button on phones — tightened mobile paddings/margins and raised the scroll cap to `85dvh`; the button now sits fully in view (verified: bottom edge 654px of 812px viewport).

**Verified after the fix (measured in-browser at 375×812):** call overlay spans exactly 0→812, avatar video full-bleed, control bar fully visible at 707–780, self-view PIP above the controls, role/timer pills on top, transcript drawer full-width.
