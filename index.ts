// shims.ts
import 'react-native-get-random-values';
import '@ethersproject/shims';

if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.getRandomValues !== 'function') {
  const getRandomValues = (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    console.warn('⚠️ Using insecure random fallback (for dev only)');
    return arr;
  };
  globalThis.crypto = { getRandomValues } as Crypto;
  console.log(' Fallback crypto.getRandomValues attached');
} else {
  console.log(' Secure crypto.getRandomValues is available');
}

try {
  const testArray = new Uint8Array(8);
  crypto.getRandomValues(testArray);
  console.log(' crypto.getRandomValues works, sample:', testArray);
} catch (err) {
  console.error(' crypto.getRandomValues test failed:', err);
}

console.log(' Ethers shims fully loaded');
