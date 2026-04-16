import React, { useEffect, useMemo, useState } from 'react';
import {
  farmingAreaApi,
  FarmingArea,
  CreateFarmingAreaData,
} from '../../core/api/farmingArea.api';
import FarmingAreaMap from '../../components/Map/FarmingAreaMap';
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from '../../core/theme';

interface CertificationBadge {
  _id: string;
  name: string;
  type: string;
  status: string;
  expiry_date?: string;
}

interface FarmingAreaWithCerts extends FarmingArea {
  certifications?: CertificationBadge[];
}

interface FarmingAreaFormState {
  name: string;
  address: string;
  area_size?: number;
  description: string;
  latitude: string;
  longitude: string;
}

const certTypeColors: Record<string, { bg: string; text: string }> = {
  VietGAP: { bg: '#dcfce7', text: '#166534' },
  GlobalGAP: { bg: '#dbeafe', text: '#1d4ed8' },
  Organic: { bg: '#fef3c7', text: '#92400e' },
  HACCP: { bg: '#fce7f3', text: '#be185d' },
  ISO22000: { bg: '#e0e7ff', text: '#4338ca' },
  Other: { bg: '#f3f4f6', text: '#374151' },
};

const fieldStyle: React.CSSProperties = {
  padding: `${spacing[3]} ${spacing[4]}`,
  borderRadius: borderRadius.lg,
  border: `1px solid ${colors.neutral[300]}`,
  fontSize: typography.sizes.base,
  width: '100%',
  boxSizing: 'border-box',
};

const createEmptyFormState = (): FarmingAreaFormState => ({
  name: '',
  address: '',
  area_size: undefined,
  description: '',
  latitude: '',
  longitude: '',
});

const resolveCoordinates = (
  form: Pick<FarmingAreaFormState, 'latitude' | 'longitude'>
): { coordinates?: { lat: number; lng: number }; error?: string } => {
  const latitude = form.latitude.trim();
  const longitude = form.longitude.trim();

  if (!latitude && !longitude) {
    return {};
  }

  if (!latitude || !longitude) {
    return { error: 'Vui lòng nhập đầy đủ cả latitude và longitude.' };
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { error: 'Latitude phải nằm trong khoảng từ -90 đến 90.' };
  }

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { error: 'Longitude phải nằm trong khoảng từ -180 đến 180.' };
  }

  return { coordinates: { lat, lng } };
};

