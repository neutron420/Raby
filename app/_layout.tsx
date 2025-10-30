// app/_layout.tsx
import 'react-native-get-random-values'; // Keep this as backup
import 'react-native-reanimated';
import { Stack } from 'expo-router';
import { WalletProvider } from '@/context/wallet-context';

export default function RootLayout() {
  return (
    <WalletProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" />
        <Stack.Screen name="wallet-setup" />
        <Stack.Screen name="create-wallet" />
        <Stack.Screen name="import-option" />
        <Stack.Screen name="import-phrase" />
        <Stack.Screen name="import-key" />
        <Stack.Screen name="unlock-wallet" />
        <Stack.Screen name="set-pin" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </WalletProvider>
  );
}