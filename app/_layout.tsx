// app/_layout.tsx
import { Stack } from 'expo-router';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <Stack>
      {/* The first screen is your custom splash screen. The header is hidden. */}
      <Stack.Screen name="splash" options={{ headerShown: false }} />

      {/* Configure the wallet-setup screen to hide its header */}
      <Stack.Screen name="wallet-setup" options={{ headerShown: false }} />

      {/* Hide headers for the wallet creation and import flows */}
      <Stack.Screen name="create-wallet" options={{ headerShown: false }} />
      <Stack.Screen name="import-wallet" options={{ headerShown: false }} />

      {/* This is the main part of your app with the tabs. */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}