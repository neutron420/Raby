import * as dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express';
import prisma from './prisma';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// --- Transactions ---
// Get cached transactions for an account
app.get('/api/transactions', async (req: express.Request, res: express.Response) => {
  try {
    const { address, networkId = 'sepolia', limit = '50' } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'address is required' });
    }

    const txs = await prisma.transactionCache.findMany({
      where: {
        accountAddress: address,
        networkId: String(networkId),
      },
      orderBy: { timestamp: 'desc' },
      take: Number(limit) || 50,
    });

    res.json(txs);
  } catch (err) {
    console.error('GET /api/transactions error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cache (upsert) a transaction
app.post('/api/transactions', async (req: express.Request, res: express.Response) => {
  try {
    const data = req.body;

    if (!data?.txHash || !data?.networkId || !data?.accountAddress) {
      return res.status(400).json({ error: 'txHash, networkId, accountAddress are required' });
    }

    const tx = await prisma.transactionCache.upsert({
      where: {
        txHash_networkId_accountAddress: {
          txHash: data.txHash,
          networkId: data.networkId,
          accountAddress: data.accountAddress,
        },
      },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        ...data,
      },
    });

    res.status(201).json(tx);
  } catch (err) {
    console.error('POST /api/transactions error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Token balances ---
// Get cached token balances for an account
app.get('/api/tokens', async (req: express.Request, res: express.Response) => {
  try {
    const { address, networkId = 'sepolia' } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'address is required' });
    }

    const tokens = await prisma.tokenBalanceCache.findMany({
      where: {
        accountAddress: address,
        networkId: String(networkId),
      },
      orderBy: { lastUpdated: 'desc' },
    });

    res.json(tokens);
  } catch (err) {
    console.error('GET /api/tokens error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cache (upsert) a token balance
app.post('/api/tokens', async (req: express.Request, res: express.Response) => {
  try {
    const data = req.body;

    if (!data?.accountAddress || !data?.networkId || !data?.contractAddress) {
      return res
        .status(400)
        .json({ error: 'accountAddress, networkId, contractAddress are required' });
    }

    const token = await prisma.tokenBalanceCache.upsert({
      where: {
        accountAddress_networkId_contractAddress: {
          accountAddress: data.accountAddress,
          networkId: data.networkId,
          contractAddress: data.contractAddress,
        },
      },
      update: {
        ...data,
        lastUpdated: new Date(),
      },
      create: {
        ...data,
      },
    });

    res.status(201).json(token);
  } catch (err) {
    console.error('POST /api/tokens error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- User preferences ---
// Get or create preferences for a device
app.get('/api/preferences/:deviceId', async (req: express.Request, res: express.Response) => {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    const prefs = await prisma.userPreferences.upsert({
      where: { deviceId },
      update: {},
      create: {
        deviceId,
      },
    });

    res.json(prefs);
  } catch (err) {
    console.error('GET /api/preferences/:deviceId error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update preferences for a device
app.put('/api/preferences/:deviceId', async (req: express.Request, res: express.Response) => {
  try {
    const { deviceId } = req.params;
    const data = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    const prefs = await prisma.userPreferences.update({
      where: { deviceId },
      data,
    });

    res.json(prefs);
  } catch (err) {
    console.error('PUT /api/preferences/:deviceId error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Contacts ---
// Get all contacts for a device
app.get('/api/contacts', async (req: express.Request, res: express.Response) => {
  try {
    const { deviceId } = req.query;

    if (!deviceId || typeof deviceId !== 'string') {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    const contacts = await prisma.contact.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(contacts);
  } catch (err) {
    console.error('GET /api/contacts error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update a contact (by deviceId + address + networkId)
app.post('/api/contacts', async (req: express.Request, res: express.Response) => {
  try {
    const data = req.body;

    if (!data?.deviceId || !data?.address || !data?.name) {
      return res.status(400).json({ error: 'deviceId, address, name are required' });
    }

    const contact = await prisma.contact.upsert({
      where: {
        deviceId_address_networkId: {
          deviceId: data.deviceId,
          address: data.address,
          networkId: data.networkId ?? null,
        },
      },
      update: data,
      create: data,
    });

    res.status(201).json(contact);
  } catch (err) {
    console.error('POST /api/contacts error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a contact by id
app.delete('/api/contacts/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    await prisma.contact.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/contacts/:id error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
