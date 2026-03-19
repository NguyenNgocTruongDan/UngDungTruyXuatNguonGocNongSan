export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'farmer' | 'viewer';
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  category: string;
  type: 'Plant' | 'Animal';
  origin: string;
  cultivation_time?: string;
  images: { path: string; filename: string }[];
  qrcode?: string;
  status: 'draft' | 'active' | 'completed';
  onChainBatchId?: string;
  created_by: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductResponse {
  product: Product;
  batchId: string;
  batchTxHash?: string;
}

export type EventType =
  | 'SEEDING'
  | 'FERTILIZING'
  | 'WATERING'
  | 'PEST_CONTROL'
  | 'HARVESTING'
  | 'PACKAGING'
  | 'SHIPPING';

export interface TraceEvent {
  _id: string;
  product: string | Product;
  batchId: string;
  eventType: EventType;
  description: string;
  details?: Record<string, unknown>;
  images: string[];
  recorded_by: string | User;
  dataHash?: string;
  txHash?: string;
  blockNumber?: number;
  onChainStatus: 'pending' | 'confirmed' | 'failed';
  actionIndex?: number;
  createdAt: string;
}

export interface FullTrace {
  product: Product;
  events: TraceEvent[];
  onChain?: {
    batchId: string;
    owner: string;
    actions: {
      dataHash: string;
      actionType: number;
      timestamp: number;
      recorder: string;
    }[];
  };
}

export interface VerifyResult {
  verified: boolean;
  event: TraceEvent;
  dataHash: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
