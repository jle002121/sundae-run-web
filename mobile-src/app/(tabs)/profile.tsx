import { SafeAreaView, FlatList, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useEntries } from '../../hooks/useEntries'
import { useAuth } from '../../hooks/useAuth'
import EntryCard from '../../components/EntryCard'
import { colors, spacing } from '../../constants/theme'

export default function ProfileScreen() {
  const { entries, loading, refresh } = useEntries()
  const { session, signOut } = useAuth()

  const email = session?.user?.email ?? ''

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={refresh}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.avatarLarge} />
            <Text style={styles.email}>{email}</Text>
            <Text style={styles.count}>{entries.length} scoops logged</Text>
            <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
            <Text style={styles.sectionLabel}>ALL SCOOPS</Text>
          </View>
        }
        renderItem={({ item }) => <EntryCard entry={item} />}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No scoops yet — go get some ice cream! 🍦</Text> : null
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { marginBottom: spacing.md, alignItems: 'center' },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent1, marginBottom: spacing.md },
  email: { fontSize: 14, color: colors.textPrimary, fontWeight: '600', marginBottom: spacing.xs },
  count: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md },
  signOutBtn: { marginBottom: spacing.xl, padding: spacing.sm },
  signOutText: { color: colors.textSecondary, fontSize: 13 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, alignSelf: 'flex-start' },
  empty: { color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.xl },
})
