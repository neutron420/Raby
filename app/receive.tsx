// app/receive.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useWallet } from '@/context/wallet-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    ScrollView,
    Share,
    StyleSheet,
    TouchableOpacity,
    View,
    Modal,
    Pressable,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');
const QR_SIZE = width * 0.6;

export default function ReceiveScreen() {
  const router = useRouter();
  const { address } = useWallet();
  const [copied, setCopied] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  if (!address) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>No wallet address available</ThemedText>
      </ThemedView>
    );
  }

  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(address);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareAddress = async () => {
    try {
      await Share.share({
        message: `My Raby Wallet Address:\n${address}`,
        title: 'Wallet Address',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

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
          <ThemedText style={styles.headerTitle}>Receive</ThemedText>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* QR Code Card */}
        <View style={styles.qrCard}>
          <ThemedText style={styles.qrTitle}>Scan to Send</ThemedText>
          <ThemedText style={styles.qrSubtitle}>
            Share this QR code to receive payments
          </ThemedText>

          <TouchableOpacity
            style={styles.qrContainer}
            onPress={() => setQrModalVisible(true)}
            activeOpacity={0.8}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={address}
                size={QR_SIZE}
                color="#FFFFFF"
                backgroundColor="#000000"
              />
            </View>
            <View style={styles.qrHint}>
              <Ionicons name="expand-outline" size={18} color={Colors.dark.tint} />
              <ThemedText style={styles.qrHintText}>Tap to enlarge</ThemedText>
            </View>
          </TouchableOpacity>

          <View style={styles.addressContainer}>
            <ThemedText style={styles.addressLabel}>Your Address</ThemedText>
            <View style={styles.addressBox}>
              <ThemedText style={styles.addressText} numberOfLines={1}>
                {address}
              </ThemedText>
            </View>
            <ThemedText style={styles.addressShort}>{formatAddress(address)}</ThemedText>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleCopyAddress}
            activeOpacity={0.8}>
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy'}
              size={22}
              color={copied ? '#00FF88' : '#000'}
            />
            <ThemedText
              style={[
                styles.actionButtonText,
                styles.primaryButtonText,
                copied && styles.copiedText,
              ]}>
              {copied ? 'Copied!' : 'Copy Address'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleShareAddress}
            activeOpacity={0.8}>
            <Ionicons name="share" size={22} color={Colors.dark.tint} />
            <ThemedText style={[styles.actionButtonText, styles.secondaryButtonText]}>
              Share Address
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={Colors.dark.tint} />
          <View style={styles.infoTextContainer}>
            <ThemedText style={styles.infoTitle}>Receiving Funds</ThemedText>
            <ThemedText style={styles.infoText}>
              Send only ETH and ERC-20 tokens to this address. Sending other
              cryptocurrencies may result in permanent loss.
            </ThemedText>
          </View>
        </View>

        {/* Network Info */}
        <View style={styles.networkCard}>
          <View style={styles.networkRow}>
            <ThemedText style={styles.networkLabel}>Network</ThemedText>
            <ThemedText style={styles.networkValue}>Sepolia Testnet</ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={qrModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setQrModalVisible(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setQrModalVisible(false)}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.modalQrContainer}>
              <QRCode
                value={address}
                size={Dimensions.get('window').width * 0.8}
                color="#FFFFFF"
                backgroundColor="#000000"
              />
            </View>
            <ThemedText style={styles.modalAddressText} numberOfLines={1}>
              {address}
            </ThemedText>
            <TouchableOpacity
              style={styles.modalCopyButton}
              onPress={async () => {
                await handleCopyAddress();
                setQrModalVisible(false);
              }}>
              <Ionicons name="copy" size={20} color="#000" />
              <ThemedText style={styles.modalCopyButtonText}>Copy Address</ThemedText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
  qrCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  qrTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    position: 'relative',
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  qrHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  qrHintText: {
    color: Colors.dark.tint,
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 16,
  },
  modalQrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  modalAddressText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  modalCopyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  addressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
    fontWeight: '500',
  },
  addressBox: {
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  addressShort: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: Colors.dark.tint,
  },
  secondaryButton: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#000000',
  },
  secondaryButtonText: {
    color: Colors.dark.tint,
  },
  copiedText: {
    color: '#00FF88',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1C2C1C',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#2C3C2C',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00FF88',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  networkCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  networkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networkLabel: {
    fontSize: 14,
    color: '#999',
  },
  networkValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

