import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Entry } from '../lib/supabase'
import {
  computeDailyStreak,
  computeWeeklyStreak,
  computeMonthlyStreak,
  getCalendarDays,
} from '../lib/streaks'
import { colors, gradients, spacing, radii } from '../constants/theme'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const toDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

type Props = { entries: Entry[] }

export default function StreakCalendarCard({ entries }: Props) {
  const [viewDate, setViewDate] = useState(new Date())
  const scoopDays = getCalendarDays(entries)

  const daily = computeDailyStreak(entries)
  const weekly = computeWeeklyStreak(entries)
  const monthly = computeMonthlyStreak(entries)

  // Build calendar grid for viewDate's month
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = toDateStr(new Date())

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const prevMonth = () => {
    const d = new Date(viewDate); d.setMonth(d.getMonth() - 1); setViewDate(d)
  }
  const nextMonth = () => {
    const d = new Date(viewDate); d.setMonth(d.getMonth() + 1); setViewDate(d)
  }

  const streaks = [
    { icon: '🔥', value: daily, label: 'DAILY' },
    { icon: '✅', value: weekly, label: 'WEEKLY' },
    { icon: '📅', value: monthly, label: 'MONTHLY' },
  ]

  return (
    <LinearGradient colors={gradients.streakCard} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      {/* Streak counters */}
      <View style={styles.streakRow}>
        {streaks.map(({ icon, value, label }, i) => (
          <View key={label} style={styles.streakItem}>
            <Text style={styles.streakIcon}>{icon}</Text>
            <Text style={styles.streakValue}>{value}</Text>
            <Text style={styles.streakLabel}>{label}</Text>
            {i < 2 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      {/* Divider */}
      <View style={styles.horizontalDivider} />

      {/* Calendar */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={prevMonth}>
          <Text style={styles.arrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth}>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Day labels */}
      <View style={styles.grid}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>

      {/* Calendar cells */}
      <View style={styles.grid}>
        {Array.from({ length: firstDay }, (_, i) => (
          <View key={`empty-${i}`} style={styles.cell} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const hasScoop = scoopDays.has(dateStr)
          const isToday = dateStr === todayStr
          return (
            <View
              key={day}
              style={[
                styles.cell,
                hasScoop && styles.scoopCell,
                isToday && styles.todayCell,
              ]}
            >
              <Text style={[styles.dayNum, isToday && styles.todayNum, hasScoop && styles.scoopNum]}>
                {day}
              </Text>
            </View>
          )
        })}
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.card, padding: spacing.lg, marginBottom: spacing.md },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, position: 'relative' },
  streakItem: { flex: 1, alignItems: 'center' },
  streakIcon: { fontSize: 20 },
  streakValue: { fontSize: 22, fontWeight: '800', color: 'white', lineHeight: 26 },
  streakLabel: { fontSize: 8, color: 'rgba(255,255,255,0.85)', fontWeight: '700', letterSpacing: 0.5 },
  divider: { position: 'absolute', right: 0, top: 4, bottom: 4, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  horizontalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: spacing.md },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  arrow: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', paddingHorizontal: spacing.sm },
  monthLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayLabel: { width: '14.28%', textAlign: 'center', fontSize: 8, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 3 },
  cell: { width: '14.28%', aspectRatio: 1, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  scoopCell: { backgroundColor: 'rgba(255,255,255,0.3)' },
  todayCell: { backgroundColor: 'white' },
  dayNum: { fontSize: 8, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  scoopNum: { color: 'white' },
  todayNum: { color: colors.primary, fontWeight: '800' },
})
