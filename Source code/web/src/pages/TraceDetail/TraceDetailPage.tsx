import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { traceEventApi } from '../../core/api/traceEvent.api';
import type { FullTrace, VerifyResult } from '../../core/types';
import BlockchainBadge from '../../components/BlockchainBadge/BlockchainBadge';
import QRCodeGenerator from '../../components/QRCode/QRCodeGenerator';

const eventTypeLabel: Record<string, string> = {
  SEEDING: '🌱 Gieo hạt',
  FERTILIZING: '🧪 Bón phân',
  WATERING: '💧 Tưới nước',
  PEST_CONTROL: '🐛 Kiểm soát sâu bệnh',
  HARVESTING: '🌾 Thu hoạch',
  PACKAGING: '📦 Đóng gói',
  SHIPPING: '🚚 Vận chuyển',
};

const TraceDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [trace, setTrace] = useState<FullTrace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifyResults, setVerifyResults] = useState<Record<string, VerifyResult>>({});
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    traceEventApi
      .getFullTrace(productId)
      .then((res) => setTrace(res.data))
      .catch((err) => setError(err.message || 'Không tìm thấy thông tin truy xuất'))
      .finally(() => setLoading(false));
  }, [productId]);

  const handleVerify = useCallback(async (eventId: string) => {
    setVerifying(eventId);
    try {
      const { data } = await traceEventApi.verify(eventId);
      setVerifyResults((prev) => ({ ...prev, [eventId]: data }));
    } catch {
      setVerifyResults((prev) => ({
        ...prev,
        [eventId]: { verified: false, dataHash: '', event: {} as any },
      }));
    }
    setVerifying(null);
  }, []);

  if (loading) return <p style={{ padding: 24 }}>Đang tải thông tin truy xuất...</p>;
  if (error || !trace) return <p style={{ padding: 24, color: 'red' }}>{error || 'Không có dữ liệu'}</p>;

  const { product, events, onChain } = trace;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      {/* Product info */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 32 }}>
        <div style={{ flex: 1 }}>
          <h1>{product.name}</h1>
          <p style={{ color: '#666' }}>{product.description}</p>
          <table style={{ marginTop: 12 }}>
            <tbody>
              <tr><td style={{ fontWeight: 'bold', paddingRight: 16 }}>Danh mục:</td><td>{product.category}</td></tr>
              <tr><td style={{ fontWeight: 'bold', paddingRight: 16 }}>Xuất xứ:</td><td>{product.origin}</td></tr>
              <tr><td style={{ fontWeight: 'bold', paddingRight: 16 }}>Batch ID:</td><td style={{ fontFamily: 'monospace' }}>{product._id}</td></tr>
              <tr><td style={{ fontWeight: 'bold', paddingRight: 16 }}>Trạng thái:</td><td>{product.status}</td></tr>
            </tbody>
          </table>
        </div>
        <QRCodeGenerator productId={product._id} productName={product.name} />
      </div>

      {/* On-chain summary */}
      {onChain && (
        <div style={{ padding: 16, backgroundColor: '#f0fdf4', borderRadius: 8, marginBottom: 24, border: '1px solid #bbf7d0' }}>
          <h3>🔗 Thông tin Blockchain</h3>
          <p><strong>Owner on-chain:</strong> <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{onChain.owner}</span></p>
          <p><strong>Số action on-chain:</strong> {onChain.actions.length}</p>
        </div>
      )}

      {/* Timeline */}
      <h2>📋 Lịch sử truy xuất ({events.length} sự kiện)</h2>
      <div style={{ marginTop: 16 }}>
        {events.map((evt, idx) => (
          <div
            key={evt._id}
            style={{
              position: 'relative',
              paddingLeft: 32,
              paddingBottom: 24,
              borderLeft: idx < events.length - 1 ? '2px solid #d1d5db' : '2px solid transparent',
            }}
          >
            {/* Timeline dot */}
            <div
              style={{
                position: 'absolute',
                left: -7,
                top: 0,
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: evt.onChainStatus === 'confirmed' ? '#16a34a' : '#d1d5db',
                border: '2px solid white',
              }}
            />

            <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 'bold', fontSize: 15 }}>
                  {eventTypeLabel[evt.eventType] || evt.eventType}
                </span>
                <span style={{ fontSize: 12, color: '#999' }}>
                  {new Date(evt.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>

              <p style={{ margin: '4px 0' }}>{evt.description}</p>

              {/* Details nếu có */}
              {evt.details && Object.keys(evt.details).length > 0 && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 13, color: '#666' }}>Chi tiết kỹ thuật</summary>
                  <pre style={{ fontSize: 12, backgroundColor: '#f9fafb', padding: 8, borderRadius: 4, overflow: 'auto' }}>
                    {JSON.stringify(evt.details, null, 2)}
                  </pre>
                </details>
              )}

              {/* Blockchain status */}
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <BlockchainBadge status={evt.onChainStatus} txHash={evt.txHash} />

                {evt.onChainStatus === 'confirmed' && (
                  <button
                    onClick={() => handleVerify(evt._id)}
                    disabled={verifying === evt._id}
                    style={{ fontSize: 12, cursor: 'pointer', padding: '4px 8px' }}
                  >
                    {verifying === evt._id ? 'Đang kiểm...' : '🔍 Xác minh'}
                  </button>
                )}

                {verifyResults[evt._id] && (
                  <span style={{
                    fontSize: 12,
                    color: verifyResults[evt._id].verified ? '#16a34a' : '#dc2626',
                    fontWeight: 'bold',
                  }}>
                    {verifyResults[evt._id].verified
                      ? '✅ Data khớp với blockchain'
                      : '❌ Data KHÔNG khớp – có thể bị sửa đổi!'}
                  </span>
                )}
              </div>

              {/* Data hash */}
              {evt.dataHash && (
                <p style={{ fontSize: 11, color: '#999', fontFamily: 'monospace', marginTop: 4 }}>
                  Hash: {evt.dataHash}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TraceDetailPage;
