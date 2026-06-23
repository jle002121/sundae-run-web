import { ScrollView, View, Text, StyleSheet, SafeAreaView } from 'react-native'
import { useEntries } from '../../hooks/useEntries'
import StreakCalendarCard from '../../components/StreakCalendarCard'
import StatsRow from '../../components/StatsRow'
import EntryCard from '../../components/EntryCard'
import { colors, spacing } from '../../constants/theme'

export default function HomeScreen() {
  const { entries, loading } = useEntries()

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Sundae Run 🍨</Text>
          <View style={styles.avatar} />
        </View>

        {/* Streak + Calendar */}
        <StreakCalendarCard entries={entries} />

        {/* Stats */}
        <StatsRow entries={entries} />

        {/* Recent Scoops */}
        <Text style={styles.sectionLabel}>RECENT SCOOPS</Text>
        {loading && <Text style={styles.empty}>Loading…</Text>}
        {!loading && entries.length === 0 && (
          <Text style={styles.empty}>No scoops yet — tap + to log your first! 🍦</Text>
        )}
        {entries.slice(0, 10).map(entry => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  logo: { fontSize: 20, fontWeight: '700', color: colors.primary },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent1 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: spacing.sm },
  empty: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', paddingVertical: spacing.xl },
})
