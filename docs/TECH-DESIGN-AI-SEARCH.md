# Tech Design: AI-Powered Store & Discount Search

**Purpose:** Enable users to search stores/sales/coupons via a natural-language search bar; combine user cards, deals, and (future) coupons to recommend the **best way to shop** (e.g. double promotions, stackable discounts).

---

## 1. Current State (Existing App)

| Layer | What Exists |
|-------|-------------|
| **DB** | Firestore: `businesses`, `cards`, `categories`, `deals`, `users`, `recent_searches` |
| **APIs** | Next.js API routes: `/api/businesses`, `/api/cards`, `/api/deals`, `/api/categories`, `/api/users/[userId]/cards`, `/api/users/[userId]/recent-searches` |
| **Data** | User has **my cards**; deals link `businessId` + `cardId`; home has **Autocomplete** over all businesses → show deals for selected business |
| **Gaps** | No text search on business name; no “best combo” logic; no coupons; no AI intent parsing |

---

## 2. Target User Flow

1. User types in **search bar**: e.g. “coffee near me”, “Electronics with Amex”, “best deals at Shufersal”.
2. **AI** interprets intent → calls **tools** (DB, optional MCP) → returns:
   - Matching **stores** (and categories)
   - **Deals** per store (card-linked)
   - **User’s cards** that have deals at those stores
   - Optional: **coupons** (when added)
3. App shows **“Best way to shop”**: e.g. “Use Card X at Store Y – 15% + coupon Z”.

---

## 3. Architecture: DB → Tools → Agent/LLM → Response

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FRONTEND                                                                │
│  Search bar (natural language) → /api/ai-search (or /api/search)          │
│  Settings: My Cards, My Coupons, Preferences                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ORCHESTRATOR (Next.js API Route)                                        │
│  - Parse query + session (user id/email)                                  │
│  - Call internal TOOLS (DB queries)                                       │
│  - Optionally: call MCP (external coupons, etc.)                         │
│  - Single LLM call: intent + “best combo” summary                        │
│  - Return: { stores, deals, bestCombos, message }                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  TOOLS        │         │  AGENT / LLM     │         │  MCP (optional)  │
│  (internal)   │         │  (single call)   │         │  (external)      │
│               │         │                  │         │                  │
│ - searchStores│         │ - Interpret query│         │ - Coupon APIs    │
│ - getDeals    │         │ - Rank/combine   │         │ - Price compare  │
│ - getUserCards│         │ - Format reply   │         │                  │
│ - getCategories│        │                  │         │                  │
│ - getRecent   │         │                  │         │                  │
└───────────────┘         └─────────────────┘         └─────────────────┘
        │
        ▼
