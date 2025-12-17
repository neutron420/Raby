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

function getBaseUrl(): string {
  if (!BACKEND_URL) {
    throw new Error('BACKEND_URL is not configured');
  }
  return BACKEND_URL.replace(/\/$/, '');
}

export async function getContacts(deviceId: string): Promise<Contact[]> {
  if (!deviceId) return [];
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/contacts?deviceId=${encodeURIComponent(deviceId)}`);
  if (!res.ok) {
    console.error('Failed to fetch contacts:', await res.text());
    return [];
  }
  const data = await res.json();
  return Array.isArray(data) ? (data as Contact[]) : [];
}

export async function upsertContact(input: {
  deviceId: string;
  name: string;
  address: string;
  networkId?: string | null;
  notes?: string | null;
}): Promise<Contact | null> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    console.error('Failed to upsert contact:', await res.text());
    return null;
  }
  return (await res.json()) as Contact;
}

export async function deleteContactById(id: string): Promise<boolean> {
  if (!id) return false;
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/contacts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    console.error('Failed to delete contact:', await res.text());
    return false;
  }
  return true;
}
