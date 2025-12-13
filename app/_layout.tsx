// app/_layout.tsx
import { WalletProvider } from '@/context/wallet-context';
import { Stack } from 'expo-router';
import 'react-native-get-random-values'; // Keep this as backup
import 'react-native-reanimated';

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
        <Stack.Screen name="receive" />
        <Stack.Screen name="send" />
        <Stack.Screen name="scan-qr" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </WalletProvider>
  );
}