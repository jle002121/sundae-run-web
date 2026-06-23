import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { colors, spacing, radii } from '../../constants/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Fill in all fields')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.logo}>Sundae Run 🍨</Text>
      <Text style={styles.subtitle}>Track every scoop</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={colors.textSecondary}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={colors.textSecondary}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Log In'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/signup" style={styles.link}>
        No account? Sign up
      </Link>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, justifyContent: 'center' },
  logo: { fontSize: 32, fontWeight: '800', color: colors.primary, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl * 2 },
  input: {
    backgroundColor: colors.card, borderRadius: radii.button, padding: spacing.lg,
    marginBottom: spacing.md, fontSize: 16, color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.accent1, borderRadius: radii.button,
    padding: spacing.lg, alignItems: 'center', marginTop: spacing.sm,
  },
  buttonText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', marginTop: spacing.lg, color: colors.textSecondary },
})