┌───────────────┐
│  FIRESTORE    │
│  (existing)   │
└───────────────┘
```

---

## 4. Core Steps to Call DB, Tools, Agents, MCP, Search

### 4.1 Database (Firestore)

- **When:** Always, via **tools** (see below).
- **How:** Use existing query layer: `businessQueries`, `dealsQueries`, `cardQueries`, `categoryQueries`, `userQueries`.
- **New:** Add **search by business name** (e.g. `getBusinessesByName` or filter in memory for small datasets).

### 4.2 Tools (Internal, Server-Side)

Expose as plain async functions used by the AI search API (no MCP required for v1):

| Tool | Input | Output | Implementation |
|------|--------|--------|----------------|
| `searchStores` | `query: string`, `limit?: number` | `Business[]` | Query businesses by name (new) or categories; optional category filter. |
| `getDealsByBusiness` | `businessId: string` | `Deal[]` (with card populated) | Existing `getDealsByBusinessId`. |
| `getUserCards` | `userEmail: string` | `Card[]` | Existing user cards API/query. |
| `getCategories` | - | `Category[]` | Existing. |
| `getRecentSearches` | `userEmail: string` | `Business[]` | Existing recent searches. |
| `getDealsByCategory` | `categoryId: string` (optional) | `Deal[]` or aggregated by business | New helper if needed. |

**Call order in API:**  
1) Get user from session → 2) `searchStores(query)` (+ optional `getCategories`) → 3) For each store (or top N), `getDealsByBusiness(storeId)` → 4) `getUserCards(userEmail)` → 5) Combine and optionally send to LLM.

### 4.3 Search

- **In-app search:** Implement **server-side** “search by name”:
  - Option A: Firestore `where('name', '>=', q)` and `where('name', '<=', q + '\uf8ff')` for prefix.
  - Option B: Load businesses in memory and filter by string match (acceptable for hundreds of stores).
- **AI “search”:** Same tools; the “search” is the orchestration (tools + LLM) that interprets “coffee”, “Electronics”, “Shufersal” and maps to stores/categories.

### 4.4 Agent / LLM (Single-Call for v1)

- **When:** After tools return data.
- **Role:** Interpret natural language query, rank/select best options, format “best way to shop” (e.g. “Use Card X at Store Y”).
- **How (recommended for v1):**
  - One **non-streaming** LLM call with:
    - **System:** “You are a shopping assistant. Given stores, deals, and user cards, suggest the best way to shop (which card + store + deal).”
    - **User:** Query + JSON blob of `{ stores, dealsByStore, userCards }`.
  - **Output:** Structured JSON or plain text summary for the UI.
- **Agents (multi-step):** Defer to v2; use when you need multi-step planning (e.g. “find all electronics, then filter by my cards, then check external coupons”).

### 4.5 MCP (Optional, Later)

- **When:** External data (e.g. third-party coupon APIs, price comparison).
- **How:** Run an MCP server that exposes tools (e.g. `get_coupons_for_store(storeId)`). Next.js API calls MCP via SDK or HTTP.
- **v1:** Can skip MCP and rely on internal tools + Firestore only.

---

## 5. Recommended Implementation Options

| Approach | Pros | Cons | Use when |
|----------|------|------|----------|
| **Tools only** | Simple, no LLM cost | No natural language; you only have “search by name” + filters | MVP without AI |
| **Tools + single LLM call** | Natural language + “best combo” with minimal complexity | One round-trip only | **Recommended for v1** |
| **Full agent loop** | Multi-step reasoning, can add tools on the fly | More latency, cost, complexity | v2 when you need planning |
| **MCP** | External data (coupons, etc.) without hard-coding in app | Extra infra and auth | When you have external APIs |

**Recommendation:** Implement **Tools + single LLM call** in a new route `/api/ai-search` (or `/api/search`). Use **tools** for all DB and in-app search; use **one LLM call** for intent and “best way to shop” summary. Add **MCP** when you have a concrete external coupon/data source.

---

## 6. API Contract: AI Search

**Request:**  
`POST /api/ai-search`  
Body: `{ "query": "user natural language" }`  
Headers: Session (e.g. NextAuth) for `userEmail`.

**Response:**  
```ts
{
  "query": "coffee with amex",
  "stores": Business[],
  "dealsByStore": { [businessId]: Deal[] },
  "userCards": Card[],
  "bestCombos": {
    "summary": "Use Amex at Store X for 10% off",
    "items": Array<{ store, card, deal, reason? }>
  },
  "message": "Optional LLM-generated short summary"
}
```

---

## 7. Data Model Extensions (Optional)

- **User coupons:** Collection `user_coupons` or field on user: `{ code, storeId?, expiry, description }`. Tools: `getUserCoupons(userId)`, `addCoupon`, `removeCoupon`.
- **Settings:** Already have `userData.filters` (e.g. `showOnlyMyCards`). Add e.g. “preferred categories”, “notify on new deals”.

---

## 8. Frontend Changes

- **Search bar:** Replace or augment Autocomplete with a single input that triggers `POST /api/ai-search` with the typed query (debounced or on submit). Show loading state, then results.
- **Results view:** Reuse existing `Business` modal and cards; add a “Best way to shop” section that consumes `bestCombos` (card + store + deal + optional coupon).
- **Settings:** Existing Cards page; add “My coupons” and “Search preferences” (e.g. categories) when you add those models.

---

## 9. Security & Performance

- **Auth:** All tools that use `userEmail` must run after session validation; never trust client for user id.
- **Rate limit:** Consider rate limiting on `/api/ai-search` (LLM cost).
- **Caching:** Cache `getBusinesses` / `getCategories` (e.g. short TTL) to reduce Firestore reads; avoid caching per-user data in shared cache.

---

## 10. Implementation Checklist

- [ ] Add **search by business name** (Firestore or in-memory) and expose as tool.
- [ ] Create **`/api/ai-search`** (or `/api/search`): validate session, call tools, optional LLM, return contract above.
- [ ] **Frontend:** Search input → call API → show stores + deals + “Best way to shop”.
- [ ] (Optional) Add **user coupons** model + tools + UI in Settings.
- [ ] (Later) Add **MCP** for external coupons if needed.
- [ ] (Later) Replace single LLM call with **agent loop** if you need multi-step planning.

This design keeps the existing DB and APIs, adds a thin tools layer and one LLM call for AI search and “best way to shop,” and leaves room for agents and MCP later.

---

## 11. Where Things Live in This Repo

| Concept | Location | Notes |
|--------|----------|--------|
| **Tools (server-side “skills”)** | `lib/ai-search-tools.ts` | `toolSearchStores`, `toolGetDealsByBusiness`, `toolGetUserCards`, `toolGetCategories`, `buildBestCombos`. Called by the API only. |
| **Orchestrator** | `pages/api/ai-search.ts` | Runs tools, builds response. **LLM/agent is not wired here yet** – see below. |
| **Agent / LLM setup** | Not implemented | Design calls for one optional LLM call (e.g. OpenAI) after tools return, to refine intent or format a natural-language summary. To add it: create `lib/ai-search-llm.ts` (or use a provider SDK), call it from `pages/api/ai-search.ts` after `buildBestCombos`, and merge the LLM output into `response.message` or `bestCombos.summary`. |
| **MCP** | Not in repo | External MCP servers (e.g. coupon APIs) would be called from the API route or a dedicated service; this repo has no MCP client yet. |
| **Cursor/Agent “skills”** | Not in this repo | Cursor rules live in `.cursor/rules/`; this project does not define custom skills there. |
