# Design: Recall Feature Sprint

## Scope

Five features implemented in this sprint:

1. `vercel.json` — region + timeout config
2. Upload progress stepper UI
3. Cross-meeting citation cards in chat
4. Share answer button with toast
5. ⌘K global search modal

> **Deferred:** Weekly digest page (`/digest`) — held until external integrations (Notion, Linear, Jira, Teams) are connected so the digest can be auto-generated from real activity streams rather than manually triggered.

---

## 1. vercel.json

**File:** `recall/vercel.json` (new, project root)

```json
{
  "regions": ["iad1"],
  "functions": {
    "src/app/api/upload/route.ts": {
      "maxDuration": 60
    }
  }
}
```

- Pins all functions to `iad1` (AWS us-east-1), co-located with Aurora
- Explicitly declares the 60s upload timeout centrally; matches existing `maxDuration` in the route file

---

## 2. Upload Progress Stepper UI

**Files affected:** `src/app/page.tsx`

Replace the current progress indicator with a 6-step vertical stepper. Steps advance on a fixed timer — no backend changes required.

**Steps and timing (ms from upload start):**

| Step | Label | Delay |
|------|-------|-------|
| 1 | Parsing file | 0 |
| 2 | Creating chunks | 1 500 |
| 3 | Generating embeddings | 3 000 |
| 4 | Extracting actions | 6 000 |
| 5 | Extracting decisions | 9 000 |
| 6 | Done | 12 000 |

**Visual states per step:**
- **Pending:** grey dot
- **Active:** spinning gradient ring (reuse `.recall-spin` from globals.css)
- **Complete:** green checkmark, label fades to full opacity

The stepper replaces whatever loading indicator currently exists during the `POST /api/upload` call. On error, active step shows a red X and the stepper stops.

---

## 3. Cross-Meeting Citation Cards

**Files affected:** `src/app/api/chat/route.ts`, `src/app/chat/page.tsx`

### API change

`/api/chat` already returns sources as `{ title, date, id }` (`id` = `meeting_id`) in the `X-Sources` header. Only add `excerpt` (first 100 chars of `c.content`) to each source object so the UI can show a preview line.

### UI change

Replace the pill chips under each assistant answer with compact cards:

```
┌─────────────────────────────────┐
│ Meeting Title            · Date │
│ one-line excerpt (truncated)    │
└─────────────────────────────────┘
```

- Card is a `<Link href="/meetings/[meeting_id]">` — clicking navigates to meeting detail
- Excerpt: first 100 characters of the matching chunk text (already available in the vector search result; include it in the source payload)
- Max 3 cards shown; if more sources exist show "+ N more" label
- Cards sit below the answer text, above the follow-up suggestion row

---

## 4. Share Answer Button

**Files affected:** `src/app/chat/page.tsx`, `src/app/globals.css`

### Copy content

```
Q: [user's question that preceded this answer]
A: [full answer text, plain — strip markdown]

— via Recall
```

To get the preceding question, each assistant message index `i` looks back at `messages[i-1]` (which is always the user turn).

### Button placement

Small copy icon (`⎘` or SVG) in the top-right corner of each assistant message bubble. Visible on hover (desktop) or always visible (mobile).

### Toast

- Fixed position, bottom-right, `z-50`
- "Copied!" with a checkmark, brand purple background
- Slides up on enter, fades out after 2 000ms
- Single toast instance — re-triggers animation if copied again before dismiss
- Implemented as a small `<Toast>` component in `src/components/Toast.tsx`; state managed in `ChatPage`

---

## 5. ⌘K Global Search Modal

**Files affected:** `src/app/layout.tsx`, `src/components/CmdKModal.tsx` (new)

### Component

`<CmdKModal>` is a client component mounted once in `layout.tsx` — always in the DOM, hidden by default.

