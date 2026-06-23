import { View, Text, StyleSheet } from 'react-native'
import { Entry } from '../lib/supabase'
import { colors, spacing, radii } from '../constants/theme'

type Props = { entries: Entry[] }

export default function StatsRow({ entries }: Props) {
  const scoops = entries.length
  const flavors = new Set(entries.map(e => e.flavor.toLowerCase().trim())).size
  const shops = new Set(entries.filter(e => e.shop_place_id).map(e => e.shop_place_id!)).size

  return (
    <View style={styles.row}>
      <View style={styles.card}>
        <Text style={styles.number}>{scoops}</Text>
        <Text style={styles.label}>scoops</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.number}>{flavors}</Text>
        <Text style={styles.label}>flavors</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.number}>{shops}</Text>
        <Text style={styles.label}>shops</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  card: {
    flex: 1, backgroundColor: colors.card, borderRadius: radii.card,
    padding: spacing.sm, alignItems: 'center',
  },
  number: { fontSize: 20, fontWeight: '800', color: colors.primary },
  label: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
})