const FarmingAreaPage: React.FC = () => {
  const [areas, setAreas] = useState<FarmingAreaWithCerts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FarmingAreaFormState>(
    createEmptyFormState
  );
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const { data } = await farmingAreaApi.getAll();
      setAreas(data.farmingAreas as FarmingAreaWithCerts[]);
    } catch (err: any) {
      setError(err.message || 'Khong tai duoc danh sach vung trong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(createEmptyFormState());
  };

  const previewCoordinates = useMemo(
    () => resolveCoordinates(formData).coordinates,
    [formData]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      setError('Vui long nhap ten va dia chi');
      return;
    }

    const { coordinates, error: coordinateError } = resolveCoordinates(formData);
    if (coordinateError) {
      setError(coordinateError);
      return;
    }

    const submitData: CreateFarmingAreaData = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      area_size: formData.area_size,
      description: formData.description.trim() || undefined,
      coordinates,
    };

    setSubmitting(true);
    setError('');

    try {
      if (editingId) {
        await farmingAreaApi.update(editingId, submitData);
      } else {
        await farmingAreaApi.create(submitData);
      }

      resetForm();
      await fetchAreas();
    } catch (err: any) {
      setError(err.message || 'Khong the luu vung trong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (area: FarmingAreaWithCerts) => {
    setFormData({
      name: area.name,
      address: area.address,
      area_size: area.area_size,
      description: area.description || '',
      latitude: area.coordinates?.lat?.toString() || '',
      longitude: area.coordinates?.lng?.toString() || '',
    });
    setEditingId(area._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Ban co chac muon xoa vung trong nay?')) {
      return;
    }

    try {
      await farmingAreaApi.delete(id);
      await fetchAreas();
    } catch (err: any) {
      setError(err.message || 'Khong the xoa');
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing[6],
          gap: spacing[4],
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: typography.sizes['2xl'],
              fontWeight: typography.weights.bold,
            }}
          >
            Quan ly Vung trong
          </h1>
          <p
            style={{
              color: colors.textSecondary,
              margin: `${spacing[2]} 0 0`,
              fontSize: typography.sizes.sm,
            }}
          >
            Them, sua, xoa va gan ban do cho cac vung trong / trang trai.
          </p>
        </div>
        <button
          style={{
            background: colors.primary[600],
            color: 'white',
            border: 'none',
            borderRadius: borderRadius.lg,
            padding: `${spacing[3]} ${spacing[5]}`,
            fontWeight: typography.weights.semibold,
            cursor: 'pointer',
          }}
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData(createEmptyFormState());
          }}
        >
          + Them vung trong
        </button>
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            color: '#b91c1c',
            padding: spacing[4],
            borderRadius: borderRadius.lg,
            marginBottom: spacing[4],
          }}
        >
          {error}
        </div>
      )}

      {showForm && (
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.neutral[200]}`,
            borderRadius: borderRadius.xl,
            padding: spacing[6],
            marginBottom: spacing[6],
            boxShadow: shadows.sm,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.semibold,
            }}
          >
            {editingId ? 'Sua vung trong' : 'Them vung trong moi'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: spacing[4], maxWidth: 720 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: spacing[2],
                    fontWeight: typography.weights.medium,
                    fontSize: typography.sizes.sm,
                  }}
                >
                  Ten vung trong *
                </label>
                <input
                  style={fieldStyle}
                  placeholder="Vi du: Trang trai rau sach Da Lat"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: spacing[2],
                    fontWeight: typography.weights.medium,
                    fontSize: typography.sizes.sm,
                  }}
                >
                  Dia chi *
                </label>
                <input
                  style={fieldStyle}
                  placeholder="Vi du: Xa Xuan Tho, TP. Da Lat, Lam Dong"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: spacing[2],
                    fontWeight: typography.weights.medium,
                    fontSize: typography.sizes.sm,
                  }}
                >
                  Dien tich (ha)
                </label>
                <input
                  style={fieldStyle}
                  type="number"
                  placeholder="Vi du: 5.5"
                  value={formData.area_size || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      area_size: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: spacing[2],
                    fontWeight: typography.weights.medium,
                    fontSize: typography.sizes.sm,
                  }}
                >
                  Mo ta
                </label>
                <textarea
                  style={{ ...fieldStyle, minHeight: 80, resize: 'vertical' }}
                  placeholder="Mo ta ve vung trong..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: spacing[4],
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: spacing[2],
                      fontWeight: typography.weights.medium,
                      fontSize: typography.sizes.sm,
                    }}
                  >
                    Latitude
                  </label>
                  <input
                    style={fieldStyle}
                    type="number"
                    step="any"
                    placeholder="Vi du: 11.940419"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: spacing[2],
                      fontWeight: typography.weights.medium,
                      fontSize: typography.sizes.sm,
                    }}
                  >
                    Longitude
                  </label>
                  <input
                    style={fieldStyle}
                    type="number"
                    step="any"
                    placeholder="Vi du: 108.458313"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  fontSize: typography.sizes.xs,
                  color: colors.textSecondary,
                  marginTop: -spacing[2],
                }}
              >
                Nhap toa do de hien thi ban do vung trong trong web va app Flutter.
              </div>

              <FarmingAreaMap
                coordinates={previewCoordinates}
                address={formData.address}
                title="Xem truoc vi tri vung trong"
                height={260}
              />

              <div style={{ display: 'flex', gap: spacing[3] }}>
                <button
                  type="submit"
                  style={{
                    background: colors.primary[600],
                    color: 'white',
                    border: 'none',
                    borderRadius: borderRadius.lg,
                    padding: `${spacing[3]} ${spacing[5]}`,
                    fontWeight: typography.weights.semibold,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                  disabled={submitting}
                >
                  {submitting
                    ? 'Dang luu...'
                    : editingId
                    ? 'Cap nhat'
                    : 'Them moi'}
                </button>
                <button
                  type="button"
                  style={{
                    background: colors.neutral[200],
                    color: colors.textSecondary,
                    border: 'none',
                    borderRadius: borderRadius.lg,
                    padding: `${spacing[3]} ${spacing[5]}`,
                    fontWeight: typography.weights.medium,
                    cursor: 'pointer',
                  }}
                  onClick={resetForm}
                >
                  Huy
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: colors.textSecondary }}>Dang tai...</p>
      ) : areas.length === 0 ? (
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.neutral[200]}`,
            borderRadius: borderRadius.xl,
            padding: spacing[8],
            textAlign: 'center',
          }}
        >
          <p style={{ color: colors.textSecondary, margin: 0 }}>
            Chua co vung trong nao
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: spacing[5],
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          }}
        >
          {areas.map((area) => (
            <div
              key={area._id}
              style={{
                background: colors.surface,
                border: `1px solid ${colors.neutral[200]}`,
                borderRadius: borderRadius.xl,
                padding: spacing[5],
                boxShadow: shadows.sm,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: spacing[3],
                  gap: spacing[3],
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: typography.sizes.lg,
                    fontWeight: typography.weights.semibold,
                  }}
                >
                  {area.name}
                </h3>
                <span
                  style={{
                    background:
                      area.status === 'active'
                        ? colors.primary[100]
                        : colors.neutral[100],
                    color:
                      area.status === 'active'
                        ? colors.primary[700]
                        : colors.textSecondary,
                    padding: `${spacing[1]} ${spacing[3]}`,
                    borderRadius: borderRadius.full,
                    fontSize: typography.sizes.xs,
                    fontWeight: typography.weights.semibold,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {area.status === 'active' ? 'Hoat dong' : 'Ngung'}
                </span>
              </div>

              <p
                style={{
                  color: colors.textSecondary,
                  margin: `0 0 ${spacing[2]}`,
                  fontSize: typography.sizes.sm,
                }}
              >
                📍 {area.address}
              </p>

              {area.area_size && (
                <p style={{ margin: `0 0 ${spacing[2]}`, fontSize: typography.sizes.sm }}>
                  📐 Dien tich: <strong>{area.area_size} ha</strong>
                </p>
              )}

              {area.description && (
                <p
                  style={{
                    margin: `0 0 ${spacing[3]}`,
                    fontSize: typography.sizes.sm,
                    color: colors.textSecondary,
                  }}
                >
                  {area.description}
                </p>
              )}

              <div style={{ marginBottom: spacing[4] }}>
                <FarmingAreaMap
                  coordinates={area.coordinates}
                  address={area.address}
                  title="Ban do vung trong"
                  height={200}
                />
              </div>

              {area.certifications && area.certifications.length > 0 && (
                <div style={{ marginBottom: spacing[4] }}>
                  <p
                    style={{
                      margin: `0 0 ${spacing[2]}`,
                      fontSize: typography.sizes.xs,
                      color: colors.textSecondary,
                      fontWeight: typography.weights.medium,
                    }}
                  >
                    🏆 CHUNG NHAN
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                    {area.certifications.map((cert) => {
                      const certColor =
                        certTypeColors[cert.type] || certTypeColors.Other;
                      const isExpired = cert.status === 'expired';

                      return (
                        <span
                          key={cert._id}
                          title={`${cert.name}${isExpired ? ' (Het han)' : ''}`}
                          style={{
                            background: isExpired
                              ? colors.neutral[100]
                              : certColor.bg,
                            color: isExpired
                              ? colors.neutral[500]
                              : certColor.text,
                            padding: `${spacing[1]} ${spacing[3]}`,
                            borderRadius: borderRadius.full,
                            fontSize: typography.sizes.xs,
                            fontWeight: typography.weights.semibold,
                            textDecoration: isExpired ? 'line-through' : 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: spacing[1],
                          }}
                        >
                          {cert.type}
                          {isExpired && <span style={{ fontSize: 10 }}>⚠️</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <p
                style={{
                  fontSize: typography.sizes.xs,
                  color: colors.neutral[400],
                  margin: `0 0 ${spacing[3]}`,
                }}
              >
                👤 Chu so huu: {area.owner?.first_name} {area.owner?.last_name}
              </p>

              <div style={{ display: 'flex', gap: spacing[3] }}>
                <button
                  onClick={() => handleEdit(area)}
                  style={{
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: borderRadius.md,
                    padding: `${spacing[2]} ${spacing[4]}`,
                    fontSize: typography.sizes.sm,
                    fontWeight: typography.weights.medium,
                    cursor: 'pointer',
                  }}
                >
                  Sua
                </button>
                <button
                  onClick={() => handleDelete(area._id)}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: borderRadius.md,
                    padding: `${spacing[2]} ${spacing[4]}`,
                    fontSize: typography.sizes.sm,
                    fontWeight: typography.weights.medium,
                    cursor: 'pointer',
                  }}
                >
                  Xoa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmingAreaPage;
