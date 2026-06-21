// Shared between client (filter UI / state) and server (SQL params). Keep this
// free of server-only imports so both sides can use it.

export interface ChatFilters {
  dateFrom: string | null   // 'YYYY-MM-DD'
  dateTo: string | null     // 'YYYY-MM-DD'
  meetingIds: string[]
  people: string[]
  sourceTypes: string[]     // 'upload' | 'notion' | 'zoom'
}

export const EMPTY_FILTERS: ChatFilters = {
  dateFrom: null,
  dateTo: null,
  meetingIds: [],
  people: [],
  sourceTypes: [],
}

// Coerce arbitrary JSON (request body or a stored `filters` JSONB) into a
// well-formed ChatFilters, dropping anything unexpected.
export function normalizeFilters(input?: Partial<ChatFilters> | null): ChatFilters {
  return {
    dateFrom: input?.dateFrom || null,
    dateTo: input?.dateTo || null,
    meetingIds: Array.isArray(input?.meetingIds) ? input!.meetingIds.filter(Boolean) : [],
    people: Array.isArray(input?.people) ? input!.people.filter(Boolean) : [],
    sourceTypes: Array.isArray(input?.sourceTypes) ? input!.sourceTypes.filter(Boolean) : [],
  }
}

// Positional SQL params for the filtered vector search. Empty selections become
// NULL so the query's `($n IS NULL OR ...)` guards skip them.
export function filterParams(f: ChatFilters): (string | string[] | null)[] {
  return [
    f.dateFrom,
    f.dateTo,
    f.meetingIds.length ? f.meetingIds : null,
    f.people.length ? f.people : null,
    f.sourceTypes.length ? f.sourceTypes : null,
  ]
}

export function isFilterActive(f: ChatFilters): boolean {
  return Boolean(
    f.dateFrom || f.dateTo || f.meetingIds.length || f.people.length || f.sourceTypes.length
  )
}

export function activeFilterCount(f: ChatFilters): number {
  let n = 0
  if (f.dateFrom || f.dateTo) n++
  if (f.meetingIds.length) n++
  if (f.people.length) n++
  if (f.sourceTypes.length) n++
  return n
}
