// app/(tabs)/contacts.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { Contact, deleteContactById, getContacts, upsertContact } from '@/services/contact-service';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

const NETWORK_OPTIONS = ['sepolia', 'mainnet', 'other'];

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [networkId, setNetworkId] = useState<string>('sepolia');
  const [notes, setNotes] = useState('');
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const backendUrl =
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Constants.expoConfig?.extra as any)?.BACKEND_URL ||
    'http://localhost:4000';

  const loadDeviceId = useCallback(async () => {
    let stored = await SecureStore.getItemAsync('deviceId');
    if (!stored) {
      stored = `device_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await SecureStore.setItemAsync('deviceId', stored);
    }
    setDeviceId(stored);
    return stored;
  }, []);

  const loadContacts = useCallback(
    async (forceDeviceId?: string) => {
      const id = forceDeviceId || deviceId;
      if (!id) return;
      setIsLoading(true);
      try {
        const list = await getContacts(id);
        setContacts(list);
        // Only show alert if backend is configured but failed
        if (backendUrl && backendUrl !== 'http://localhost:4000' && list.length === 0 && __DEV__) {
          console.log('No contacts found or backend unavailable');
        }
      } catch (error) {
        // Silently handle - backend is optional
        if (__DEV__) {
          console.log('Failed to load contacts:', error);
        }
        setContacts([]);
      } finally {
        setIsLoading(false);
      }
    },
    [deviceId, backendUrl],
  );

  useEffect(() => {
    loadDeviceId().then((id) => loadContacts(id));
  }, [loadContacts, loadDeviceId]);

  const resetForm = () => {
    setName('');
    setAddress('');
    setNetworkId('sepolia');
    setNotes('');
  };

  const handleSave = async () => {
    if (!deviceId) return;
    if (!name.trim() || !address.trim()) {
      Alert.alert('Missing info', 'Name and address are required.');
      return;
    }
    setIsSaving(true);
    try {
      const contact = await upsertContact({
        deviceId,
        name: name.trim(),
        address: address.trim(),
        networkId: networkId === 'other' ? null : networkId,
        notes: notes.trim() || null,
      });
      if (contact) {
        setContacts((prev) => {
          const existingIndex = prev.findIndex((c) => c.id === contact.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = contact;
            return updated;
          }
          return [contact, ...prev];
        });
        setShowModal(false);
        resetForm();
      } else {
        // Only show error if backend is configured
        if (backendUrl && backendUrl !== 'http://localhost:4000') {
          Alert.alert('Error', 'Failed to save contact. Backend may be unavailable.');
        } else {
          Alert.alert('Backend Not Available', 'Contact saving requires backend. Please configure EXPO_PUBLIC_BACKEND_URL.');
        }
      }
    } catch (error) {
      console.error('Failed to save contact:', error);
      Alert.alert('Error', 'Failed to save contact.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Contact', 'Are you sure you want to delete this contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const ok = await deleteContactById(id);
            if (ok) {
              setContacts((prev) => prev.filter((c) => c.id !== id));
            } else {
              Alert.alert('Error', 'Failed to delete contact.');
            }
          } catch (error) {
            console.error('Failed to delete contact:', error);
            Alert.alert('Error', 'Failed to delete contact.');
          }
        },
      },
    ]);
  };

  const isBackendReachable = useMemo(() => !!backendUrl, [backendUrl]);

  return (
    <ThemedView style={styles.container}>
      <LinearGradient colors={['#0A0A0A', '#121212']} style={styles.headerGradient}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Contacts</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Manage saved addresses (synced to backend)
          </ThemedText>
        </View>
      </LinearGradient>

      {!isBackendReachable && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={16} color="#FFCC00" />
          <ThemedText style={styles.warningText}>
            Backend URL not configured. Set EXPO_PUBLIC_BACKEND_URL.
          </ThemedText>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.addButton, !isBackendReachable && styles.addButtonDisabled]}
            onPress={() => setShowModal(true)}
            disabled={!isBackendReachable}>
            <Ionicons name="add" size={20} color="#000" />
            <ThemedText style={styles.addButtonText}>Add Contact</ThemedText>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.tint} />
            <ThemedText style={styles.loadingText}>Loading contacts...</ThemedText>
          </View>
        ) : contacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={Colors.dark.icon} />
            <ThemedText style={styles.emptyText}>No contacts yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Add contacts to send crypto easily
            </ThemedText>
          </View>
        ) : (
          contacts.map((contact) => (
            <View key={contact.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardName}>{contact.name}</ThemedText>
                <View style={styles.tag}>
                  <ThemedText style={styles.tagText}>
                    {contact.networkId || 'any network'}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.cardAddress} numberOfLines={1}>
                {contact.address}
              </ThemedText>
              {contact.notes ? (
                <ThemedText style={styles.cardNotes}>{contact.notes}</ThemedText>
              ) : null}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.cardButton}
                  onPress={() => {
                    setName(contact.name);
                    setAddress(contact.address);
                    setNetworkId(contact.networkId || 'other');
                    setNotes(contact.notes || '');
                    setShowModal(true);
                  }}>
                  <Ionicons name="create-outline" size={16} color={Colors.dark.tint} />
                  <ThemedText style={styles.cardButtonText}>Edit</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cardButton, styles.cardDelete]}
                  onPress={() => handleDelete(contact.id)}>
                  <Ionicons name="trash-outline" size={16} color="#FF4444" />
                  <ThemedText style={[styles.cardButtonText, styles.cardDeleteText]}>
                    Delete
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Contact</ThemedText>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Name</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g., Alice"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Address</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="0x..."
                placeholderTextColor="#666"
                value={address}
                onChangeText={setAddress}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Network</ThemedText>
              <View style={styles.chipsRow}>
                {NETWORK_OPTIONS.map((net) => (
                  <TouchableOpacity
                    key={net}
                    style={[
                      styles.chip,
                      networkId === net && styles.chipActive,
                    ]}
                    onPress={() => setNetworkId(net)}>
                    <ThemedText
                      style={[
                        styles.chipText,
                        networkId === net && styles.chipTextActive,
                      ]}>
                      {net}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Notes (optional)</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add a note"
                placeholderTextColor="#666"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  resetForm();
                  setShowModal(false);
                }}
                disabled={isSaving}>
                <ThemedText style={styles.modalButtonTextSecondary}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSave}
                disabled={isSaving || !name.trim() || !address.trim()}>
                {isSaving ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <ThemedText style={styles.modalButtonTextPrimary}>Save</ThemedText>
                )}
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#2C1C1C',
    borderBottomWidth: 1,
    borderBottomColor: '#3A2A2A',
  },
  warningText: {
    color: '#FFCC00',
    marginLeft: 8,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.tint,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#000',
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySubtext: {
    color: '#888',
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    marginBottom: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tag: {
    backgroundColor: '#2C2C2E',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    color: '#AAA',
    fontSize: 12,
    fontWeight: '600',
  },
  cardAddress: {
    color: '#B0B0B0',
    fontFamily: 'monospace',
  },
  cardNotes: {
    color: '#888',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cardButtonText: {
    color: Colors.dark.tint,
    fontWeight: '600',
    fontSize: 13,
  },
  cardDelete: {
    backgroundColor: '#2C1C1C',
  },
  cardDeleteText: {
    color: '#FF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#ccc',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    backgroundColor: '#2C2C2E',
  },
  chipActive: {
    backgroundColor: Colors.dark.tint,
    borderColor: Colors.dark.tint,
  },
  chipText: {
    color: '#AAA',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#000',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
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
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
  modalButtonTextSecondary: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
