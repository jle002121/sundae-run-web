import { useMemo, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, SafeAreaView,
} from 'react-native'
import MapView, { Marker, Callout, Region } from 'react-native-maps'
import { useEntries } from '../../hooks/useEntries'
import { Entry } from '../../lib/supabase'
import { colors, spacing, radii } from '../../constants/theme'

const SCREEN_HEIGHT = Dimensions.get('window').height

// Collapse entries into unique shop records with visit counts + ratings
type ShopPin = {
  place_id: string
  name: string
  lat: number
  lng: number
  visits: number
  avgRating: number | null
  lastVisited: string
  flavors: string[]
}

function buildShopPins(entries: Entry[]): ShopPin[] {
  const map = new Map<string, ShopPin>()
  for (const e of entries) {
    if (!e.shop_place_id || e.shop_lat == null || e.shop_lng == null) continue
    const existing = map.get(e.shop_place_id)
    if (existing) {
      existing.visits++
      if (e.rating != null) {
        const prev = existing.avgRating ?? 0
        existing.avgRating = (prev * (existing.visits - 1) + e.rating) / existing.visits
      }
      if (e.flavor && !existing.flavors.includes(e.flavor)) existing.flavors.push(e.flavor)
      if (e.created_at > existing.lastVisited) existing.lastVisited = e.created_at
    } else {
      map.set(e.shop_place_id, {
        place_id: e.shop_place_id,
        name: e.shop_name ?? 'Unknown Shop',
        lat: e.shop_lat,
        lng: e.shop_lng,
        visits: 1,
        avgRating: e.rating ?? null,
        lastVisited: e.created_at,
        flavors: e.flavor ? [e.flavor] : [],
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.visits - a.visits)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ratingStars(avg: number | null) {
  if (avg == null) return '—'
  return '🍨'.repeat(Math.round(avg)) + ' ' + avg.toFixed(1)
}

// Compute a region that fits all pins with padding
function fitRegion(pins: ShopPin[]): Region | null {
  if (pins.length === 0) return null
  const lats = pins.map(p => p.lat)
  const lngs = pins.map(p => p.lng)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.05),
    longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.05),
  }
}

export default function ShopsScreen() {
  const { entries, loading } = useEntries()
  const mapRef = useRef<MapView>(null)
  const [selected, setSelected] = useState<ShopPin | null>(null)

  const pins = useMemo(() => buildShopPins(entries), [entries])
  const region = useMemo(() => fitRegion(pins), [pins])

  const flyTo = (pin: ShopPin) => {
    setSelected(pin)
    mapRef.current?.animateToRegion({
      latitude: pin.lat,
      longitude: pin.lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 400)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.header}>Shops 🗺️</Text>

      {/* Map */}
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region ?? {
            latitude: 32.7157,  // San Diego fallback
            longitude: -117.1611,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }}
          showsUserLocation
          showsMyLocationButton
        >
          {pins.map(pin => (
            <Marker
              key={pin.place_id}
              coordinate={{ latitude: pin.lat, longitude: pin.lng }}
              onPress={() => setSelected(pin)}
            >
              {/* Custom ice cream pin */}
              <View style={[styles.pin, selected?.place_id === pin.place_id && styles.pinActive]}>
                <Text style={styles.pinEmoji}>🍦</Text>
                {pin.visits > 1 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pin.visits}</Text>
                  </View>
                )}
              </View>

              <Callout tooltip>
                <View style={styles.callout}>
                  <Text style={styles.calloutName} numberOfLines={2}>{pin.name}</Text>
                  <Text style={styles.calloutStat}>{pin.visits} visit{pin.visits !== 1 ? 's' : ''}</Text>
                  {pin.avgRating != null && (
                    <Text style={styles.calloutStat}>{ratingStars(pin.avgRating)}</Text>
                  )}
                  <Text style={styles.calloutDate}>Last: {formatDate(pin.lastVisited)}</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* Empty state overlay */}
        {pins.length === 0 && !loading && (
          <View style={styles.emptyOverlay}>
            <Text style={styles.emptyEmoji}>🗺️</Text>
            <Text style={styles.emptyText}>Log ice cream at a shop</Text>
            <Text style={styles.emptyHint}>Your spots will show up here</Text>
          </View>
        )}
      </View>

      {/* Shop list */}
      <FlatList
        data={pins}
        keyExtractor={p => p.place_id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          pins.length > 0 ? (
            <Text style={styles.listHeader}>{pins.length} shop{pins.length !== 1 ? 's' : ''} visited</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.shopCard, selected?.place_id === item.place_id && styles.shopCardActive]}
            onPress={() => flyTo(item)}
            activeOpacity={0.75}
          >
            <View style={styles.shopLeft}>
              <Text style={styles.shopName}>{item.name}</Text>
              {item.flavors.length > 0 && (
                <Text style={styles.shopFlavors} numberOfLines={1}>
                  {item.flavors.slice(0, 3).join(' · ')}
                </Text>
              )}
              <Text style={styles.shopDate}>Last visited {formatDate(item.lastVisited)}</Text>
            </View>
            <View style={styles.shopRight}>
              <Text style={styles.visitCount}>{item.visits}</Text>
              <Text style={styles.visitLabel}>visit{item.visits !== 1 ? 's' : ''}</Text>
              {item.avgRating != null && (
                <Text style={styles.shopRating}>{item.avgRating.toFixed(1)} 🍨</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    fontSize: 22, fontWeight: '800', color: colors.primary,
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },

  mapWrapper: { height: SCREEN_HEIGHT * 0.38, position: 'relative' },
  map: { flex: 1 },

  pin: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'white', borderRadius: 20,
    padding: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
    borderWidth: 2, borderColor: colors.divider,
  },
  pinActive: { borderColor: colors.primary, borderWidth: 2.5 },
  pinEmoji: { fontSize: 22 },
  badge: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: colors.primary, borderRadius: 9,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '800' },

  callout: {
    backgroundColor: 'white', borderRadius: radii.button, padding: spacing.md,
    minWidth: 160, maxWidth: 220,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, elevation: 5,
  },
  calloutName: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginBottom: 3 },
  calloutStat: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  calloutDate: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  emptyOverlay: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(247,240,255,0.75)',
  },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  emptyHint: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs },

  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 2 },
  listHeader: {
    fontSize: 13, fontWeight: '600', color: colors.textSecondary,
    paddingVertical: spacing.sm,
  },

  shopCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radii.card, padding: spacing.lg,
    marginBottom: spacing.sm,
    shadowColor: '#5B3FA6', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  shopCardActive: { borderColor: colors.accent1 },

  shopLeft: { flex: 1, marginRight: spacing.md },
  shopName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  shopFlavors: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  shopDate: { fontSize: 11, color: colors.textSecondary },

  shopRight: { alignItems: 'center' },
  visitCount: { fontSize: 22, fontWeight: '900', color: colors.primary },
  visitLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  shopRating: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
})
