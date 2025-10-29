// app/splash.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Image } from 'react-native';
import Animated, { useSharedValue, withTiming, Easing, runOnJS } from 'react-native-reanimated'; // Import runOnJS
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store'; // Import SecureStore

const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function CustomSplashScreen() {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const router = useRouter();

  useEffect(() => {
    // Animate the splash screen elements
    scale.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) });
    opacity.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.exp) });

    // --- Function to check wallet status and navigate ---
    const checkWalletAndNavigate = async () => {
      try {
        // Check SecureStore for the flag indicating a wallet exists
        // This flag should be set to 'true' in your create-wallet and import flows upon success
        const walletExists = await SecureStore.getItemAsync('walletExists');

        if (walletExists === 'true') {
          // Wallet exists, navigate to the UNLOCK screen first
          console.log('Wallet exists, navigating to unlock screen...');
          router.replace('/unlock-wallet'); // Navigate to unlock screen
        } else {
          // No wallet found, navigate to the setup screen
          console.log('No wallet found, navigating to setup...');
          router.replace('/wallet-setup'); // Navigate to setup screen
        }
      } catch (error) {
        console.error("Error checking SecureStore:", error);
        // Fallback: If error reading store, go to setup just in case
        router.replace('/wallet-setup');
      }
    };
    // --- End function ---


    // Set a timer to run the check after the animation duration (adjust as needed)
    const timer = setTimeout(() => {
      // Use runOnJS to safely call async function from reanimated/UI thread
      runOnJS(checkWalletAndNavigate)();
    }, 2500); // Example delay - adjust time as needed (e.g., match animation)

    // Cleanup function to clear the timer if the component unmounts
    return () => clearTimeout(timer);

  }, [router, scale, opacity]); // Dependency array includes router, scale, and opacity

  return (
    <LinearGradient
      // Subtle dark gradient — deep black fading into soft charcoal gray
      colors={['#0A0A0A', '#1A1A1A', '#2A2A2A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <AnimatedImage
        source={require('@/assets/images/logo-wallet-splash.png')} // Make sure this path is correct
        style={[styles.logo, { transform: [{ scale }], opacity }]}
      />
      <Animated.View style={{ opacity }}>
        {/* Added App Name */}
        <ThemedText type="title" style={styles.title}>Raby</ThemedText>
      </Animated.View>
    </LinearGradient>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
    marginBottom: 25,
  },
  title: {
    marginTop: 0,
    fontSize: 58,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
});