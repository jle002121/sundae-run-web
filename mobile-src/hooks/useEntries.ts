import { useState, useEffect, useCallback } from 'react'
import { Entry } from '../lib/supabase'
import { fetchEntries, createEntry, NewEntry } from '../lib/entries'

export const useEntries = () => {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchEntries()
      setEntries(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addEntry = useCallback(async (input: NewEntry): Promise<void> => {
    const newEntry = await createEntry(input)
    setEntries(prev => [newEntry, ...prev])
  }, [])

  return { entries, loading, error, refresh: load, addEntry }
}
