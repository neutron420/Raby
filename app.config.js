import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    INFURA_API_KEY: process.env.INFURA_API_KEY,
  },
});
