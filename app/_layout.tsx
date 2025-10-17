import { Stack } from 'expo-router';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <Stack>
      {/* The first screen is your custom splash screen. The header is hidden. */}
      <Stack.Screen name="splash" options={{ headerShown: false }} />

      {/* This is the main part of your app with the tabs. */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}