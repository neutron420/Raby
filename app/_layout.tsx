import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import SplashScreen from './screens/splashscreen'; // <-- Updated import path

export default function RootLayout() {
  const [isReady, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Show the splash screen for 3 seconds
    const timer = setTimeout(() => {
      setReady(true);
      router.replace('/(tabs)/index'); // Navigate to the tab layout
    }, 3000);

    return () => clearTimeout(timer); // Clean up the timer
  }, [router]);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}