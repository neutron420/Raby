import Constants from 'expo-constants';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  (Constants.expoConfig?.extra as any)?.BACKEND_URL ||
  'http://localhost:4000';

export interface Contact {
  id: string;
  deviceId: string;
  name: string;
  address: string;
  networkId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

function getBaseUrl(): string | null {
  if (!BACKEND_URL || BACKEND_URL === 'http://localhost:4000') {
    return null; // Backend not available
  }
  return BACKEND_URL.replace(/\/$/, '');
}

export async function getContacts(deviceId: string): Promise<Contact[]> {
  if (!deviceId) return [];
  const base = getBaseUrl();
  if (!base) {
    // Backend not available - return empty array silently
    if (__DEV__) {
      console.log('Backend not available - contacts will be empty');
    }
    return [];
  }
  try {
    const res = await fetch(`${base}/api/contacts?deviceId=${encodeURIComponent(deviceId)}`, {
      timeout: 5000,
    } as any);
    if (!res.ok) {
      if (__DEV__) {
        console.log('Failed to fetch contacts from backend');
      }
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? (data as Contact[]) : [];
  } catch (error) {
    // Silently fail - backend is optional
    if (__DEV__) {
      console.log('Backend unavailable for contacts:', error);
    }
    return [];
  }
}

export async function upsertContact(input: {
  deviceId: string;
  name: string;
  address: string;
  networkId?: string | null;
  notes?: string | null;
}): Promise<Contact | null> {
  const base = getBaseUrl();
  if (!base) {
    // Backend not available - return null to indicate failure
    if (__DEV__) {
      console.log('Backend not available - cannot save contact');
    }
    return null;
  }
  try {
    const res = await fetch(`${base}/api/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      timeout: 5000,
    } as any);
    if (!res.ok) {
      if (__DEV__) {
        console.log('Failed to upsert contact');
      }
      return null;
    }
    return (await res.json()) as Contact;
  } catch (error) {
    if (__DEV__) {
      console.log('Backend unavailable for saving contact:', error);
    }
    return null;
  }
}

export async function deleteContactById(id: string): Promise<boolean> {
  if (!id) return false;
  const base = getBaseUrl();
  if (!base) {
    // Backend not available
    if (__DEV__) {
      console.log('Backend not available - cannot delete contact');
    }
    return false;
  }
  try {
    const res = await fetch(`${base}/api/contacts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      timeout: 5000,
    } as any);
    if (!res.ok && res.status !== 204) {
      if (__DEV__) {
        console.log('Failed to delete contact');
      }
      return false;
    }
    return true;
  } catch (error) {
    if (__DEV__) {
      console.log('Backend unavailable for deleting contact:', error);
    }
    return false;
  }
}
