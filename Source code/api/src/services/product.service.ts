import Product from '../models/Product';
import env from '../config/env';
import { BadRequestError, NotFoundError } from '../utils/errors';
import generateQR from '../utils/qrcode';
import { createBatchOnChain } from './blockchain.service';

const isBlockchainConfigured = () =>
  !!(env.CONTRACT_ADDRESS && env.BLOCKCHAIN_PRIVATE_KEY);

export const getAllProducts = async () => {
  return Product.find({}).populate('created_by', 'first_name last_name email');
};

export const getProductById = async (productId: string) => {
  const product = await Product.findById(productId).populate(
    'created_by',
    'first_name last_name email'
  );

  if (!product) {
    throw new NotFoundError(`Kh?ng t?m th?y s?n ph?m ${productId}`);
  }

  return product;
};

export const createProduct = async (
  data: {
    name: string;
    category: string;
    type: 'Plant' | 'Animal';
    description: string;
    origin?: string;
    cultivation_time?: string;
    images?: { path: string; filename: string }[];
  },
  userId: string
) => {
  if (!data.name || !data.category || !data.type || !data.description) {
    throw new BadRequestError('Vui l?ng ?i?n ??y ?? th?ng tin s?n ph?m');
  }

  const product = await Product.create({ ...data, created_by: userId });
  const batchId = product._id.toString();
  let batchTxHash = '';

  if (isBlockchainConfigured()) {
    try {
      const result = await createBatchOnChain(batchId);
      batchTxHash = result.txHash;
      product.onChainBatchId = batchId;
      product.status = 'active';
    } catch (error: any) {
      console.error('Blockchain createBatch failed:', error.message);
    }
  }

  const traceUrl = `${env.FRONTEND_URL || 'http://localhost:3000'}/trace/${batchId}`;
  const qrcode = await generateQR(traceUrl);

  product.qrcode = qrcode;
  await product.save();

  return { product, batchId, batchTxHash };
};

export const updateProduct = async (
  productId: string,
  data: Partial<{
    name: string;
    category: string;
    description: string;
    origin: string;
    cultivation_time: string;
  }>
) => {
  const product = await Product.findByIdAndUpdate(productId, data, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new NotFoundError(`Kh?ng t?m th?y s?n ph?m ${productId}`);
  }

  return product;
};

export const deleteProduct = async (productId: string) => {
  const product = await Product.findByIdAndDelete(productId);

  if (!product) {
    throw new NotFoundError(`Kh?ng t?m th?y s?n ph?m ${productId}`);
  }

  return product;
};
