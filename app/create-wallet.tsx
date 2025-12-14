
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useWallet } from '@/context/wallet-context';
import { initializeFirstAccount } from '@/services/account-service';
import { Ionicons } from '@expo/vector-icons';
import { ethers } from 'ethers';
import * as Clipboard from 'expo-clipboard';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import 'react-native-get-random-values';

type Stage = 'password' | 'generate' | 'verify' | 'done';

export default function CreateWalletScreen() {
  const router = useRouter();
  const { setWallet } = useWallet();
  const [stage, setStage] = useState<Stage>('password');

  // REMOVED THE TEST useEffect - it was causing the error!

  // State for all stages
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [enableBiometrics, setEnableBiometrics] = useState(false);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [originalWords, setOriginalWords] = useState<string[]>([]);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPhraseVisible, setIsPhraseVisible] = useState(false);

  // --- Mnemonic Generation Function ---
  const generateMnemonic = async () => {
    setIsGenerating(true);
    try {
      // Use expo-crypto to generate secure random bytes (16 bytes = 128 bits for 12-word mnemonic)
      const randomBytes = await Crypto.getRandomBytesAsync(16);
      // Convert to hex string and then to entropy
      const entropy = ethers.utils.hexlify(randomBytes);
      // Generate mnemonic from entropy
      const generatedMnemonic = ethers.utils.entropyToMnemonic(entropy);
      
      if (!generatedMnemonic) throw new Error('Mnemonic generation failed');
      const words = generatedMnemonic.split(' ');
      setMnemonic(generatedMnemonic);
      setOriginalWords(words);
      setShuffledWords([...words].sort(() => Math.random() - 0.5));
      setIsGenerating(false);
      setStage('generate');
    } catch (error) {
      console.error('Error generating mnemonic:', error);
      Alert.alert('Error', 'Could not generate recovery phrase.', [
        { text: 'OK', onPress: () => setStage('password') },
      ]);
      setIsGenerating(false);
    }
  };

  // --- Stage Progression Handlers ---
  const handlePasswordConfirm = async () => {
    if (password.length < 8) {
      Alert.alert('Password Too Short', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords Don't Match", 'Please re-enter your password confirmation.');
      return;
    }
    await generateMnemonic();
  };

  const handlePhraseAcknowledged = () => {
    setStage('verify');
    setSelectedWords([]);
    setShuffledWords([...originalWords].sort(() => Math.random() - 0.5));
  };

  const handleVerifyPhraseAndSave = async () => {
    if (selectedWords.join(' ') === mnemonic) {
      setIsSaving(true);
      try {
        await SecureStore.setItemAsync('walletMnemonic_dev_unsafe', mnemonic || '');
        await SecureStore.setItemAsync(
          'biometricsEnabled',
          JSON.stringify(enableBiometrics),
        );
        await SecureStore.setItemAsync('walletExists', 'true');
        
        const newWallet = ethers.Wallet.fromMnemonic(mnemonic || '');
        
        // Initialize first account
        await initializeFirstAccount(newWallet, 'Account 1');
        
        setWallet(newWallet);

        Alert.alert(
          'Wallet Created',
          'Your wallet has been set up successfully.',
        );
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Error saving wallet:', error);
        Alert.alert('Storage Error', 'Could not save wallet securely.');
        setIsSaving(false);
      }
    } else {
      Alert.alert('Incorrect Order', 'Please try verifying again.');
      setSelectedWords([]);
      setShuffledWords([...originalWords].sort(() => Math.random() - 0.5));
    }
  };

  // --- Helper Functions ---
  const handleCopyToClipboard = async () => {
    if (mnemonic) {
      await Clipboard.setStringAsync(mnemonic);
      Alert.alert('Copied', 'Recovery phrase copied.');
    }
  };
  
  const togglePhraseVisibility = () => {
    setIsPhraseVisible(!isPhraseVisible);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleSelectWord = (word: string, index: number) => {
    setSelectedWords([...selectedWords, word]);
    setShuffledWords(shuffledWords.filter((_, i) => i !== index));
  };
  
  const handleRemoveWord = (index: number) => {
    const wordToRemove = selectedWords[index];
    setSelectedWords(selectedWords.filter((_, i) => i !== index));
    setShuffledWords([...shuffledWords, wordToRemove].sort(() => Math.random() - 0.5));
  };

  // --- Render Functions ---
  const renderPasswordStage = () => (
    <View style={styles.content}>
      <ThemedText style={styles.instructionTitle}>Create App Password</ThemedText>
      <ThemedText style={styles.instructionText}>
        Secure your wallet on this device. You&apos;ll need this password to
        unlock the app.
      </ThemedText>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="New Password (min. 8 characters)"
          placeholderTextColor="#888"
          secureTextEntry={!isPasswordVisible}
          value={password}
          onChangeText={setPassword}
          editable={!isGenerating}
          selectionColor={Colors.dark.tint}
        />
        <TouchableOpacity
          style={styles.inputEyeButton}
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
          <Ionicons
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={24}
            color={Colors.dark.icon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          secureTextEntry={!isConfirmPasswordVisible}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isGenerating}
          selectionColor={Colors.dark.tint}
        />
        <TouchableOpacity
          style={styles.inputEyeButton}
          onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
          <Ionicons
            name={isConfirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={24}
            color={Colors.dark.icon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.biometricsContainer}>
        <ThemedText style={styles.biometricsText}>
          Enable Fingerprint/Face Unlock
        </ThemedText>
        <Switch
          trackColor={{ false: '#3e3e3e', true: Colors.dark.tint }}
          thumbColor={enableBiometrics ? '#000000' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={setEnableBiometrics}
          value={enableBiometrics}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          styles.primaryButton,
          (isGenerating ||
            !password ||
            password !== confirmPassword ||
            password.length < 8) &&
            styles.buttonDisabled,
        ]}
        onPress={handlePasswordConfirm}
        disabled={
          isGenerating ||
          !password ||
          password !== confirmPassword ||
          password.length < 8
        }
        activeOpacity={0.8}>
        {isGenerating ? (
          <ActivityIndicator color="#000000" size="small" />
        ) : (
          <ThemedText style={[styles.buttonText, styles.primaryButtonText]}>
            Continue
          </ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderGenerateStage = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedText style={styles.instructionTitle}>Your Recovery Phrase</ThemedText>
      <View style={styles.warningBox}>
        <Ionicons name="warning-outline" size={20} color="#FFA500" />
        <ThemedText style={styles.warningText}>
          **Important:** Write these 12 words down in order and store them
          securely offline. This is the ONLY way to recover your funds. Do not
          share them.
        </ThemedText>
      </View>
      <View style={styles.phraseContainer}>
        {originalWords.map((word, index) => (
          <View key={index} style={styles.wordBox}>
            <ThemedText style={styles.wordIndex}>{index + 1}.</ThemedText>
            <ThemedText style={styles.wordText}>
              {isPhraseVisible ? word : '••••'}
            </ThemedText>
          </View>
        ))}
        <TouchableOpacity
          onPress={togglePhraseVisibility}
          style={styles.eyeButton}>
          <Ionicons
            name={isPhraseVisible ? 'eye-off-outline' : 'eye-outline'}
            size={24}
            color={Colors.dark.icon}
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleCopyToClipboard}>
        <Ionicons name="copy-outline" size={20} color={Colors.dark.tint} />
        <ThemedText style={styles.buttonText}>Copy Phrase</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handlePhraseAcknowledged}>
        <ThemedText style={[styles.buttonText, styles.primaryButtonText]}>
          Continue to Verification
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderVerifyStage = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedText style={styles.instructionTitle}>Verify Recovery Phrase</ThemedText>
      <ThemedText style={styles.instructionText}>
        Tap the words below in the correct order ({selectedWords.length + 1}/
        {originalWords.length}) to confirm your backup.
      </ThemedText>
      <View style={styles.selectedWordsContainer}>
        {selectedWords.map((word, index) => (
          <TouchableOpacity
            key={`${word}-${index}`}
            onPress={() => handleRemoveWord(index)}
            style={styles.selectedWordChip}>
            <ThemedText style={styles.chipText}>
              {index + 1}. {word}
            </ThemedText>
          </TouchableOpacity>
        ))}
        {selectedWords.length === 0 && (
          <ThemedText style={styles.placeholderText}>Tap words below...</ThemedText>
        )}
      </View>
      <View style={styles.shuffledWordsContainer}>
        {shuffledWords.map((word, index) => (
          <TouchableOpacity
            key={`${word}-${index}`}
            style={styles.wordChip}
            onPress={() => handleSelectWord(word, index)}>
            <ThemedText style={styles.chipText}>{word}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>
      {selectedWords.length === originalWords.length && (
        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            isSaving && styles.buttonDisabled,
          ]}
          onPress={handleVerifyPhraseAndSave}
          disabled={isSaving}
          activeOpacity={0.8}>
          {isSaving ? (
            <ActivityIndicator color="#000000" size="small" />
          ) : (
            <ThemedText style={[styles.buttonText, styles.primaryButtonText]}>
              Confirm & Create Wallet
            </ThemedText>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  return (
    <ThemedView style={styles.container}>
      {stage !== 'password' && (
        <TouchableOpacity
          onPress={() => {
            if (stage === 'generate') {
              setStage('password');
              setIsPhraseVisible(false);
            }
            if (stage === 'verify') setStage('generate');
          }}
          style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.tint} />
        </TouchableOpacity>
      )}

      {stage === 'password' && renderPasswordStage()}
      {stage === 'generate' && renderGenerateStage()}
      {stage === 'verify' && renderVerifyStage()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', paddingTop: 60 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 15,
    zIndex: 10,
    padding: 10,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  instructionText: {
    fontSize: 16,
    color: Colors.dark.icon,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 15,
    marginBottom: 25,
    width: '100%',
  },
  warningText: {
    flex: 1,
    fontSize: 15,
    color: '#FFA500',
    marginLeft: 10,
    lineHeight: 21,
  },
  phraseContainer: {
    position: 'relative',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 15,
    paddingBottom: 50,
    marginBottom: 30,
    width: '100%',
  },
  wordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 6,
    marginHorizontal: '1%',
    width: '48%',
  },
  wordIndex: {
    color: Colors.dark.icon,
    marginRight: 8,
    fontSize: 14,
    width: 20,
    textAlign: 'right',
  },
  wordText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '500',
  },
  eyeButton: {
    position: 'absolute',
    bottom: 10,
    right: 15,
    padding: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    width: '90%',
    maxWidth: 400,
    marginTop: 20,
    minHeight: 50,
  },
  buttonText: {
    color: Colors.dark.tint,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  primaryButton: {
    backgroundColor: Colors.dark.tint,
  },
  primaryButtonText: {
    color: '#000000',
    marginLeft: 0,
  },
  buttonDisabled: {
    backgroundColor: '#555',
    opacity: 0.7,
  },
  selectedWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150,
    width: '100%',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  selectedWordChip: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 5,
    flexDirection: 'row',
  },
  shuffledWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 30,
  },
  wordChip: {
    backgroundColor: '#3A3A3C',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 6,
  },
  chipText: {
    color: Colors.dark.text,
  },
  placeholderText: {
    color: Colors.dark.icon,
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    height: 50,
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: Colors.dark.text,
  },
  inputEyeButton: {
    paddingLeft: 10,
  },
  biometricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    paddingVertical: 10,
    marginBottom: 20,
  },
  biometricsText: {
    fontSize: 16,
    color: Colors.dark.text,
  },
});