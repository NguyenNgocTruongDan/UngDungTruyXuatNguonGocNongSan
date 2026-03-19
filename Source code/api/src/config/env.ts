import { config } from 'dotenv';
config();

const env = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_URI: process.env.DB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  JWT_LIFETIME: process.env.JWT_LIFETIME || '1d',
  BLOCKCHAIN_RPC_URL: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
  BLOCKCHAIN_PRIVATE_KEY: process.env.BLOCKCHAIN_PRIVATE_KEY || '',
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};

export default env;
