import {  StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function WalletScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Raby Wallet</ThemedText>
      <ThemedText>Your wallet balance and transactions will be here.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});