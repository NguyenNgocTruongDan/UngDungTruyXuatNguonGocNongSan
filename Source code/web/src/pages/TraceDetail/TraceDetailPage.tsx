import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { traceEventApi } from '../../core/api/traceEvent.api';
import type { FullTrace, VerifyResult } from '../../core/types';
import BlockchainBadge from '../../components/BlockchainBadge/BlockchainBadge';
import FarmingAreaMap from '../../components/Map/FarmingAreaMap';
import QRCodeGenerator from '../../components/QRCode/QRCodeGenerator';
import { colors, spacing, borderRadius, shadows, typography } from '../../core/theme';

const eventTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
  SEEDING: { label: 'Gieo hạt', icon: '🌱', color: '#16a34a' },
  FERTILIZING: { label: 'Bón phân', icon: '🧪', color: '#ca8a04' },
  WATERING: { label: 'Tưới nước', icon: '💧', color: '#0284c7' },
  PEST_CONTROL: { label: 'Kiểm soát sâu bệnh', icon: '🐛', color: '#dc2626' },
  HARVESTING: { label: 'Thu hoạch', icon: '🌾', color: '#ea580c' },
  PACKAGING: { label: 'Đóng gói', icon: '📦', color: '#7c3aed' },
  SHIPPING: { label: 'Vận chuyển', icon: '🚚', color: '#0891b2' },
};

const statusLabel: Record<string, string> = {
  draft: 'Nháp',
  active: 'Đang theo dõi',
  completed: 'Hoàn tất',
};

const certTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  VietGAP: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  GlobalGAP: { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  Organic: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  HACCP: { bg: '#fce7f3', text: '#be185d', border: '#f9a8d4' },
  ISO22000: { bg: '#e0e7ff', text: '#4338ca', border: '#a5b4fc' },
  Other: { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' },
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: spacing[4] }}>🔍</div>
          <p style={{ color: colors.textSecondary, fontSize: typography.sizes.lg }}>Đang tải thông tin truy xuất...</p>
        </div>
      </div>
    );
  }

  if (error || !trace) {
    return (
      <div style={{ 
        maxWidth: 600, margin: '0 auto', padding: spacing[8], textAlign: 'center',
        background: '#fef2f2', borderRadius: borderRadius.xl, marginTop: spacing[8]
      }}>
        <div style={{ fontSize: 48, marginBottom: spacing[4] }}>❌</div>
        <h2 style={{ color: '#b91c1c', margin: 0, marginBottom: spacing[2] }}>Không tìm thấy</h2>
        <p style={{ color: '#991b1b' }}>{error || 'Không có dữ liệu truy xuất cho sản phẩm này'}</p>
      </div>
    );
  }

  const { product, events, onChain } = trace;
  const farmingArea = product.farming_area;
  const certifications = farmingArea?.certifications || [];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Hero Section - Product Info */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%)`,
        borderRadius: borderRadius.xl,
        padding: spacing[8],
        color: 'white',
        marginBottom: spacing[6],
        boxShadow: shadows.lg,
      }}>
        <div style={{ display: 'flex', gap: spacing[8], alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ 
              display: 'inline-block',
              background: 'rgba(255,255,255,0.2)',
              padding: `${spacing[1]} ${spacing[4]}`,
              borderRadius: borderRadius.full,
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.medium,
              marginBottom: spacing[3],
            }}>
              {product.type === 'Plant' ? '🌱 Trồng trọt' : '🐔 Chăn nuôi'} • {product.category}
            </div>
            
            <h1 style={{ 
              margin: 0, 
              fontSize: typography.sizes['3xl'], 
              fontWeight: typography.weights.bold,
              marginBottom: spacing[3],
            }}>
              {product.name}
            </h1>
            
            {product.description && (
              <p style={{ 
                margin: 0, 
                opacity: 0.9, 
                fontSize: typography.sizes.base,
                lineHeight: 1.6,
                marginBottom: spacing[4],
              }}>
                {product.description}
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing[4], marginTop: spacing[4] }}>
              <div>
                <div style={{ opacity: 0.7, fontSize: typography.sizes.sm, marginBottom: spacing[1] }}>Xuất xứ</div>
                <div style={{ fontWeight: typography.weights.semibold }}>📍 {product.origin}</div>
              </div>
              <div>
                <div style={{ opacity: 0.7, fontSize: typography.sizes.sm, marginBottom: spacing[1] }}>Trạng thái</div>
                <div style={{ 
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.2)',
                  padding: `${spacing[1]} ${spacing[3]}`,
                  borderRadius: borderRadius.md,
                  fontWeight: typography.weights.semibold,
                  fontSize: typography.sizes.sm,
                }}>
                  {statusLabel[product.status] || product.status}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ opacity: 0.7, fontSize: typography.sizes.sm, marginBottom: spacing[1] }}>Mã truy xuất</div>
                <div style={{ 
                  fontFamily: 'monospace', 
                  fontSize: typography.sizes.xs,
                  background: 'rgba(0,0,0,0.2)',
                  padding: `${spacing[2]} ${spacing[3]}`,
                  borderRadius: borderRadius.md,
                  wordBreak: 'break-all',
                }}>
                  {product._id}
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div style={{ 
            background: 'white', 
            borderRadius: borderRadius.xl, 
            padding: spacing[4],
            boxShadow: shadows.md,
          }}>
            <QRCodeGenerator productId={product._id} productName={product.name} />
            <p style={{ 
              textAlign: 'center', 
              margin: `${spacing[2]} 0 0`, 
              color: colors.textSecondary,
              fontSize: typography.sizes.xs,
            }}>
              Quét để xem truy xuất
            </p>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing[5], marginBottom: spacing[6] }}>
        
        {/* Farming Area Card */}
        {farmingArea && (
          <div style={{
            background: colors.surface,
            borderRadius: borderRadius.xl,
            padding: spacing[5],
            border: `1px solid ${colors.neutral[200]}`,
            boxShadow: shadows.sm,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[4] }}>
              <div style={{ 
                width: 44, height: 44, borderRadius: borderRadius.lg,
                background: colors.primary[100], color: colors.primary[600],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                🌾
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold }}>
                  Vùng canh tác
                </h3>
                <p style={{ margin: 0, color: colors.textSecondary, fontSize: typography.sizes.sm }}>
                  Thông tin nơi sản xuất
                </p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gap: spacing[3] }}>
              <div>
                <div style={{ fontSize: typography.sizes.xs, color: colors.textSecondary, marginBottom: spacing[1] }}>Tên vùng</div>
                <div style={{ fontWeight: typography.weights.medium }}>{farmingArea.name}</div>
              </div>
              <div>
                <div style={{ fontSize: typography.sizes.xs, color: colors.textSecondary, marginBottom: spacing[1] }}>Địa chỉ</div>
                <div style={{ fontSize: typography.sizes.sm }}>{farmingArea.address}</div>
              </div>
              {farmingArea.area_size && (
                <div>
                  <div style={{ fontSize: typography.sizes.xs, color: colors.textSecondary, marginBottom: spacing[1] }}>Diện tích</div>
                  <div style={{ fontWeight: typography.weights.medium }}>{farmingArea.area_size} ha</div>
                </div>
              )}
              {farmingArea.owner && (
                <div>
                  <div style={{ fontSize: typography.sizes.xs, color: colors.textSecondary, marginBottom: spacing[1] }}>Chủ sở hữu</div>
                  <div style={{ fontWeight: typography.weights.medium }}>
                    👤 {farmingArea.owner.first_name} {farmingArea.owner.last_name}
                  </div>
                </div>
              )}
              <div style={{ marginTop: spacing[2] }}>
                <FarmingAreaMap
                  coordinates={farmingArea.coordinates}
                  address={farmingArea.address}
                  title="Ban do vung canh tac"
                  height={220}
                />
              </div>
            </div>
          </div>
        )}

        {/* Certifications Card */}
        {certifications.length > 0 && (
          <div style={{
            background: colors.surface,
            borderRadius: borderRadius.xl,
            padding: spacing[5],
            border: `1px solid ${colors.neutral[200]}`,
            boxShadow: shadows.sm,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[4] }}>
              <div style={{ 
                width: 44, height: 44, borderRadius: borderRadius.lg,
                background: '#fef3c7', color: '#92400e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                🏆
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold }}>
                  Chứng nhận chất lượng
                </h3>
                <p style={{ margin: 0, color: colors.textSecondary, fontSize: typography.sizes.sm }}>
                  {certifications.length} chứng nhận
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
              {certifications.map((cert: any) => {
                const certColor = certTypeColors[cert.type] || certTypeColors.Other;
                const isExpired = cert.status !== 'valid';
                return (
                  <div
                    key={cert._id}
                    style={{
                      padding: spacing[4],
                      background: isExpired ? colors.neutral[50] : certColor.bg,
                      borderRadius: borderRadius.lg,
                      border: `1px solid ${isExpired ? colors.neutral[200] : certColor.border}`,
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: spacing[2],
                    }}>
                      <div style={{ 
                        fontWeight: typography.weights.semibold, 
                        color: isExpired ? colors.neutral[500] : certColor.text,
                        fontSize: typography.sizes.sm,
                      }}>
                        {cert.type === 'VietGAP' && '🇻🇳 '}
                        {cert.type === 'GlobalGAP' && '🌍 '}
                        {cert.type === 'Organic' && '🌿 '}
                        {cert.name}
                      </div>
                      <span style={{
                        fontSize: typography.sizes.xs,
                        padding: `${spacing[1]} ${spacing[2]}`,
                        borderRadius: borderRadius.md,
                        background: isExpired ? '#fef2f2' : '#dcfce7',
                        color: isExpired ? '#b91c1c' : '#166534',
                        fontWeight: typography.weights.medium,
                      }}>
                        {isExpired ? '❌ Hết hạn' : '✅ Hiệu lực'}
                      </span>
                    </div>
                    <div style={{ fontSize: typography.sizes.xs, color: colors.textSecondary }}>
                      Số: {cert.certificate_number}
                    </div>
                    <div style={{ fontSize: typography.sizes.xs, color: colors.textSecondary }}>
                      Cấp bởi: {cert.issuing_authority}
                    </div>
                    {cert.expiry_date && (
                      <div style={{ fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: spacing[1] }}>
                        HSD: {new Date(cert.expiry_date).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Blockchain Card */}
        {onChain && (
          <div style={{
            background: colors.surface,
            borderRadius: borderRadius.xl,
            padding: spacing[5],
            border: `1px solid ${colors.neutral[200]}`,
            boxShadow: shadows.sm,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[4] }}>
              <div style={{ 
                width: 44, height: 44, borderRadius: borderRadius.lg,
                background: '#dbeafe', color: '#1d4ed8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                🔗
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold }}>
                  Blockchain
                </h3>
                <p style={{ margin: 0, color: colors.textSecondary, fontSize: typography.sizes.sm }}>
                  Dữ liệu bất biến
                </p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gap: spacing[3] }}>
              <div>
                <div style={{ fontSize: typography.sizes.xs, color: colors.textSecondary, marginBottom: spacing[1] }}>
                  Owner Address
                </div>
                <div style={{ 
                  fontFamily: 'monospace', 
                  fontSize: typography.sizes.xs,
                  background: colors.neutral[100],
                  padding: `${spacing[2]} ${spacing[3]}`,
                  borderRadius: borderRadius.md,
                  wordBreak: 'break-all',
                }}>
                  {onChain.owner}
                </div>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: spacing[3],
                padding: spacing[3],
                background: '#dcfce7',
                borderRadius: borderRadius.md,
              }}>
                <span style={{ fontSize: 24 }}>✅</span>
                <div>
                  <div style={{ fontWeight: typography.weights.semibold, color: '#166534' }}>
                    {onChain.actions.length} sự kiện đã ghi
                  </div>
                  <div style={{ fontSize: typography.sizes.xs, color: '#166534' }}>
                    Dữ liệu đã được xác nhận trên blockchain
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Section */}
      <div style={{
        background: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing[6],
        border: `1px solid ${colors.neutral[200]}`,
        boxShadow: shadows.sm,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[6] }}>
          <div>
            <h2 style={{ margin: 0, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold }}>
              📋 Lịch sử truy xuất
            </h2>
            <p style={{ margin: `${spacing[1]} 0 0`, color: colors.textSecondary, fontSize: typography.sizes.sm }}>
              {events.length} sự kiện được ghi nhận
            </p>
          </div>
        </div>

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: spacing[8], color: colors.textSecondary }}>
            <div style={{ fontSize: 48, marginBottom: spacing[3] }}>📝</div>
            <p>Chưa có sự kiện nào được ghi nhận</p>
          </div>
        ) : (
          <div>
            {events.map((evt, idx) => {
              const config = eventTypeConfig[evt.eventType] || { label: evt.eventType, icon: '📌', color: colors.neutral[500] };
              const result = verifyResults[evt._id];
              
              return (
                <div
                  key={evt._id}
                  style={{
                    position: 'relative',
                    paddingLeft: spacing[10],
                    paddingBottom: idx < events.length - 1 ? spacing[6] : 0,
                  }}
                >
                  {/* Timeline Line */}
                  {idx < events.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: 19,
                      top: 44,
                      bottom: 0,
                      width: 2,
                      background: colors.neutral[200],
                    }} />
                  )}

                  {/* Timeline Dot */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 40,
                    height: 40,
                    borderRadius: borderRadius.lg,
                    background: evt.onChainStatus === 'confirmed' ? `${config.color}15` : colors.neutral[100],
                    border: `2px solid ${evt.onChainStatus === 'confirmed' ? config.color : colors.neutral[300]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {config.icon}
                  </div>

                  {/* Event Card */}
                  <div style={{
                    background: colors.neutral[50],
                    borderRadius: borderRadius.lg,
                    padding: spacing[5],
                    border: `1px solid ${colors.neutral[200]}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[3] }}>
                      <div>
                        <span style={{ 
                          fontWeight: typography.weights.semibold, 
                          fontSize: typography.sizes.base,
                          color: config.color,
                        }}>
                          {config.label}
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: typography.sizes.xs, 
                        color: colors.textSecondary,
                        background: colors.surface,
                        padding: `${spacing[1]} ${spacing[3]}`,
                        borderRadius: borderRadius.md,
                      }}>
                        🕐 {new Date(evt.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <p style={{ margin: `0 0 ${spacing[3]}`, color: colors.textPrimary, fontSize: typography.sizes.sm, lineHeight: 1.6 }}>
                      {evt.description}
                    </p>

                    {/* Details */}
                    {evt.details && Object.keys(evt.details).length > 0 && (
                      <details style={{ marginBottom: spacing[3] }}>
                        <summary style={{ 
                          cursor: 'pointer', 
                          fontSize: typography.sizes.sm, 
                          color: colors.primary[600],
                          fontWeight: typography.weights.medium,
                        }}>
                          📊 Chi tiết kỹ thuật
                        </summary>
                        <pre style={{ 
                          fontSize: typography.sizes.xs, 
                          background: colors.surface, 
                          padding: spacing[3], 
                          borderRadius: borderRadius.md, 
                          overflow: 'auto',
                          marginTop: spacing[2],
                          border: `1px solid ${colors.neutral[200]}`,
                        }}>
                          {JSON.stringify(evt.details, null, 2)}
                        </pre>
                      </details>
                    )}

                    {/* Blockchain Status & Verify */}
                    <div style={{ 
                      display: 'flex', 
                      gap: spacing[3], 
                      alignItems: 'center', 
                      flexWrap: 'wrap',
                      paddingTop: spacing[3],
                      borderTop: `1px solid ${colors.neutral[200]}`,
                    }}>
                      <BlockchainBadge status={evt.onChainStatus} txHash={evt.txHash} />

                      {evt.onChainStatus === 'confirmed' && (
                        <button
                          onClick={() => handleVerify(evt._id)}
                          disabled={verifying === evt._id}
                          style={{ 
                            fontSize: typography.sizes.xs, 
                            cursor: verifying === evt._id ? 'not-allowed' : 'pointer', 
                            padding: `${spacing[2]} ${spacing[3]}`,
                            border: `1px solid ${colors.primary[300]}`,
                            borderRadius: borderRadius.md,
                            background: colors.primary[50],
                            color: colors.primary[700],
                            fontWeight: typography.weights.medium,
                          }}
                        >
                          {verifying === evt._id ? '⏳ Đang kiểm...' : '🔍 Xác minh blockchain'}
                        </button>
                      )}

                      {result && (
                        <span style={{
                          fontSize: typography.sizes.xs,
                          padding: `${spacing[2]} ${spacing[3]}`,
                          borderRadius: borderRadius.md,
                          background: result.verified ? '#dcfce7' : '#fef2f2',
                          color: result.verified ? '#166534' : '#b91c1c',
                          fontWeight: typography.weights.semibold,
                        }}>
                          {result.verified
                            ? '✅ Dữ liệu khớp với blockchain'
                            : '❌ Dữ liệu KHÔNG khớp – có thể bị sửa đổi!'}
                        </span>
                      )}
                    </div>

                    {/* Data Hash */}
                    {evt.dataHash && (
                      <div style={{ 
                        marginTop: spacing[3],
                        padding: `${spacing[2]} ${spacing[3]}`,
                        background: colors.surface,
                        borderRadius: borderRadius.md,
                        border: `1px solid ${colors.neutral[200]}`,
                      }}>
                        <span style={{ fontSize: typography.sizes.xs, color: colors.textSecondary }}>Hash: </span>
                        <span style={{ fontSize: typography.sizes.xs, fontFamily: 'monospace', color: colors.neutral[500], wordBreak: 'break-all' }}>
                          {evt.dataHash}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TraceDetailPage;
