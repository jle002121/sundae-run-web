import { Tabs } from 'expo-router'
import { Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, gradients } from '../../constants/theme'

function TabIcon({ icon }: { icon: string }) {
  return <Text style={{ fontSize: 20 }}>{icon}</Text>
}

function LogButton() {
  return (
    <LinearGradient colors={gradients.streakCard} style={styles.logBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={{ color: 'white', fontSize: 22, fontWeight: '300' }}>+</Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  logBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
})

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: colors.divider,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: () => <TabIcon icon="🏠" /> }}
      />
      <Tabs.Screen
        name="log"
        options={{ title: 'Log', tabBarIcon: () => <LogButton /> }}
      />
      <Tabs.Screen
        name="shops"
        options={{ title: 'Shops', tabBarIcon: () => <TabIcon icon="🗺️" /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: () => <TabIcon icon="👤" /> }}
      />
    </Tabs>
  )
}
