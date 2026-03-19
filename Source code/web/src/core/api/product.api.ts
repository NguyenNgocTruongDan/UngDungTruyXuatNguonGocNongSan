import axiosClient from './axiosClient';
import type { CreateProductResponse, Product } from '../types';

export const productApi = {
  getAll: () =>
    axiosClient.get<{ products: Product[]; count: number }>('/products'),

  getById: (id: string) =>
    axiosClient.get<Product>(`/products/${id}`),

  create: (data: Partial<Product>) =>
    axiosClient.post<CreateProductResponse>('/products', data),

  update: (id: string, data: Partial<Product>) =>
    axiosClient.patch<Product>(`/products/${id}`, data),

  delete: (id: string) =>
    axiosClient.delete(`/products/${id}`),
};
