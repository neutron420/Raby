import React, { useEffect } from 'react';
import { StyleSheet, Image } from 'react-native';
import Animated, { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function CustomSplashScreen() {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const router = useRouter();

  useEffect(() => {
    // Animate the splash screen elements
    scale.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) });
    opacity.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.exp) });

    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      // Subtle dark gradient — deep black fading into soft charcoal gray
      colors={['#0A0A0A', '#1A1A1A', '#2A2A2A']} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <AnimatedImage
        source={require('@/assets/images/logo-wallet-splash.png')}
        style={[styles.logo, { transform: [{ scale }], opacity }]}
      />
      <Animated.View style={{ opacity }}>
        <ThemedText type="title" style={styles.title}></ThemedText>
      </Animated.View>
    </LinearGradient>
  );
}

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
