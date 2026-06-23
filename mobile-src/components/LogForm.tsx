import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  Image, StyleSheet, Switch, Alert, ScrollView
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import ShopSearch, { Shop } from './ShopSearch'
import { NewEntry } from '../lib/entries'
import { colors, spacing, radii, gradients } from '../constants/theme'

type Props = {
  onSubmit: (entry: NewEntry) => Promise<void>
}

export default function LogForm({ onSubmit }: Props) {
  const [flavor, setFlavor] = useState('')
  const [shop, setShop] = useState<Shop | null>(null)
  const [rating, setRating] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [price, setPrice] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const pickPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    })
    if (!result.canceled) setPhotoUri(result.assets[0].uri)
  }

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    })
    if (!result.canceled) setPhotoUri(result.assets[0].uri)
  }

  const handleSubmit = async () => {
    if (!flavor.trim()) return Alert.alert('Add a flavor!')
    setLoading(true)
    try {
      await onSubmit({
        flavor: flavor.trim(),
        shop_name: shop?.name,
        shop_place_id: shop?.place_id,
        shop_lat: shop?.lat,
        shop_lng: shop?.lng,
        photo_uri: photoUri ?? undefined,
        rating: rating > 0 ? rating : undefined,
        notes: notes.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        is_public: isPublic,
      })
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Photo */}
      {photoUri ? (
        <View style={styles.photoArea}>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          <TouchableOpacity style={styles.photoRemove} onPress={() => setPhotoUri(null)}>
            <Text style={styles.photoRemoveText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.photoButtonRow}>
          <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
            <Text style={styles.photoBtnIcon}>📷</Text>
            <Text style={styles.photoBtnLabel}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={pickFromLibrary}>
            <Text style={styles.photoBtnIcon}>🖼️</Text>
            <Text style={styles.photoBtnLabel}>Library</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Flavor */}
      <TextInput
        style={styles.input}
        placeholder="Flavor *"
        value={flavor}
        onChangeText={setFlavor}
        placeholderTextColor={colors.textSecondary}
      />

      {/* Shop */}
      <ShopSearch value={shop} onChange={setShop} />

      {/* Rating */}
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity key={n} onPress={() => setRating(n === rating ? 0 : n)}>
            <Text style={[styles.scoopIcon, n <= rating && styles.scoopActive]}>🍨</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notes */}
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Notes…"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        placeholderTextColor={colors.textSecondary}
      />

      {/* Price */}
      <TextInput
        style={[styles.input, styles.priceInput]}
        placeholder="$ Price (optional)"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        placeholderTextColor={colors.textSecondary}
      />

      {/* Public toggle */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>{isPublic ? '🌍 Public' : '🔒 Private'}</Text>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ true: colors.accent1, false: colors.divider }}
          thumbColor={isPublic ? colors.primary : '#ccc'}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.submitWrapper}>
        <LinearGradient colors={gradients.streakCard} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.submitText}>{loading ? 'Logging…' : 'Log It 🍦'}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 3 },
  photoArea: { marginBottom: spacing.md, position: 'relative' },
  photoPreview: { width: '100%', height: 200, borderRadius: radii.card },
  photoRemove: {
    position: 'absolute', top: spacing.sm, right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 14,
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  photoRemoveText: { color: 'white', fontSize: 13, fontWeight: '700' },
  photoButtonRow: {
    flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md,
  },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.card, borderRadius: radii.button,
    paddingVertical: spacing.md, borderWidth: 1.5, borderColor: colors.divider,
  },
  photoBtnIcon: { fontSize: 18 },
  photoBtnLabel: { fontSize: 14, fontWeight: '600', color: colors.primary },
  input: {
    backgroundColor: colors.card, borderRadius: radii.button,
    padding: spacing.lg, fontSize: 15, color: colors.textPrimary, marginBottom: spacing.md,
  },
  notesInput: { height: 80, textAlignVertical: 'top' },
  priceInput: { fontSize: 13, color: colors.textSecondary },
  ratingRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  scoopIcon: { fontSize: 28, opacity: 0.25 },
  scoopActive: { opacity: 1 },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radii.button, padding: spacing.lg, marginBottom: spacing.lg,
  },
  toggleLabel: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
  submitWrapper: { marginTop: spacing.sm },
  submitBtn: { borderRadius: radii.button, padding: spacing.lg, alignItems: 'center' },
  submitText: { color: 'white', fontWeight: '700', fontSize: 16 },
})
