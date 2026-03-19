import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as productService from '../services/product.service';

export const getAllProducts = async (_req: Request, res: Response) => {
  const products = await productService.getAllProducts();
  res.status(StatusCodes.OK).json({ products, count: products.length });
};

export const getProduct = async (req: Request, res: Response) => {
  const product = await productService.getProductById(req.params.id);
  res.status(StatusCodes.OK).json({ product });
};

export const createProduct = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await productService.createProduct(req.body, userId);
  res.status(StatusCodes.CREATED).json(result);
};

export const updateProduct = async (req: Request, res: Response) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.status(StatusCodes.OK).json({ product });
};

export const deleteProduct = async (req: Request, res: Response) => {
  await productService.deleteProduct(req.params.id);
  res.status(StatusCodes.OK).json({ msg: '?? x?a s?n ph?m' });
};
