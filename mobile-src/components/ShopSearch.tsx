import { useState } from 'react'
import {
  View, Text, TextInput,
  TouchableOpacity, StyleSheet, ActivityIndicator
} from 'react-native'
import { colors, spacing, radii } from '../constants/theme'

export type Shop = {
  place_id: string
  name: string
  vicinity: string
  lat: number
  lng: number
}

type Props = {
  value: Shop | null
  onChange: (shop: Shop | null) => void
}

const PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? ''

export default function ShopSearch({ value, onChange }: Props) {
  const [query, setQuery] = useState(value?.name ?? '')
  const [results, setResults] = useState<Shop[]>([])
  const [loading, setLoading] = useState(false)

  const search = async (text: string) => {
    setQuery(text)
    if (text.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(text + ' ice cream')}&key=${PLACES_KEY}`
      const res = await fetch(url)
      const json = await res.json()
      const shops: Shop[] = (json.results ?? []).slice(0, 5).map((r: any) => ({
        place_id: r.place_id,
        name: r.name,
        vicinity: r.formatted_address ?? r.vicinity ?? '',
        lat: r.geometry.location.lat,
        lng: r.geometry.location.lng,
      }))
      setResults(shops)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const select = (shop: Shop) => {
    setQuery(shop.name)
    setResults([])
    onChange(shop)
  }

  const clear = () => {
    setQuery('')
    setResults([])
    onChange(null)
  }

  return (
    <View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Search for a shop…"
          value={query}
          onChangeText={search}
          placeholderTextColor={colors.textSecondary}
        />
        {loading && <ActivityIndicator color={colors.primary} style={styles.spinner} />}
        {value && <TouchableOpacity onPress={clear}><Text style={styles.clear}>✕</Text></TouchableOpacity>}
      </View>
      {results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map(shop => (
            <TouchableOpacity key={shop.place_id} style={styles.result} onPress={() => select(shop)}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <Text style={styles.shopAddr} numberOfLines={1}>{shop.vicinity}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.button, paddingHorizontal: spacing.lg, marginBottom: spacing.xs },
  input: { flex: 1, paddingVertical: spacing.lg, fontSize: 15, color: colors.textPrimary },
  spinner: { marginLeft: spacing.sm },
  clear: { color: colors.textSecondary, fontSize: 16, paddingLeft: spacing.sm },
  dropdown: { backgroundColor: colors.card, borderRadius: radii.button, overflow: 'hidden', marginBottom: spacing.sm },
  result: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  shopName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  shopAddr: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
})
