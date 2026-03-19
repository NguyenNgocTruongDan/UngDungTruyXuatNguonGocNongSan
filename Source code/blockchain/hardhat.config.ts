import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || "";
const AMOY_RPC = process.env.AMOY_RPC_URL || "";
const ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY || "";
const POLYGONSCAN_KEY = process.env.POLYGONSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Local development
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Ethereum testnet
    sepolia: {
      url: SEPOLIA_RPC,
      accounts: SEPOLIA_RPC ? [PRIVATE_KEY] : [],
    },
    // Polygon testnet
    amoy: {
      url: AMOY_RPC,
      accounts: AMOY_RPC ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_KEY,
      polygonAmoy: POLYGONSCAN_KEY,
    },
  },
};

export default config;
