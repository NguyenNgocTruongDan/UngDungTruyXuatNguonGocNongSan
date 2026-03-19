import { ethers } from 'ethers';
import { getContract, getReadonlyContract } from '../config/blockchain';
import { ACTION_TYPES, ActionType } from '../models/TraceEvent';

interface TxResult {
  txHash: string;
  blockNumber: number;
}

export const hashEventData = (data: Record<string, unknown>): string => {
  const sorted = JSON.stringify(data, Object.keys(data).sort());
  return ethers.keccak256(ethers.toUtf8Bytes(sorted));
};

export const createBatchOnChain = async (batchId: string): Promise<TxResult> => {
  const contract = getContract();
  const tx = await contract.createBatch(batchId);
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
};

export const recordActionOnChain = async (
  batchId: string,
  eventData: Record<string, unknown>,
  eventType: ActionType
): Promise<TxResult & { dataHash: string; actionIndex: number }> => {
  const contract = getContract();
  const dataHash = hashEventData(eventData);
  const actionTypeIndex = ACTION_TYPES.indexOf(eventType);

  // Wait until the tx is mined so receipt has hash and block number.
  const tx = await contract.addAction(batchId, dataHash, actionTypeIndex);
  const receipt = await tx.wait();

  const readonlyContract = getReadonlyContract();
  const count = await readonlyContract.getActionCount(batchId);
  const actionIndex = Number(count) - 1;

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    dataHash,
    actionIndex,
  };
};

export interface OnChainAction {
  dataHash: string;
  actionType: number;
  timestamp: number;
  recorder: string;
}

export interface BatchHistory {
  owner: string;
  actions: OnChainAction[];
}

export const getHistoryFromChain = async (
  batchId: string
): Promise<BatchHistory> => {
  const contract = getReadonlyContract();
  const [owner, rawActions] = await contract.getHistory(batchId);

  const actions: OnChainAction[] = rawActions.map((a: any) => ({
    dataHash: a.dataHash,
    actionType: Number(a.actionType),
    timestamp: Number(a.timestamp),
    recorder: a.recorder,
  }));

  return { owner, actions };
};

export const verifyActionOnChain = async (
  batchId: string,
  actionIndex: number,
  eventData: Record<string, unknown>
): Promise<{ verified: boolean; dataHash: string }> => {
  const contract = getReadonlyContract();
  const dataHash = hashEventData(eventData);
  const verified = await contract.verifyAction(batchId, actionIndex, dataHash);

  return { verified, dataHash };
};

export const batchExistsOnChain = async (batchId: string): Promise<boolean> => {
  const contract = getReadonlyContract();
  return contract.batchExists(batchId);
};
