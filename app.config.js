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
    eas: {
      projectId: "3c173e9d-7a07-4e9f-8dfe-9b9253c48e34",
    },
  },
});
