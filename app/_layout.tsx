// app/_layout.tsx
import { Stack } from 'expo-router';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="wallet-setup" />
      <Stack.Screen name="create-wallet" />
      <Stack.Screen name="import-options" />
      <Stack.Screen name="import-phrase" />
      <Stack.Screen name="import-key" />
      <Stack.Screen name="unlock-wallet" /> {/* Add unlock screen */}
      <Stack.Screen name="set-pin" />      {/* Add set-pin screen */}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}