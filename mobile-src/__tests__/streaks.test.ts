import {
  computeDailyStreak,
  computeWeeklyStreak,
  computeMonthlyStreak,
  getCalendarDays,
} from '../lib/streaks'

// Helper: create a date string N days ago
const daysAgo = (n: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

// Helper: create a date string in a specific month/year
const dateIn = (year: number, month: number, day: number): string =>
  new Date(year, month - 1, day, 12).toISOString()

describe('computeDailyStreak', () => {
  it('returns 0 when no entries', () => {
    expect(computeDailyStreak([])).toBe(0)
  })

  it('returns 0 when most recent entry is not today', () => {
    expect(computeDailyStreak([{ created_at: daysAgo(1) }])).toBe(0)
  })

  it('returns 1 when only today has an entry', () => {
    expect(computeDailyStreak([{ created_at: daysAgo(0) }])).toBe(1)
  })

  it('counts consecutive days including today', () => {
    const entries = [
      { created_at: daysAgo(0) },
      { created_at: daysAgo(1) },
      { created_at: daysAgo(2) },
    ]
    expect(computeDailyStreak(entries)).toBe(3)
  })

  it('stops counting at a gap', () => {
    const entries = [
      { created_at: daysAgo(0) },
      { created_at: daysAgo(1) },
      // gap: day 2 missing
      { created_at: daysAgo(3) },
    ]
    expect(computeDailyStreak(entries)).toBe(2)
  })

  it('counts multiple entries on the same day as one day', () => {
    const entries = [
      { created_at: daysAgo(0) },
      { created_at: daysAgo(0) }, // duplicate today
      { created_at: daysAgo(1) },
    ]
    expect(computeDailyStreak(entries)).toBe(2)
  })
})

describe('computeWeeklyStreak', () => {
  it('returns 0 when no entries', () => {
    expect(computeWeeklyStreak([])).toBe(0)
  })

  it('returns 1 when only this week has an entry', () => {
    expect(computeWeeklyStreak([{ created_at: daysAgo(0) }])).toBe(1)
  })

  it('counts consecutive weeks', () => {
    const entries = [
      { created_at: daysAgo(0) },  // this week
      { created_at: daysAgo(7) },  // last week
      { created_at: daysAgo(14) }, // 2 weeks ago
    ]
    expect(computeWeeklyStreak(entries)).toBe(3)
  })

  it('returns 0 when most recent entry is from last week (no entry this week)', () => {
    expect(computeWeeklyStreak([{ created_at: daysAgo(7) }])).toBe(0)
  })

  it('stops counting at a gap week', () => {
    const entries = [
      { created_at: daysAgo(0) },   // this week
      // gap: last week missing
      { created_at: daysAgo(14) },  // 2 weeks ago
    ]
    expect(computeWeeklyStreak(entries)).toBe(1)
  })
})

describe('computeMonthlyStreak', () => {
  it('returns 0 when no entries', () => {
    expect(computeMonthlyStreak([])).toBe(0)
  })

  it('returns 1 when only this month has an entry', () => {
    expect(computeMonthlyStreak([{ created_at: daysAgo(0) }])).toBe(1)
  })

  it('counts consecutive months', () => {
    const entries = [
      { created_at: dateIn(2026, 4, 1) },  // April (this month)
      { created_at: dateIn(2026, 3, 1) },  // March
      { created_at: dateIn(2026, 2, 1) },  // February
    ]
    expect(computeMonthlyStreak(entries)).toBe(3)
  })

  it('stops counting at a gap month', () => {
    const entries = [
      { created_at: dateIn(2026, 4, 1) },  // April
      // gap: March missing
      { created_at: dateIn(2026, 2, 1) },  // February
    ]
    expect(computeMonthlyStreak(entries)).toBe(1)
  })
})

describe('getCalendarDays', () => {
  it('returns a set of date strings (YYYY-MM-DD) for days with entries', () => {
    const entries = [
      { created_at: dateIn(2026, 4, 5) },
      { created_at: dateIn(2026, 4, 5) }, // duplicate
      { created_at: dateIn(2026, 4, 7) },
    ]
    const days = getCalendarDays(entries)
    expect(days.has('2026-04-05')).toBe(true)
    expect(days.has('2026-04-07')).toBe(true)
    expect(days.size).toBe(2)
  })
})
