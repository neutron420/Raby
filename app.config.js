import 'dotenv/config';

export default ({ config }) => ({
  ...config,

  plugins: [
    ...(config.plugins ?? []),
    "expo-barcode-scanner",
  ],

  android: {
    ...config.android,
    package: "com.ritesh004.raby",
  },

  extra: {
    ...config.extra,
    INFURA_API_KEY: process.env.INFURA_API_KEY,
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
    BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL,
    eas: {
      projectId: "3c173e9d-7a07-4e9f-8dfe-9b9253c48e34",
    },
  },
});
