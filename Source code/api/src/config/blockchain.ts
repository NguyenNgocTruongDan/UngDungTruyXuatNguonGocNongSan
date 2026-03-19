import { ethers } from 'ethers';
import env from './env';
import traceabilityABI from '../../abi/Traceability.json';

let provider: ethers.JsonRpcProvider;
let signer: ethers.Wallet;
let contract: ethers.Contract;

const getProvider = (): ethers.JsonRpcProvider => {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(env.BLOCKCHAIN_RPC_URL);
  }
  return provider;
};

const getSigner = (): ethers.Wallet => {
  if (!signer) {
    signer = new ethers.Wallet(env.BLOCKCHAIN_PRIVATE_KEY, getProvider());
  }
  return signer;
};

const getContract = (): ethers.Contract => {
  if (!contract) {
    contract = new ethers.Contract(
      env.CONTRACT_ADDRESS,
      traceabilityABI,
      getSigner()
    );
  }
  return contract;
};

const getReadonlyContract = (): ethers.Contract => {
  return new ethers.Contract(
    env.CONTRACT_ADDRESS,
    traceabilityABI,
    getProvider()
  );
};

export { getProvider, getSigner, getContract, getReadonlyContract };
