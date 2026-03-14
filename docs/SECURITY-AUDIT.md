# Security Audit Report

**Date:** 2026-03-14  
**Scope:** Data leakage, auth guards, input validation, environment/secrets, database access control.

---

## 1. Data Leakage & PII Exposure

### Critical: User-scoped APIs accept URL `userId` without session

| Route | Issue | Impact |
|-------|--------|--------|
| `GET/POST /api/users/[userId]/cards` | No `getServerSession` check. Uses `userId` from URL only. | Attacker can pass any email and **read or add cards** for that user. Response includes full user document: **email, name, image, cards**. |
| `PUT/DELETE /api/users/[userId]/cards/[cardId]` | No session check. | Attacker can **add or remove** any user’s cards by guessing/using their email. |
| `GET /api/users/[userId]/recent-searches` | No session check. | Attacker can **read** any user’s recent searches (PII/behavior). |
| `POST /api/users/[userId]/recent-searches/[business]` | No session check. | Attacker can **write** recent searches for any user. |

**Card metadata:** Stored “cards” are card *types* (e.g. Max + Visa), not real card numbers, so no raw credit card data is at risk. The main exposure is **user PII** (email, name, image) and **card list / behavior** via these unauthenticated endpoints.

**Fix:** Enforce session on all user-scoped APIs and bind `userId` to `session.user.email` (see “Suggested fixes” below).

---

## 2. Supabase RLS / Database Access Control

**Finding:** The project uses **Firebase/Firestore**, not Supabase. There is no Supabase client or RLS.

- **Firestore:** No `firestore.rules` (or equivalent) found in the repo. All access is via **Firebase Admin SDK** from Next.js API routes (server-side). So security depends entirely on **API route auth**, not DB-level rules.
- **Recommendation:**  
  1. Keep enforcing auth in API routes (and fix the missing checks above).  
  2. If you ever expose Firestore to the client (e.g. direct SDK), add Firestore Security Rules so the DB enforces “user can only read/write their own document” by `request.auth.uid` / email.

There is no separate “benefits” table; “cards” and related data live in Firestore collections `users`, `cards`, etc.

---

## 3. Input Validation (Zod)

**Finding:** No Zod (or other schema validation) is used. Validation is ad hoc:

- `common/validate.ts`: custom login/register validation (no Zod).
- API routes: manual checks (e.g. `!club || !provider`, `!email || !password`), no central sanitization or type-safe parsing.

**Risks:** Inconsistent validation, possible injection or malformed data, and no single source of truth for request shapes.

**Affected areas:**

- `POST /api/users/[userId]/cards` — `body.club`, `body.provider` (no schema, no allowlist).
- `PATCH /api/users/[userId]/profile` — `name`, `avatarAnimal`, `buymeAmount`, `buymeType` (partial checks).
- `POST /api/auth/register` — `username`, `email`, `password`.
- `POST /api/auth/dev-set-password` — `email`, `password`.
- `POST /api/users/[userId]/coupons` — `storeName`, `amount`, `endDate`, `couponCode`, `receiptImage`.
- `POST /api/ai-search` — `body.query` (string only, no length/sanitization).
- `GET /api/cards` — `limit`, `page`, `id`, `all` (numeric/string not validated).
- `POST /api/deals` — full `body` passed to `createDeal(body)` with no schema.

**Fix:** Introduce Zod, define schemas per route (or shared where appropriate), and use `.parse()` or `.safeParse()` on all Server Actions and API request bodies/query params. Return 400 with validation errors on failure.

---

## 4. Auth Guards (Sensitive Routes)

**Finding:**

- **Middleware (`middleware.ts`):** Only redirects `/api/auth/signin` → `/auth/login`. It does **not** protect `/cards`, `/profile`, `/settings`, or any API path.
- **Pages:** Sensitive pages (`/cards`, `/profile`, etc.) rely on **client-side** checks in `Main.tsx` (`status === 'unauthenticated'` → `router.replace(Routes.LOGIN)`). There is no `getServerSideProps` session check on these pages.
- **APIs:** Inconsistent:
  - **Protected:** `/api/users/[userId]/profile`, `/api/users/[userId]/coupons`, `/api/ai-search` use `getServerSession` and enforce `session.user.email === userId`.
  - **Unprotected:** `/api/users/[userId]/cards`, `/api/users/[userId]/cards/[cardId]`, `/api/users/[userId]/recent-searches`, `/api/users/[userId]/recent-searches/[business]` have **no** session check.