**Keyboard listener** on `document` (in a `useEffect`): toggles open on `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux). `Escape` closes.

### Layout

```
┌── backdrop (fixed, inset-0, bg-black/60, z-50) ──┐
│                                                    │
│   ┌── modal (max-w-lg, centered, rounded-xl) ──┐  │
│   │  [ Search your meetings…          ] [✕]    │  │
│   │  ─────────────────────────────────────────  │  │
│   │  [streaming answer appears here]            │  │
│   └────────────────────────────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
```

- Input auto-focuses on open
- Submitting fires `POST /api/chat` and streams the response into the modal body (same fetch/stream logic as `chat/page.tsx` — extract into a shared `streamChat(query)` helper in `src/lib/chat-stream.ts`)
- Backdrop click closes modal and clears the answer
- Modal does not navigate — it is a quick-lookup overlay only

### Shared streaming helper

Extract the fetch + stream logic from `chat/page.tsx` into `src/lib/chat-stream.ts` so both the chat page and the modal reuse it without duplication.

---

## 6. Weekly Digest Page

**Files affected / created:**
- `src/app/digest/page.tsx` (new)
- `src/app/api/digest/route.ts` (new)
- `src/app/api/digest/summary/route.ts` (new)
- `src/components/Sidebar.tsx` — add Digest nav item

### Week boundary

"This week" = Monday 00:00:00 to Sunday 23:59:59 of the **current calendar week** in UTC.

```sql
date_trunc('week', NOW())                        -- Monday 00:00
date_trunc('week', NOW()) + interval '7 days'    -- Next Monday 00:00
```

### GET /api/digest

Returns:

```ts
{
  week_start: string          // ISO date of Monday
  meetings: Meeting[]         // meetings created this week
  decision_count: number
  actions_opened: number      // action_items created this week
  actions_closed: number      // action_items with status='done' updated this week
}
```

Single query with CTEs or subqueries — no N+1.

### GET /api/digest/summary

Streams a Claude paragraph. Prompt:

```
You are Recall, a meeting memory assistant. Write a single paragraph (3-5 sentences)
summarising this week's activity for a team. Be specific: name meetings, decisions, owners.

This week (${weekStart} – ${weekEnd}):
- Meetings indexed: ${meetingTitles.join(', ') || 'none'}
- Decisions made: ${decisionCount}
- Action items opened: ${actionsOpened}, closed: ${actionsClosed}

Write the summary now.
```

Uses `claude.messages.stream()` → `ReadableStream` → `Response` (same pattern as `/api/chat`).

### Page layout

```
Digest — Week of Jun 16
━━━━━━━━━━━━━━━━━━━━━━━━━━━

[4 meetings] [12 decisions] [8 actions opened] [5 actions closed]

This week                          AI Summary
─────────────                      ──────────
• Roadmap sync · Jun 17            [streaming paragraph...]
• Design review · Jun 18
• Sprint planning · Jun 19
• Customer call · Jun 20
```

- Stats grid renders from `/api/digest` immediately
- Meetings list renders from the same response
- AI Summary section shows typing dots while `/api/digest/summary` streams, then types in
- If no meetings this week: show a friendly empty state ("No meetings indexed this week — upload a transcript to get started")

### Sidebar

Add `{ href: '/digest', label: 'Weekly digest', icon: '◈' }` to the nav array in `Sidebar.tsx`.

---

## Files touched summary

| File | Change |
|------|--------|
| `vercel.json` | New |
| `src/app/page.tsx` | Upload stepper UI |
| `src/app/api/chat/route.ts` | Add `excerpt` to sources (`meeting_id` already present as `id`) |
| `src/app/chat/page.tsx` | Citation cards, share button, extract streaming to lib |
| `src/lib/chat-stream.ts` | New — shared streaming helper |
| `src/components/Toast.tsx` | New — share toast |
| `src/components/CmdKModal.tsx` | New — ⌘K modal |
| `src/app/layout.tsx` | Mount `<CmdKModal>` |
| `src/app/digest/page.tsx` | New |
| `src/app/api/digest/route.ts` | New |
| `src/app/api/digest/summary/route.ts` | New |
| `src/components/Sidebar.tsx` | Add Digest nav item |

---

## Success criteria

- Upload of a full transcript on Vercel completes without timeout
- Progress stepper advances through all 6 steps visually
- Chat answers show citation cards that navigate to meeting detail
- Share button copies formatted answer and shows "Copied!" toast
- ⌘K opens modal from any page; streams an answer; Escape closes it
- `/digest` shows this week's meetings, stats, and a Claude-generated summary paragraph
- All features work on mobile viewport (no overflow, touch targets ≥ 44px)
