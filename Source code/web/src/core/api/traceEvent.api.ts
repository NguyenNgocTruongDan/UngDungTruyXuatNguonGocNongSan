import axiosClient from './axiosClient';
import type { TraceEvent, FullTrace, VerifyResult } from '../types';

export const traceEventApi = {
  getFullTrace: (productId: string) =>
    axiosClient.get<FullTrace>(`/trace/${productId}`),

  verify: (eventId: string) =>
    axiosClient.get<VerifyResult>(`/trace/verify/${eventId}`),

  getByProduct: (productId: string) =>
    axiosClient.get<TraceEvent[]>(`/trace/events/product/${productId}`),

  create: (data: {
    product: string;
    eventType: string;
    description: string;
    details?: Record<string, unknown>;
    images?: string[];
  }) =>
    axiosClient.post<TraceEvent>('/trace/events', data),
};
