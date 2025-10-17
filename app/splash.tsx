import React, { useEffect } from 'react';
import { StyleSheet, Image } from 'react-native'; // Removed Platform as it wasn't used
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

    // Navigate to the main app after 4 seconds
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 4000);

    return () => clearTimeout(timer); // Cleanup
  }, []);

  return (
    <LinearGradient
      // Darker, vibrant purple gradient for excellent contrast
      colors={['#4B0082', '#6A0DAD', '#8A2BE2']} // Indigo, DarkOrchid, BlueViolet - these are strong purples
      start={{ x: 0, y: 0 }} // Start gradient from top-left
      end={{ x: 1, y: 1 }}   // End gradient at bottom-right
      style={styles.container}
    >
      <AnimatedImage

        source={require('@/assets/images/splash-icon.png')}
        style={[styles.logo, { transform: [{ scale }], opacity }]}
      />
      <Animated.View style={{ opacity }}>
        <ThemedText type="title" style={styles.title}>Raby</ThemedText>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  logo: { 
    width: 220, // Slightly adjusted logo size
    height: 220, 
    resizeMode: 'contain',
    marginBottom: 25, // More space below the logo
  },
  title: { 
    marginTop: 0, 
    fontSize: 58, // Even larger font size
    fontWeight: 'bold',
    color: '#FFFFFF', // <<< THIS IS THE KEY FIX: Force white color
    textShadowColor: 'rgba(0, 0, 0, 0.5)', // Stronger, more visible shadow
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10, // Increased shadow radius
    // If you have a custom font, you can add it here too, e.g., fontFamily: 'SpaceMono-Regular',
  },
});