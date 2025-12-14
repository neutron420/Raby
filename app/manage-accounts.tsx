// app/manage-accounts.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useWallet } from '@/context/wallet-context';
import {
    createAccountFromMnemonic,
    deleteAccount,
    getAllAccounts,
    getNextDerivationIndex,
    updateAccountName,
    type Account,
} from '@/services/account-service';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ManageAccountsScreen() {
  const router = useRouter();
  const { accounts, activeAccount, switchAccount, fetchAccounts } = useWallet();
  const [localAccounts, setLocalAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadAccounts();
  }, [accounts]);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const allAccounts = await getAllAccounts();
      setLocalAccounts(allAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get mnemonic
      const mnemonic = await SecureStore.getItemAsync('walletMnemonic_dev_unsafe');
      if (!mnemonic) {
        Alert.alert('Error', 'Mnemonic not found. Cannot create new account.');
        return;
      }

      // Get next derivation index
      const nextIndex = await getNextDerivationIndex();
      
      // Create account
      const newAccount = await createAccountFromMnemonic(
        mnemonic,
        newAccountName.trim(),
        nextIndex
      );

      Alert.alert('Success', `Account "${newAccount.name}" created successfully!`);
      setShowCreateModal(false);
      setNewAccountName('');
      await fetchAccounts();
      await loadAccounts();
    } catch (error: any) {
      console.error('Error creating account:', error);
      Alert.alert('Error', error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchAccount = async (account: Account) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await switchAccount(account.id);
      Alert.alert('Switched', `Switched to ${account.name}`);
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to switch account');
    }
  };

  const handleDeleteAccount = (account: Account) => {
    if (accounts.length <= 1) {
      Alert.alert('Error', 'Cannot delete the last account');
      return;
    }

    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${account.name}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(account.id);
              await fetchAccounts();
              await loadAccounts();
              Alert.alert('Deleted', 'Account deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const handleEditName = (account: Account) => {
    setEditingAccount(account);
    setEditName(account.name);
  };

  const handleSaveEdit = async () => {
    if (!editingAccount || !editName.trim()) {
      Alert.alert('Error', 'Please enter a valid name');
      return;
    }

    try {
      await updateAccountName(editingAccount.id, editName.trim());
      await fetchAccounts();
      await loadAccounts();
      setEditingAccount(null);
      setEditName('');
      Alert.alert('Success', 'Account name updated');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update name');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
          <ThemedText style={styles.headerTitle}>Manage Accounts</ThemedText>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.addButton}>
            <Ionicons name="add" size={24} color={Colors.dark.tint} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {isLoading && localAccounts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.tint} />
          </View>
        ) : localAccounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color={Colors.dark.icon} />
            <ThemedText style={styles.emptyText}>No accounts found</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Create your first account to get started
            </ThemedText>
          </View>
        ) : (
          <>
            <ThemedText style={styles.sectionTitle}>Your Accounts</ThemedText>
            {localAccounts.map((account) => (
              <View key={account.id} style={styles.accountCard}>
                <View style={styles.accountHeader}>
                  <View style={styles.accountInfo}>
                    <View style={styles.accountIcon}>
                      <Ionicons
                        name="person-circle"
                        size={32}
                        color={account.id === activeAccount?.id ? Colors.dark.tint : Colors.dark.icon}
                      />
                    </View>
                    <View style={styles.accountDetails}>
                      <View style={styles.accountNameRow}>
                        <ThemedText style={styles.accountName}>
                          {account.name}
                        </ThemedText>
                        {account.id === activeAccount?.id && (
                          <View style={styles.activeBadge}>
                            <ThemedText style={styles.activeBadgeText}>Active</ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText style={styles.accountAddress}>
                        {formatAddress(account.address)}
                      </ThemedText>
                      {account.derivationIndex >= 0 && (
                        <ThemedText style={styles.accountPath}>
                          Index: {account.derivationIndex}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.accountActions}>
                  {account.id !== activeAccount?.id && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSwitchAccount(account)}>
                      <Ionicons name="swap-horizontal" size={18} color={Colors.dark.tint} />
                      <ThemedText style={styles.actionButtonText}>Switch</ThemedText>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditName(account)}>
                    <Ionicons name="pencil" size={18} color={Colors.dark.icon} />
                    <ThemedText style={styles.actionButtonText}>Rename</ThemedText>
                  </TouchableOpacity>
                  {accounts.length > 1 && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteAccount(account)}>
                      <Ionicons name="trash-outline" size={18} color="#FF4444" />
                      <ThemedText style={[styles.actionButtonText, styles.deleteButtonText]}>
                        Delete
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Create Account Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Create New Account</ThemedText>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <ThemedText style={styles.modalDescription}>
              Create a new account from your existing wallet. All accounts share the same recovery phrase.
            </ThemedText>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Account Name</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g., Account 2, Savings, Trading"
                placeholderTextColor="#666"
                value={newAccountName}
                onChangeText={setNewAccountName}
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowCreateModal(false)}>
                <ThemedText style={styles.modalButtonTextSecondary}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCreateAccount}
                disabled={isLoading || !newAccountName.trim()}>
                {isLoading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <ThemedText style={styles.modalButtonTextPrimary}>Create</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Name Modal */}
      <Modal
        visible={!!editingAccount}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingAccount(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Rename Account</ThemedText>
              <TouchableOpacity
                onPress={() => setEditingAccount(null)}
                style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Account Name</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Enter new name"
                placeholderTextColor="#666"
                value={editName}
                onChangeText={setEditName}
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setEditingAccount(null)}>
                <ThemedText style={styles.modalButtonTextSecondary}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveEdit}
                disabled={!editName.trim()}>
                <ThemedText style={styles.modalButtonTextPrimary}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  accountCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  accountHeader: {
    marginBottom: 12,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    marginRight: 12,
  },
  accountDetails: {
    flex: 1,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  activeBadge: {
    backgroundColor: Colors.dark.tint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  accountAddress: {
    fontSize: 13,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  accountPath: {
    fontSize: 11,
    color: '#666',
  },
  accountActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#2C1C1C',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.tint,
  },
  deleteButtonText: {
    color: '#FF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: Colors.dark.tint,
  },
  modalButtonSecondary: {
    backgroundColor: '#2C2C2E',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
