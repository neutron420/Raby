// app/send.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useWallet } from '@/context/wallet-context';
import { useRouter } from 'expo-router';
import { ethers } from 'ethers';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function SendScreen() {
  const router = useRouter();
  const { wallet, address, balance } = useWallet();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);

  const availableBalance = parseFloat(balance || '0');
  const amountValue = parseFloat(amount) || 0;

  const validateAddress = (addr: string) => {
    return ethers.utils.isAddress(addr);
  };

  const handleMaxAmount = () => {
    // Reserve some ETH for gas (estimate 0.001 ETH)
    const maxAmount = Math.max(0, availableBalance - 0.001);
    setAmount(maxAmount.toFixed(6));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const estimateGas = async () => {
    if (!wallet || !wallet.provider || !validateAddress(recipientAddress) || !amount) {
      setGasEstimate(null);
      return;
    }

    try {
      const gasPrice = await wallet.provider.getGasPrice();
      const gasLimit = 21000; // Standard ETH transfer
      const gasCost = gasPrice.mul(gasLimit);
      const gasCostEth = parseFloat(ethers.utils.formatEther(gasCost));
      setGasEstimate(gasCostEth.toFixed(6));
    } catch (error) {
      console.error('Error estimating gas:', error);
      setGasEstimate(null);
    }
  };

  React.useEffect(() => {
    if (recipientAddress && amount) {
      const timeout = setTimeout(estimateGas, 500);
      return () => clearTimeout(timeout);
    }
  }, [recipientAddress, amount]);

  const handleSend = async () => {
    if (!wallet || !wallet.provider) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    // Validation
    if (!recipientAddress.trim()) {
      Alert.alert('Error', 'Please enter recipient address');
      return;
    }

    if (!validateAddress(recipientAddress)) {
      Alert.alert('Error', 'Invalid Ethereum address');
      return;
    }

    if (!amount || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amountValue > availableBalance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    // Confirm transaction
    Alert.alert(
      'Confirm Transaction',
      `Send ${amount} ETH to ${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-6)}?\n\nEstimated gas: ${gasEstimate || '0.0001'} ETH`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            setIsLoading(true);
            try {
              const tx = {
                to: recipientAddress,
                value: ethers.utils.parseEther(amount),
              };

              // Send transaction
              const transaction = await wallet.sendTransaction(tx);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              Alert.alert(
                'Transaction Sent',
                `Transaction hash: ${transaction.hash.slice(0, 10)}...\n\nView on Etherscan to track status.`,
                [
                  {
                    text: 'View on Explorer',
                    onPress: () => {
                      // In a real app, open Etherscan URL
                      Alert.alert('Explorer', 'This will open in browser');
                    },
                  },
                  { text: 'OK', onPress: () => router.back() },
                ],
              );
            } catch (error: any) {
              console.error('Transaction error:', error);
              Alert.alert(
                'Transaction Failed',
                error.message || 'Failed to send transaction. Please try again.',
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const isAddressValid = recipientAddress ? validateAddress(recipientAddress) : null;
  const canSend =
    isAddressValid &&
    amountValue > 0 &&
    amountValue <= availableBalance &&
    !isLoading;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#0A0A0A', '#121212']}
        style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Send</ThemedText>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <ThemedText style={styles.balanceLabel}>Available Balance</ThemedText>
          <ThemedText style={styles.balanceAmount}>
            {availableBalance.toFixed(6)} ETH
          </ThemedText>
        </View>

        {/* Recipient Address */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Recipient Address</ThemedText>
          <View
            style={[
              styles.inputContainer,
              isAddressValid === false && styles.inputContainerError,
              isAddressValid === true && styles.inputContainerValid,
            ]}>
            <TextInput
              style={styles.input}
              value={recipientAddress}
              onChangeText={setRecipientAddress}
              placeholder="0x..."
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isAddressValid === true && (
              <Ionicons name="checkmark-circle" size={20} color="#00FF88" />
            )}
            {isAddressValid === false && recipientAddress.length > 0 && (
              <Ionicons name="close-circle" size={20} color="#FF4444" />
            )}
          </View>
          {isAddressValid === false && recipientAddress.length > 0 && (
            <ThemedText style={styles.errorText}>Invalid address format</ThemedText>
          )}
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <View style={styles.amountHeader}>
            <ThemedText style={styles.sectionLabel}>Amount</ThemedText>
            <TouchableOpacity onPress={handleMaxAmount} style={styles.maxButton}>
              <ThemedText style={styles.maxButtonText}>MAX</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.amountContainer}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.0"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
            />
            <View style={styles.ethBadge}>
              <ThemedText style={styles.ethBadgeText}>ETH</ThemedText>
            </View>
          </View>
          {amountValue > 0 && (
            <ThemedText style={styles.usdValue}>
              ≈ ${(amountValue * 3000).toFixed(2)} USD
            </ThemedText>
          )}
        </View>

        {/* Gas Estimate */}
        {gasEstimate && (
          <View style={styles.gasCard}>
            <View style={styles.gasRow}>
              <ThemedText style={styles.gasLabel}>Estimated Gas Fee</ThemedText>
              <ThemedText style={styles.gasValue}>{gasEstimate} ETH</ThemedText>
            </View>
            <View style={styles.gasRow}>
              <ThemedText style={styles.gasLabel}>Total</ThemedText>
              <ThemedText style={styles.gasTotal}>
                {(amountValue + parseFloat(gasEstimate)).toFixed(6)} ETH
              </ThemedText>
            </View>
          </View>
        )}

        {/* Warning */}
        {amountValue > availableBalance && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={20} color="#FF4444" />
            <ThemedText style={styles.warningText}>
              Insufficient balance. Available: {availableBalance.toFixed(6)} ETH
            </ThemedText>
          </View>
        )}

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Ionicons name="arrow-up" size={20} color="#000" />
              <ThemedText style={styles.sendButtonText}>Send Transaction</ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={16} color={Colors.dark.tint} />
          <ThemedText style={styles.infoText}>
            Transactions are irreversible. Double-check the address and amount before
            sending.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  balanceCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  balanceLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark.tint,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    gap: 12,
  },
  inputContainerValid: {
    borderColor: '#00FF88',
  },
  inputContainerError: {
    borderColor: '#FF4444',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: 12,
    color: '#FF4444',
    marginTop: 8,
  },
  amountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  maxButton: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  maxButtonText: {
    fontSize: 12,
    color: Colors.dark.tint,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ethBadge: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ethBadgeText: {
    fontSize: 14,
    color: Colors.dark.tint,
    fontWeight: '600',
  },
  usdValue: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
  gasCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  gasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gasLabel: {
    fontSize: 13,
    color: '#999',
  },
  gasValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  gasTotal: {
    fontSize: 15,
    color: Colors.dark.tint,
    fontWeight: '600',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C1C1C',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#3C2C2C',
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#FF4444',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.tint,
    borderRadius: 12,
    paddingVertical: 18,
    marginHorizontal: 20,
    marginTop: 32,
    gap: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#2C2C2E',
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1C2C1C',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2C3C2C',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
});

