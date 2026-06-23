import { supabase, Entry } from './supabase'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'

// Fetch all entries for the current user, newest first
export const fetchEntries = async (): Promise<Entry[]> => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

// Upload a photo to Supabase Storage, return public URL
export const uploadPhoto = async (localUri: string, userId: string): Promise<string> => {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  })
  const ext = localUri.split('.').pop() ?? 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('entry-photos')
    .upload(path, decode(base64), { contentType: `image/${ext}` })

  if (error) throw error

  const { data } = supabase.storage.from('entry-photos').getPublicUrl(path)
  return data.publicUrl
}

export type NewEntry = {
  flavor: string
  shop_name?: string
  shop_place_id?: string
  shop_lat?: number
  shop_lng?: number
  photo_uri?: string  // local URI, will be uploaded
  rating?: number
  notes?: string
  price?: number
  is_public: boolean
}

// Create a new entry, uploading photo if provided
export const createEntry = async (input: NewEntry): Promise<Entry> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let photo_url: string | null = null
  if (input.photo_uri) {
    photo_url = await uploadPhoto(input.photo_uri, user.id)
  }

  const { data, error } = await supabase
    .from('entries')
    .insert({
      user_id: user.id,
      flavor: input.flavor,
      shop_name: input.shop_name ?? null,
      shop_place_id: input.shop_place_id ?? null,
      shop_lat: input.shop_lat ?? null,
      shop_lng: input.shop_lng ?? null,
      photo_url,
      rating: input.rating ?? null,
      notes: input.notes ?? null,
      price: input.price ?? null,
      is_public: input.is_public,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
