import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync();
    
      router.replace('/(tabs)');
    }, 4000); 
    return () => clearTimeout(timer);
  }, []);
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}