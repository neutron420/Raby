import React, { useEffect } from 'react';
import { StyleSheet, Image } from 'react-native';
import Animated, { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';

const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function CustomSplashScreen() {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const router = useRouter();

  useEffect(() => {
    // Animate the splash screen
    scale.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) });
    opacity.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.exp) });

    // After 4 seconds, navigate to the main app
    const timer = setTimeout(() => {
      router.replace('/(tabs)'); // Navigate to the tabs layout
    }, 4000); // 4 seconds

    return () => clearTimeout(timer); // Cleanup
  }, []);

  return (
    <ThemedView style={styles.container}>
      <AnimatedImage
        source={require('@/assets/images/splash-icon.png')}
        style={[styles.logo, { transform: [{ scale }], opacity }]}
      />
      <Animated.View style={{ opacity }}>
        <ThemedText type="title" style={styles.title}>Raby</ThemedText>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 200, height: 200, resizeMode: 'contain' },
  title: { marginTop: 24, fontSize: 40, fontWeight: 'bold' },
});