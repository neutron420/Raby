// app/(tabs)/settings.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useWallet } from '@/context/wallet-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';

const CURRENCY_OPTIONS = ['USD', 'EUR', 'INR'] as const;
const THEME_OPTIONS = ['system', 'light', 'dark'] as const;
const GAS_OPTIONS = ['slow', 'medium', 'fast'] as const;

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  rightComponent?: React.ReactNode;
  showChevron?: boolean;
  danger?: boolean;
}

const SettingItem = ({
  icon,
  title,
  subtitle,
  onPress,
  rightComponent,
  showChevron = true,
  danger = false,
}: SettingItemProps) => (
  <TouchableOpacity
    style={[styles.settingItem, danger && styles.settingItemDanger]}
    onPress={onPress}
    activeOpacity={0.7}>
    <View style={styles.settingItemLeft}>
      <View style={[styles.iconContainer, danger && styles.iconContainerDanger]}>
        <Ionicons
          name={icon as any}
          size={22}
          color={danger ? '#FF4444' : Colors.dark.tint}
        />
      </View>
      <View style={styles.settingItemText}>
        <ThemedText style={styles.settingItemTitle}>{title}</ThemedText>
        {subtitle && (
          <ThemedText style={styles.settingItemSubtitle}>{subtitle}</ThemedText>
        )}
      </View>
    </View>
    <View style={styles.settingItemRight}>
      {rightComponent}
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.dark.icon}
          style={styles.chevron}
        />
      )}
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { setWallet } = useWallet();
  const [pinIsSet, setPinIsSet] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [preferredCurrency, setPreferredCurrency] = useState<(typeof CURRENCY_OPTIONS)[number]>('USD');
  const [themePreference, setThemePreference] = useState<(typeof THEME_OPTIONS)[number]>('system');
  const [defaultGasLevel, setDefaultGasLevel] = useState<(typeof GAS_OPTIONS)[number]>('medium');

  const BACKEND_URL =
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    (Constants.expoConfig?.extra as any)?.BACKEND_URL ||
    'http://localhost:4000';

  useEffect(() => {
    const checkSettings = async () => {
      const [pinHash, bioPref, hasHardware, isEnrolled] = await Promise.all([
        SecureStore.getItemAsync('walletPinHash'),
        SecureStore.getItemAsync('biometricsEnabled'),
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

      setPinIsSet(!!pinHash);
      const localBiometrics = bioPref === 'true';
      setBiometricsEnabled(localBiometrics);
      setBiometricsAvailable(hasHardware && isEnrolled && !!pinHash);

      // Ensure we have a stable deviceId for backend preferences/contacts
      let storedDeviceId = await SecureStore.getItemAsync('deviceId');
      if (!storedDeviceId) {
        storedDeviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await SecureStore.setItemAsync('deviceId', storedDeviceId);
      }
      setDeviceId(storedDeviceId);

      // Sync biometrics preference with backend UserPreferences
      if (BACKEND_URL && storedDeviceId) {
        try {
          const res = await fetch(
            `${BACKEND_URL.replace(/\/$/, '')}/api/preferences/${encodeURIComponent(
              storedDeviceId,
            )}`,
          );
          if (res.ok) {
            const prefs = await res.json();
            if (typeof prefs.biometricsEnabled === 'boolean') {
              setBiometricsEnabled(prefs.biometricsEnabled);
              await SecureStore.setItemAsync(
                'biometricsEnabled',
                String(prefs.biometricsEnabled),
              );
            }
            if (prefs.preferredCurrency) {
              setPreferredCurrency(prefs.preferredCurrency);
            }
            if (prefs.themePreference) {
              setThemePreference(prefs.themePreference);
            }
            if (prefs.defaultGasLevel) {
              setDefaultGasLevel(prefs.defaultGasLevel);
            }
          }
        } catch (error) {
          console.error('Failed to load preferences from backend:', error);
        }
      }
    };
    checkSettings();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Lock Wallet?',
      'This will lock your wallet. You will need to unlock it with your PIN or biometrics to continue.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock',
          style: 'destructive',
          onPress: async () => {
            setWallet(null);
            router.replace('/unlock-wallet');
          },
        },
      ],
    );
  };

  const handleToggleBiometrics = async (value: boolean) => {
    if (value && !biometricsAvailable) {
      Alert.alert(
        'Biometrics Not Available',
        'Please set up biometrics on your device first.',
      );
      return;
    }

    await SecureStore.setItemAsync('biometricsEnabled', String(value));
    setBiometricsEnabled(value);

    // Persist preference to backend
    if (BACKEND_URL && deviceId) {
      try {
        await fetch(
          `${BACKEND_URL.replace(/\/$/, '')}/api/preferences/${encodeURIComponent(deviceId)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ biometricsEnabled: value }),
          },
        );
      } catch (error) {
        console.error('Failed to update preferences on backend:', error);
      }
    }
  };

  const savePreferences = async (data: Partial<{
    preferredCurrency: string;
    themePreference: string;
    defaultGasLevel: string;
  }>) => {
    if (!deviceId || !BACKEND_URL) return;
    try {
      await fetch(
        `${BACKEND_URL.replace(/\/$/, '')}/api/preferences/${encodeURIComponent(deviceId)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );
    } catch (error) {
      console.error('Failed to update preferences on backend:', error);
    }
  };

  const handleSelectCurrency = () => {
    Alert.alert(
      'Preferred Currency',
      'Select your preferred currency',
      CURRENCY_OPTIONS.map((option) => ({
        text: option,
        onPress: () => {
          setPreferredCurrency(option);
          savePreferences({ preferredCurrency: option });
        },
      })),
    );
  };

  const handleSelectTheme = () => {
    Alert.alert(
      'Theme Preference',
      'Select theme',
      THEME_OPTIONS.map((option) => ({
        text: option,
        onPress: () => {
          setThemePreference(option);
          savePreferences({ themePreference: option });
        },
      })),
    );
  };

  const handleSelectGas = () => {
    Alert.alert(
      'Default Gas Level',
      'Select default gas level',
      GAS_OPTIONS.map((option) => ({
        text: option,
        onPress: () => {
          setDefaultGasLevel(option);
          savePreferences({ defaultGasLevel: option });
        },
      })),
    );
  };

  const navigateToPinSetup = () => {
    router.push('/set-pin');
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#0A0A0A', '#121212']}
        style={styles.headerGradient}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Settings</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Manage your wallet preferences
          </ThemedText>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Security Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Security</ThemedText>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="lock-closed"
              title={pinIsSet ? 'Change PIN' : 'Set Up PIN'}
              subtitle={pinIsSet ? 'Update your 4-digit PIN' : 'Create a secure PIN'}
              onPress={navigateToPinSetup}
            />
            <SettingItem
              icon="finger-print"
              title="Biometric Authentication"
              subtitle={
                biometricsAvailable
                  ? biometricsEnabled
                    ? 'Enabled'
                    : 'Tap to enable'
                  : 'Not available on this device'
              }
              onPress={() => {}}
              showChevron={false}
              rightComponent={
                <Switch
                  value={biometricsEnabled && biometricsAvailable}
                  onValueChange={handleToggleBiometrics}
                  trackColor={{ false: '#3A3A3C', true: Colors.dark.tint }}
                  thumbColor={biometricsEnabled ? '#FFFFFF' : '#f4f3f4'}
                  disabled={!biometricsAvailable}
                />
              }
            />
          </View>
        </View>

        {/* Wallet Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Wallet</ThemedText>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="wallet"
              title="Export Wallet"
              subtitle="Backup your recovery phrase"
              onPress={async () => {
                // Verify with PIN or biometrics before showing recovery phrase
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                
                if (hasHardware && isEnrolled) {
                  const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Verify identity to view recovery phrase',
                    cancelLabel: 'Cancel',
                  });
                  
                  if (!result.success) {
                    return;
                  }
                }
                
                // Get recovery phrase
                const mnemonic = await SecureStore.getItemAsync('walletMnemonic_dev_unsafe');
                
                if (!mnemonic) {
                  Alert.alert(
                    'No Recovery Phrase',
                    'Recovery phrase not found. This wallet may have been imported with a private key only.',
                  );
                  return;
                }
                
                // Show recovery phrase with warning
                Alert.alert(
                  '⚠️ IMPORTANT: Your Recovery Phrase',
                  `\n${mnemonic}\n\n⚠️ NEVER share this phrase with anyone!\n⚠️ Anyone with this phrase can access your wallet!\n⚠️ Store it in a safe place offline.\n\nCopy to clipboard?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Copy',
                      onPress: async () => {
                        await Clipboard.setStringAsync(mnemonic);
                        Alert.alert('Copied', 'Recovery phrase copied to clipboard.');
                      },
                    },
                  ],
                );
              }}
            />
            <SettingItem
              icon="swap-horizontal"
              title="Network Settings"
              subtitle="Change blockchain network"
              onPress={() => {
                Alert.alert(
                  'Network Settings',
                  'This feature will be available soon.',
                );
              }}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="cash"
              title="Preferred Currency"
              subtitle="Choose display currency"
              onPress={handleSelectCurrency}
              rightComponent={
                <View style={styles.valuePill}>
                  <ThemedText style={styles.valuePillText}>{preferredCurrency}</ThemedText>
                </View>
              }
            />
            <SettingItem
              icon="color-palette"
              title="Theme"
              subtitle="Light / Dark / System"
              onPress={handleSelectTheme}
              rightComponent={
                <View style={styles.valuePill}>
                  <ThemedText style={styles.valuePillText}>{themePreference}</ThemedText>
                </View>
              }
            />
            <SettingItem
              icon="speedometer"
              title="Default Gas"
              subtitle="Slow / Medium / Fast"
              onPress={handleSelectGas}
              rightComponent={
                <View style={styles.valuePill}>
                  <ThemedText style={styles.valuePillText}>{defaultGasLevel}</ThemedText>
                </View>
              }
            />
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>App</ThemedText>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="notifications"
              title="Notifications"
              subtitle="Manage push notifications"
              onPress={() => {
                Alert.alert(
                  'Notifications',
                  'This feature will be available soon.',
                );
              }}
            />
            <SettingItem
              icon="language"
              title="Language"
              subtitle="English"
              onPress={() => {
                Alert.alert('Language', 'This feature will be available soon.');
              }}
            />
            <SettingItem
              icon="moon"
              title="Theme"
              subtitle="Dark"
              onPress={() => {
                Alert.alert('Theme', 'This feature will be available soon.');
              }}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>About</ThemedText>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="information-circle"
              title="App Version"
              subtitle="1.0.0"
              onPress={() => {}}
              showChevron={false}
            />
            <SettingItem
              icon="help-circle"
              title="Help & Support"
              subtitle="Get help and contact support"
              onPress={() => {
                Alert.alert(
                  'Help & Support',
                  'This feature will be available soon.',
                );
              }}
            />
            <SettingItem
              icon="shield-checkmark"
              title="Privacy Policy"
              subtitle="Read our privacy policy"
              onPress={() => {
                Alert.alert('Privacy Policy', 'This feature will be available soon.');
              }}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="lock-closed"
              title="Lock Wallet"
              subtitle="Requires PIN or biometrics to unlock"
              onPress={handleLogout}
              danger={false}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            Raby Wallet v1.0.0
          </ThemedText>
          <ThemedText style={styles.footerSubtext}>
            Secure cryptocurrency wallet
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  settingItemDanger: {
    borderBottomColor: '#2C2C2E',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerDanger: {
    backgroundColor: '#2C1C1C',
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingItemSubtitle: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: 8,
  },
  valuePill: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  valuePillText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#444',
  },
});
