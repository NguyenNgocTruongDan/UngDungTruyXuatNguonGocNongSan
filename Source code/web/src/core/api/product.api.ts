import axiosClient from './axiosClient';
import type { CreateProductResponse, Product } from '../types';

export interface CreateProductData {
  name: string;
  category: string;
  type: 'Plant' | 'Animal';
  description?: string;
  origin: string;
  cultivation_time?: string;
  farming_area?: string; // ID string when creating
}

export const productApi = {
  getAll: () =>
    axiosClient.get<{ products: Product[]; count: number }>('/products'),

  getById: (id: string) =>
    axiosClient.get<Product>(`/products/${id}`),

  create: (data: CreateProductData) =>
    axiosClient.post<CreateProductResponse>('/products', data),

  update: (id: string, data: Partial<CreateProductData>) =>
    axiosClient.patch<Product>(`/products/${id}`, data),

  delete: (id: string) =>
    axiosClient.delete(`/products/${id}`),
};
