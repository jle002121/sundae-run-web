export type EntryDate = { created_at: string }

// Convert ISO string or Date to local YYYY-MM-DD
const toDateStr = (isoOrDate: string | Date): string => {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Today as YYYY-MM-DD
const todayStr = (): string => toDateStr(new Date())

// Get unique days with entries as a Set of YYYY-MM-DD strings
export const getCalendarDays = (entries: EntryDate[]): Set<string> => {
  return new Set(entries.map(e => toDateStr(e.created_at)))
}

// Daily streak: consecutive days ending today
export const computeDailyStreak = (entries: EntryDate[]): number => {
  const days = getCalendarDays(entries)
  const today = todayStr()
  if (!days.has(today)) return 0

  let streak = 0
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)

  while (days.has(toDateStr(cursor.toISOString()))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// Correct ISO 8601 week year (differs from calendar year at year boundaries)
const getISOWeekYear = (d: Date): number => {
  const date = new Date(d)
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7)
  return date.getFullYear()
}

// Correct ISO 8601 week number (1–53)
const getISOWeek = (d: Date): number => {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7)
  const week1 = new Date(date.getFullYear(), 0, 4)
  return 1 + Math.round(
    ((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7
  )
}

// Get ISO week key: "YYYY-WW" using ISO week year
const toWeekStr = (isoOrDate: string | Date): string => {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return `${getISOWeekYear(d)}-${String(getISOWeek(d)).padStart(2, '0')}`
}

// Weekly streak: consecutive Mon–Sun weeks ending this week
export const computeWeeklyStreak = (entries: EntryDate[]): number => {
  const weeks = new Set(entries.map(e => toWeekStr(e.created_at)))
  const thisWeek = toWeekStr(new Date())
  if (!weeks.has(thisWeek)) return 0

  let streak = 0
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)

  while (weeks.has(toWeekStr(cursor.toISOString()))) {
    streak++
    cursor.setDate(cursor.getDate() - 7)
  }
  return streak
}

// Get month key: "YYYY-MM"
const toMonthStr = (isoOrDate: string | Date): string => {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Monthly streak: consecutive calendar months ending this month
export const computeMonthlyStreak = (entries: EntryDate[]): number => {
  const months = new Set(entries.map(e => toMonthStr(e.created_at)))
  const thisMonth = toMonthStr(new Date())
  if (!months.has(thisMonth)) return 0

  let streak = 0
  const cursor = new Date()
  cursor.setDate(1)
  cursor.setHours(12, 0, 0, 0)

  while (months.has(toMonthStr(cursor.toISOString()))) {
    streak++
    cursor.setMonth(cursor.getMonth() - 1)
  }
  return streak
}