So “sensitive routes” are only partially guarded; the main gap is **server-side**: the listed user-scoped APIs must require a valid session and match `userId` to the session.

**Fix:** Add a shared “require session and match userId” helper and use it in every user-scoped API. Optionally add `getServerSideProps` on `/cards`, `/profile`, `/settings` to redirect unauthenticated users server-side (defense in depth).

---

## 5. Environment Variables & Secrets

**Finding:**

- No hardcoded secrets found in source (no raw API keys or passwords in repo).
- Secrets are read from `process.env` (e.g. `JWT_SECRET`, `GOOGLE_ID`, `FIREBASE_SERVICE_ACCOUNT_KEY`, `GEMINI_API_KEY`). `.env` and `firebase-service-account.json` are in `.gitignore`.
- **Caution:** `.env` is listed in git status as modified; ensure it is **not** committed (only `.env.example` without real values should be).

**Recommendation:** Keep all secrets in env (or a secrets manager). Do not commit `.env` or `firebase-service-account.json`. Use `.env.example` with placeholders only.

---

## 6. Other Notes

- **Dev-only routes:** `dev-set-password` and `dev-check-user` correctly gate with `process.env.NODE_ENV !== 'development'`.
- **Login:** Dev auto-login via query params (`?email=...&password=...`) is limited to `NODE_ENV === 'development'` in the client; ensure this is never enabled in production build.
- **POST /api/deals:** No auth; if this is an admin-only action, restrict it (e.g. session + role or API key).

---

## Suggested Fixes (Summary)

1. **Auth on user-scoped APIs**  
   - In `GET/POST /api/users/[userId]/cards`, `PUT/DELETE .../cards/[cardId]`, `GET .../recent-searches`, `POST .../recent-searches/[business]`:  
     - Call `getServerSession(req, res, authOptions)`.  
     - If no session or `session.user.email !== userId`, return `403 Forbidden`.  
     - Use normalized email (e.g. trim + lower) for both session and `userId` where applicable.

2. **Do not return full user document from cards API**  
   - For `GET /api/users/[userId]/cards`, return only `{ cards: Card[] }` (or similar), not the full `UserDocument` (email, name, image, etc.), so that even with a future bug, PII is not leaked in that response.

3. **Introduce Zod**  
   - Add `zod` to dependencies.  
   - Define schemas for each API’s input (body + query where relevant).  
   - Validate with `schema.safeParse()` and return 400 with error details on failure.  
   - Use validated data in handlers (no raw `req.body`/`req.query` for sensitive fields).

4. **Optional: Firestore rules**  
   - If you add client-side Firestore access, deploy rules that allow read/write only for the authenticated user’s document (e.g. `users/$(request.auth.token.email)`).

5. **Optional: Server-side page guard**  
   - In `getServerSideProps` for `/cards`, `/profile`, `/settings`, call `getServerSession` and redirect to login if unauthenticated.

Implementing the auth fixes and response shape change for the cards API is the highest priority to stop PII and data leakage.

---

## Implementations Applied (post-audit)

- **Auth:** Added `lib/api-auth.ts` with `requireUserSession(req, res, userId)`. All user-scoped routes now enforce session and `userId === session.user.email`:
  - `GET/POST /api/users/[userId]/cards`
  - `PUT/DELETE /api/users/[userId]/cards/[cardId]`
  - `GET /api/users/[userId]/recent-searches`
  - `POST /api/users/[userId]/recent-searches/[business]`
- **Data leakage:** `GET /api/users/[userId]/cards` now returns only `{ cards }`, not the full user document (no email/name in response).
- **Zod:** Added `zod` and `lib/api-schemas.ts`. Validation applied to:
  - `POST /api/users/[userId]/cards` — `addCardBodySchema` (club, provider allowlist)
  - `POST /api/auth/register` — `registerBodySchema`
  - `PATCH /api/users/[userId]/profile` — `profilePatchBodySchema`
  - `POST /api/ai-search` — `aiSearchBodySchema`
  - `GET /api/cards` — `cardsQuerySchema` (id, limit, page, all)

**Still recommended:** Add Zod to remaining API routes (coupons, deals, dev-set-password), and optionally add `getServerSideProps` session checks on `/cards`, `/profile`, `/settings` for defense in depth.
