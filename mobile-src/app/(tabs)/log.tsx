import { SafeAreaView, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import LogForm from '../../components/LogForm'
import { useEntries } from '../../hooks/useEntries'
import { colors, spacing } from '../../constants/theme'

export default function LogScreen() {
  const { addEntry } = useEntries()
  const router = useRouter()

  const handleSubmit = async (entry: Parameters<typeof addEntry>[0]) => {
    await addEntry(entry)
    router.replace('/(tabs)')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>New Scoop 🍦</Text>
      <LogForm onSubmit={handleSubmit} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '800', color: colors.primary, padding: spacing.lg, paddingBottom: 0 },
})
