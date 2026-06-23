import { View, Text, Image, StyleSheet } from 'react-native'
import { Entry } from '../lib/supabase'
import { colors, spacing, radii } from '../constants/theme'

const FLAVOR_COLORS = ['#FFB3C6', '#C9B8FF', '#B8F0E6', '#FFE4A0', '#FFD6B3']

const flavorColor = (flavor: string): string =>
  FLAVOR_COLORS[flavor.charCodeAt(0) % FLAVOR_COLORS.length]

const formatDate = (iso: string): string => {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type Props = { entry: Entry }

export default function EntryCard({ entry }: Props) {
  return (
    <View style={styles.card}>
      {entry.photo_url ? (
        <Image source={{ uri: entry.photo_url }} style={styles.photo} />
      ) : (
        <View style={[styles.colorChip, { backgroundColor: flavorColor(entry.flavor) }]} />
      )}
      <View style={styles.info}>
        <Text style={styles.flavor}>{entry.flavor}</Text>
        <Text style={styles.meta}>
          {entry.shop_name ?? 'Unknown shop'} · {formatDate(entry.created_at)}
        </Text>
        {entry.rating && (
          <Text style={styles.rating}>{'🍨'.repeat(entry.rating)}</Text>
        )}
      </View>
      <Text style={styles.privacy}>{entry.is_public ? '🌍' : '🔒'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: radii.card,
    padding: spacing.md, flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginBottom: spacing.xs,
  },
  colorChip: { width: 32, height: 32, borderRadius: radii.chip, flexShrink: 0 },
  photo: { width: 32, height: 32, borderRadius: radii.chip, flexShrink: 0 },
  info: { flex: 1 },
  flavor: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  rating: { fontSize: 10, marginTop: 2 },
  privacy: { fontSize: 14, opacity: 0.4 },
})
