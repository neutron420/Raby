// services/crypto-price-service.ts
// Service to fetch cryptocurrency prices from CoinGecko API

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  market_cap?: number;
}

export interface PriceHistoryPoint {
  timestamp: number;
  price: number;
}

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// Rate limiting: Track last request time to avoid hitting rate limits
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000; // Minimum 3 seconds between requests (CoinGecko free tier is very strict)

// Helper function to delay requests to respect rate limits
async function rateLimitDelay() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
}

// Retry logic with exponential backoff
async function fetchWithRetry(
  url: string,
  retries: number = 3,
  delay: number = 2000
): Promise<Response> {
  await rateLimitDelay();
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      
      if (response.status === 429) {
        // Rate limited - wait longer before retry
        const waitTime = delay * Math.pow(2, i) + Math.random() * 1000;
        console.log(`Rate limited (429). Waiting ${Math.round(waitTime)}ms before retry ${i + 1}/${retries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (!response.ok && response.status !== 429) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      const waitTime = delay * Math.pow(2, i);
      console.log(`Request failed. Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * Fetch current price for a specific cryptocurrency
 */
export async function fetchCryptoPrice(
  coinId: string,
): Promise<CryptoPrice | null> {
  try {
    // Use markets endpoint for single coin - more efficient and includes all data
    const response = await fetchWithRetry(
      `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${coinId}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`,
    );
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0 || !data[0]) {
      return null;
    }

    const coin = data[0];
    return {
      id: coin.id || coinId,
      symbol: (coin.symbol || coinId).toUpperCase(),
      name: coin.name || coinId,
      current_price: coin.current_price || 0,
      price_change_percentage_24h: coin.price_change_percentage_24h || 0,
      image: coin.image || '',
      market_cap: coin.market_cap || 0,
    };
  } catch (error) {
    console.error(`Error fetching price for ${coinId}:`, error);
    return null;
  }
}

/**
 * Fetch prices for multiple cryptocurrencies
 * Uses the markets endpoint which is more efficient (one call instead of many)
 */
export async function fetchMultipleCryptoPrices(
  coinIds: string[],
): Promise<Record<string, CryptoPrice>> {
  try {
    // Use the markets endpoint which gives us all data in one call
    // This is much more efficient than making individual detail calls
    const ids = coinIds.join(',');
    const response = await fetchWithRetry(
      `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`,
    );
    const data = await response.json();

    if (!Array.isArray(data)) {
      console.warn('Invalid response format from markets endpoint');
      return {};
    }

    const prices: Record<string, CryptoPrice> = {};

    // Map the response to our CryptoPrice format
    data.forEach((coin: any) => {
      if (coin && coin.id) {
        prices[coin.id] = {
          id: coin.id,
          symbol: (coin.symbol || coin.id).toUpperCase(),
          name: coin.name || coin.id,
          current_price: coin.current_price || 0,
          price_change_percentage_24h: coin.price_change_percentage_24h || 0,
          image: coin.image || '',
          market_cap: coin.market_cap || 0,
        };
      }
    });

    return prices;

    return prices;
  } catch (error) {
    console.error('Error fetching multiple crypto prices:', error);
    return {};
  }
}

/**
 * Fetch price history for a cryptocurrency (for charts)
 * @param coinId - CoinGecko coin ID (e.g., 'ethereum', 'bitcoin')
 * @param days - Number of days of history (1, 7, 30, 90, 365, max)
 */
export async function fetchPriceHistory(
  coinId: string,
  days: number = 7,
): Promise<PriceHistoryPoint[]> {
  try {
    const url = `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${days <= 1 ? 'hourly' : 'daily'}`;
    console.log(`Fetching price history from: ${url}`);
    
    const response = await fetchWithRetry(url);
    
    const data = await response.json();
    console.log(`Price history response for ${coinId}:`, {
      hasPrices: !!data.prices,
      pricesLength: data.prices?.length || 0,
      firstPrice: data.prices?.[0],
    });

    if (!data.prices || !Array.isArray(data.prices)) {
      console.warn('Invalid price history data format');
      return [];
    }

    const pricePoints = data.prices
      .map((point: [number, number]) => ({
        timestamp: point[0],
        price: point[1],
      }))
      .filter((point: PriceHistoryPoint) => point.price > 0);

    console.log(`Processed ${pricePoints.length} valid price points`);
    return pricePoints;
  } catch (error: any) {
    console.error(`Error fetching price history for ${coinId}:`, error);
    
    // If rate limited, return empty array but log helpful message
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      console.warn('CoinGecko API rate limit reached. Please wait a moment and try again.');
    }
    
    return [];
  }
}

/**
 * Get CoinGecko ID for common cryptocurrencies
 */
export function getCoinGeckoId(symbol: string): string {
  const symbolMap: Record<string, string> = {
    ETH: 'ethereum',
    BTC: 'bitcoin',
    USDT: 'tether',
    USDC: 'usd-coin',
    BNB: 'binancecoin',
    SOL: 'solana',
    XRP: 'ripple',
    ADA: 'cardano',
    DOGE: 'dogecoin',
    MATIC: 'matic-network',
    DOT: 'polkadot',
    AVAX: 'avalanche-2',
    LTC: 'litecoin',
    UNI: 'uniswap',
    LINK: 'chainlink',
    ATOM: 'cosmos',
    ALGO: 'algorand',
    FIL: 'filecoin',
    TRX: 'tron',
    ETC: 'ethereum-classic',
  };

  return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
}

