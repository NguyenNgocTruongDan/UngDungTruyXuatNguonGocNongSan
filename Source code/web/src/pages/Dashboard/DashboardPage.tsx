import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../../core/api/product.api';
import { farmingAreaApi, FarmingArea as FarmingAreaType } from '../../core/api/farmingArea.api';
import { colors, spacing, borderRadius, shadows, typography } from '../../core/theme';
import type { Product } from '../../core/types';

type ProductionType = 'Plant' | 'Animal';
type CategoryStore = Record<ProductionType, string[]>;

const CATEGORY_STORAGE_KEY = 'agri-trace-category-options-v1';

const statusLabel: Record<string, string> = {
  draft: 'Nháp',
  active: 'Đang theo dõi',
  completed: 'Hoàn tất',
};

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: colors.neutral[100], text: colors.neutral[600] },
  active: { bg: colors.primary[100], text: colors.primary[700] },
  completed: { bg: '#dbeafe', text: '#1d4ed8' },
};

const productionTypeMeta: Record<
  ProductionType,
  { label: string; subtitle: string; startLabel: string; placeholder: string; icon: string }
> = {
  Plant: {
    label: 'Trồng trọt',
    subtitle: 'Dùng cho rau, củ, quả, nấm, ngũ cốc...',
    startLabel: 'Ngày bắt đầu gieo trồng',
    placeholder: 'Ví dụ: Xà lách lứa tháng 3',
    icon: '🌱',
  },
  Animal: {
    label: 'Chăn nuôi',
    subtitle: 'Dùng cho gia súc, gia cầm, thủy sản...',
    startLabel: 'Ngày bắt đầu nuôi / nhập đàn',
    placeholder: 'Ví dụ: Gà ta lứa tháng 3',
    icon: '🐔',
  },
};

const defaultCategoryOptions: CategoryStore = {
  Plant: ['Rau ăn lá', 'Rau củ', 'Trái cây', 'Ngũ cốc', 'Nấm', 'Khác'],
  Animal: ['Gia cầm', 'Gia súc', 'Thủy sản', 'Sữa / Trứng', 'Mật ong', 'Khác'],
};

const StatCard: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = colors.textPrimary }) => (
  <div style={{
    background: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    boxShadow: shadows.sm,
    border: `1px solid ${colors.neutral[200]}`,
  }}>
    <p style={{ margin: 0, fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing[1] }}>{label}</p>
    <p style={{ margin: 0, fontSize: typography.sizes['3xl'], fontWeight: typography.weights.bold, color }}>{value}</p>
  </div>
);

const fieldStyle: React.CSSProperties = {
  padding: `${spacing[3]} ${spacing[4]}`,
  borderRadius: borderRadius.lg,
  border: `1px solid ${colors.neutral[300]}`,
  fontSize: typography.sizes.base,
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

const secondaryButtonStyle: React.CSSProperties = {
  border: `1px solid ${colors.neutral[300]}`,
  background: colors.surface,
  color: colors.textSecondary,
  borderRadius: borderRadius.lg,
  padding: `${spacing[3]} ${spacing[4]}`,
  cursor: 'pointer',
  fontWeight: typography.weights.medium,
  fontSize: typography.sizes.sm,
  transition: 'all 0.2s ease',
};

const ghostButtonStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: colors.primary[600],
  borderRadius: borderRadius.md,
  padding: `${spacing[2]} ${spacing[3]}`,
  cursor: 'pointer',
  fontWeight: typography.weights.medium,
  fontSize: typography.sizes.sm,
};

const thStyle: React.CSSProperties = {
  padding: `${spacing[3]} ${spacing[4]}`,
  textAlign: 'left',
  fontWeight: typography.weights.semibold,
  color: colors.textSecondary,
  fontSize: typography.sizes.sm,
  borderBottom: `1px solid ${colors.neutral[200]}`,
};

const tdStyle: React.CSSProperties = {
  padding: `${spacing[4]} ${spacing[4]}`,
  borderBottom: `1px solid ${colors.neutral[100]}`,
  fontSize: typography.sizes.sm,
};

const normalizeGroupName = (value: string) => value.trim().replace(/\s+/g, ' ');

const loadCategoryOptions = (): CategoryStore => {
  if (typeof window === 'undefined') {
    return defaultCategoryOptions;
  }

  try {
    const raw = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!raw) return defaultCategoryOptions;

    const parsed = JSON.parse(raw) as Partial<CategoryStore>;

    return {
      Plant:
        parsed.Plant?.map(normalizeGroupName).filter(Boolean) ?? defaultCategoryOptions.Plant,
      Animal:
        parsed.Animal?.map(normalizeGroupName).filter(Boolean) ?? defaultCategoryOptions.Animal,
    };
  } catch {
    return defaultCategoryOptions;
  }
};

const formatDate = (value?: string) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
};

const DashboardPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [farmingAreas, setFarmingAreas] = useState<FarmingAreaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [groupError, setGroupError] = useState('');
  const [groupSuccess, setGroupSuccess] = useState('');
  const [categoryOptions, setCategoryOptions] =
    useState<CategoryStore>(loadCategoryOptions);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const groupMenuRef = useRef<HTMLDivElement | null>(null);
  const [formData, setFormData] = useState({
    type: 'Plant' as ProductionType,
    category: loadCategoryOptions().Plant[0] ?? '',
    name: '',
    farmingAreaId: '',
    origin: '',
    cultivationTime: '',
    note: '',
  });

  useEffect(() => {
    let mounted = true;

    Promise.all([
      productApi.getAll(),
      farmingAreaApi.getAll(),
    ])
      .then(([productRes, farmingAreaRes]) => {
        if (!mounted) return;
        setProducts(productRes.data.products);
        setFarmingAreas(farmingAreaRes.data.farmingAreas || []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Lỗi tải dữ liệu');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categoryOptions));
  }, [categoryOptions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!groupMenuRef.current) return;
      if (!groupMenuRef.current.contains(event.target as Node)) {
        setIsGroupMenuOpen(false);
        setEditingGroup(null);
        setEditingGroupName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const options = categoryOptions[formData.type];
    if (!options.includes(formData.category)) {
      setFormData((prev) => ({
        ...prev,
        category: options[0] ?? '',
      }));
    }
  }, [categoryOptions, formData.category, formData.type]);

  const active = useMemo(
    () => products.filter((p) => p.status === 'active').length,
    [products]
  );
  const completed = useMemo(
    () => products.filter((p) => p.status === 'completed').length,
    [products]
  );

  const productionMeta = productionTypeMeta[formData.type];
  const currentGroupOptions = categoryOptions[formData.type];

  const handleChange =
    (field: keyof typeof formData) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleFarmingAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const areaId = e.target.value;
    const selectedArea = farmingAreas.find((area) => area._id === areaId);
    setFormData((prev) => ({
      ...prev,
      farmingAreaId: areaId,
      origin: selectedArea?.address || prev.origin,
    }));
  };

  const handleTypeChange = (type: ProductionType) => {
    setGroupError('');
    setGroupSuccess('');
    setEditingGroup(null);
    setEditingGroupName('');
    setIsGroupMenuOpen(false);
    setFormData((prev) => ({
      ...prev,
      type,
      category: categoryOptions[type][0] ?? '',
    }));
  };

  const buildDescription = () => {
    if (formData.note.trim()) return formData.note.trim();

    const prefix =
      formData.type === 'Plant'
        ? `Lô trồng ${formData.name.trim()}`
        : `Lô nuôi ${formData.name.trim()}`;
    const group = formData.category ? `thuộc nhóm ${formData.category}` : '';
    const location = formData.origin.trim() ? `tại ${formData.origin.trim()}` : '';
    const date = formData.cultivationTime
      ? `bắt đầu ${formatDate(formData.cultivationTime)}`
      : '';

    return [prefix, group, location, date].filter(Boolean).join(', ');
  };

  const handleAddGroup = () => {
    const normalizedName = normalizeGroupName(newGroupName);
    setGroupError('');
    setGroupSuccess('');

    if (!normalizedName) {
      setGroupError('Nhập tên nhóm sản phẩm trước khi thêm.');
      return;
    }

    const duplicated = currentGroupOptions.some(
      (item) => item.toLowerCase() === normalizedName.toLowerCase()
    );
    if (duplicated) {
      setGroupError('Nhóm sản phẩm này đã tồn tại.');
      return;
    }

    const nextOptions = [...currentGroupOptions, normalizedName];
    setCategoryOptions((prev) => ({
      ...prev,
      [formData.type]: nextOptions,
    }));
    setFormData((prev) => ({
      ...prev,
      category: normalizedName,
    }));
    setNewGroupName('');
    setGroupSuccess(`Đã thêm nhóm "${normalizedName}".`);
  };

  const handleStartEditGroup = (groupName: string) => {
    setGroupError('');
    setGroupSuccess('');
    setEditingGroup(groupName);
    setEditingGroupName(groupName);
  };

  const handleSaveGroup = (groupName: string) => {
    const normalizedName = normalizeGroupName(editingGroupName);
    setGroupError('');
    setGroupSuccess('');

    if (!normalizedName) {
      setGroupError('Tên nhóm sản phẩm không được để trống.');
      return;
    }

    const duplicated = currentGroupOptions.some(
      (item) =>
        item.toLowerCase() === normalizedName.toLowerCase() &&
        item.toLowerCase() !== groupName.toLowerCase()
    );
    if (duplicated) {
      setGroupError('Tên nhóm mới đang trùng với một nhóm đã có.');
      return;
    }

    const nextOptions = currentGroupOptions.map((item) =>
      item === groupName ? normalizedName : item
    );
    setCategoryOptions((prev) => ({
      ...prev,
      [formData.type]: nextOptions,
    }));
    setFormData((prev) => ({
      ...prev,
      category: prev.category === groupName ? normalizedName : prev.category,
    }));
    setEditingGroup(null);
    setEditingGroupName('');
    setGroupSuccess(`Đã cập nhật nhóm thành "${normalizedName}".`);
  };

  const handleSelectGroup = (groupName: string) => {
    setGroupError('');
    setGroupSuccess('');
    setFormData((prev) => ({
      ...prev,
      category: groupName,
    }));
    setIsGroupMenuOpen(false);
    setEditingGroup(null);
    setEditingGroupName('');
  };

  const handleDeleteGroup = (groupName: string) => {
    setGroupError('');
    setGroupSuccess('');

    const nextOptions = currentGroupOptions.filter((item) => item !== groupName);
    setCategoryOptions((prev) => ({
      ...prev,
      [formData.type]: nextOptions,
    }));
    setFormData((prev) => ({
      ...prev,
      category: prev.category === groupName ? nextOptions[0] ?? '' : prev.category,
    }));
    setEditingGroup((prev) => (prev === groupName ? null : prev));
    setEditingGroupName('');
    setGroupSuccess(`Đã xóa nhóm "${groupName}".`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!formData.category.trim()) {
      setSubmitError('Vui lòng tạo hoặc chọn một nhóm sản phẩm.');
      return;
    }

    if (!formData.name.trim() || !formData.origin.trim()) {
      setSubmitError('Vui lòng nhập tên lô và nơi sản xuất.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await productApi.create({
        name: formData.name.trim(),
        category: formData.category,
        type: formData.type,
        description: buildDescription(),
        origin: formData.origin.trim(),
        cultivation_time: formData.cultivationTime || undefined,
        farming_area: formData.farmingAreaId || undefined,
      });

      setProducts((prev) => [data.product, ...prev]);
      setFormData((prev) => ({
        ...prev,
        category: categoryOptions[prev.type][0] ?? '',
        name: '',
        farmingAreaId: '',
        origin: '',
        cultivationTime: '',
        note: '',
      }));
      setSubmitSuccess('Tạo lô nông sản thành công.');
    } catch (err: any) {
      setSubmitError(err.message || 'Không tạo được lô hàng.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <p style={{ color: colors.textSecondary }}>Đang tải...</p>
    </div>
  );
  if (error) return (
    <div style={{ padding: spacing[6], background: '#fef2f2', borderRadius: borderRadius.lg, color: colors.error }}>
      Lỗi: {error}
    </div>
  );

  return (
    <div>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing[8],
        gap: spacing[4],
        flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: typography.sizes['3xl'], 
            fontWeight: typography.weights.bold,
            color: colors.textPrimary,
          }}>
            Lô nông sản
          </h1>
          <p style={{ margin: `${spacing[2]} 0 0`, color: colors.textSecondary, fontSize: typography.sizes.base }}>
            Tạo lô mới và quản lý truy xuất nguồn gốc
          </p>
        </div>
        <Link
          to="/add-event"
          style={{
            padding: `${spacing[3]} ${spacing[5]}`,
            borderRadius: borderRadius.lg,
            background: colors.primary[600],
            color: 'white',
            textDecoration: 'none',
            fontWeight: typography.weights.semibold,
            fontSize: typography.sizes.sm,
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing[2],
          }}
        >
          <span>+</span> Ghi sự kiện
        </Link>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: spacing[4], marginBottom: spacing[8] }}>
        <StatCard label="Tổng lô hàng" value={products.length} />
        <StatCard label="Đang theo dõi" value={active} color={colors.primary[600]} />
        <StatCard label="Hoàn tất" value={completed} color="#2563eb" />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(360px, 480px) minmax(0, 1fr)',
        gap: spacing[6],
        alignItems: 'start',
      }}>
        {/* Create Form */}
        <form
          onSubmit={handleCreate}
          style={{
            background: colors.surface,
            borderRadius: borderRadius.xl,
            padding: spacing[6],
            boxShadow: shadows.md,
            border: `1px solid ${colors.neutral[200]}`,
            display: 'grid',
            gap: spacing[5],
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold }}>
              Tạo lô hàng mới
            </h2>
            <p style={{ margin: `${spacing[2]} 0 0`, color: colors.textSecondary, fontSize: typography.sizes.sm }}>
              Chọn mô hình sản xuất và nhập thông tin lô
            </p>
          </div>

          {/* Production Type Tabs */}
          <div style={{ display: 'grid', gap: spacing[2] }}>
            <span style={{ fontWeight: typography.weights.medium, fontSize: typography.sizes.sm }}>Mô hình sản xuất</span>
            <div style={{ display: 'flex', gap: spacing[3] }}>
              {(Object.keys(productionTypeMeta) as ProductionType[]).map((type) => {
                const activeTab = formData.type === type;
                const meta = productionTypeMeta[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    style={{
                      flex: 1,
                      padding: `${spacing[4]} ${spacing[4]}`,
                      borderRadius: borderRadius.lg,
                      border: activeTab ? `2px solid ${colors.primary[600]}` : `1px solid ${colors.neutral[300]}`,
                      background: activeTab ? colors.primary[50] : colors.surface,
                      color: activeTab ? colors.primary[700] : colors.textSecondary,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{meta.label}</div>
                    <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                      {meta.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontWeight: 700 }}>Nhóm sản phẩm</span>
              <span style={{ color: '#6b7280', fontSize: 12 }}>
                Quản lý gọn ngay trong combobox
              </span>
            </div>

            <div
              ref={groupMenuRef}
              style={{
                position: 'relative',
              }}
            >
              <button
                type="button"
                onClick={() => setIsGroupMenuOpen((prev) => !prev)}
                style={{
                  ...fieldStyle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ color: formData.category ? '#111827' : '#94a3b8' }}>
                  {formData.category || 'Chưa có nhóm. Bấm để thêm nhóm mới'}
                </span>
                <span style={{ color: '#6b7280', fontSize: 18 }}>{isGroupMenuOpen ? '▴' : '▾'}</span>
              </button>

              {isGroupMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    zIndex: 10,
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #d1d5db',
                    borderRadius: 14,
                    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.14)',
                    padding: 14,
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder={
                        formData.type === 'Plant'
                          ? 'Ví dụ: Rau ăn lá hữu cơ'
                          : 'Ví dụ: Gà thả vườn'
                      }
                      style={{ ...fieldStyle, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleAddGroup}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 10,
                        border: 'none',
                        background: '#166534',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Thêm
                    </button>
                  </div>

                  <div
                    style={{
                      maxHeight: 260,
                      overflowY: 'auto',
                      display: 'grid',
                      gap: 8,
                    }}
                  >
                    {currentGroupOptions.length === 0 ? (
                      <div
                        style={{
                          border: '1px dashed #cbd5e1',
                          borderRadius: 10,
                          padding: 12,
                          color: '#64748b',
                          fontSize: 14,
                        }}
                      >
                        Chưa có nhóm nào cho mô hình này. Thêm nhóm đầu tiên để tạo lô.
                      </div>
                    ) : (
                      currentGroupOptions.map((item) => (
                        <div
                          key={item}
                          style={{
                            display: 'flex',
                            gap: 10,
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1px solid #e5e7eb',
                            borderRadius: 10,
                            padding: 10,
                            background: formData.category === item ? '#f0fdf4' : '#fff',
                          }}
                        >
                          {editingGroup === item ? (
                            <>
                              <input
                                value={editingGroupName}
                                onChange={(e) => setEditingGroupName(e.target.value)}
                                style={{ ...fieldStyle, flex: 1, padding: 10 }}
                                autoFocus
                              />
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  type="button"
                                  onClick={() => handleSaveGroup(item)}
                                  style={{
                                    ...ghostButtonStyle,
                                    color: '#166534',
                                    background: '#dcfce7',
                                  }}
                                >
                                  Lưu
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingGroup(null);
                                    setEditingGroupName('');
                                  }}
                                  style={ghostButtonStyle}
                                >
                                  Hủy
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSelectGroup(item)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  flex: 1,
                                  padding: 0,
                                  color: '#111827',
                                  fontWeight: formData.category === item ? 700 : 500,
                                }}
                              >
                                {item}
                              </button>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditGroup(item)}
                                  style={ghostButtonStyle}
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGroup(item)}
                                  style={{
                                    ...ghostButtonStyle,
                                    color: '#b91c1c',
                                  }}
                                >
                                  Xóa
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {groupError && (
                    <div
                      style={{
                        background: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        borderRadius: 10,
                        padding: 12,
                      }}
                    >
                      {groupError}
                    </div>
                  )}

                  {groupSuccess && (
                    <div
                      style={{
                        background: '#f0fdf4',
                        color: '#166534',
                        border: '1px solid #bbf7d0',
                        borderRadius: 10,
                        padding: 12,
                      }}
                    >
                      {groupSuccess}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Vùng trồng dropdown */}
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>Vùng trồng / Trang trại</span>
            <select
              value={formData.farmingAreaId}
              onChange={handleFarmingAreaChange}
              style={{ ...fieldStyle, background: colors.surface }}
            >
              <option value="">-- Chọn vùng trồng (tùy chọn) --</option>
              {farmingAreas.map((area) => (
                <option key={area._id} value={area._id}>
                  {area.name} - {area.address}
                </option>
              ))}
            </select>
            <span style={{ fontSize: typography.sizes.xs, color: colors.textSecondary }}>
              Chọn vùng trồng sẽ tự động điền nơi sản xuất
            </span>
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>Tên lô / sản phẩm chính</span>
            <input
              value={formData.name}
              onChange={handleChange('name')}
              placeholder={productionMeta.placeholder}
              style={fieldStyle}
            />
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>Nơi sản xuất</span>
              {formData.farmingAreaId && (
                <span style={{ fontSize: typography.sizes.xs, color: colors.primary[600] }}>
                  ✓ Từ vùng trồng
                </span>
              )}
            </div>
            <input
              value={formData.origin}
              onChange={handleChange('origin')}
              placeholder="Ví dụ: Đà Lạt, Lâm Đồng"
              style={{
                ...fieldStyle,
                background: formData.farmingAreaId ? colors.neutral[50] : colors.surface,
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>{productionMeta.startLabel}</span>
            <input
              type="date"
              value={formData.cultivationTime}
              onChange={handleChange('cultivationTime')}
              style={fieldStyle}
            />
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>Ghi chú lô</span>
            <textarea
              value={formData.note}
              onChange={handleChange('note')}
              rows={4}
              placeholder="Ví dụ: Lô demo cho tiểu luận, sản xuất theo quy trình VietGAP."
              style={{ ...fieldStyle, resize: 'vertical' }}
            />
          </label>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Tóm tắt sẽ lưu</div>
            <div style={{ color: '#475569', fontSize: 14, lineHeight: 1.5 }}>
              {formData.name.trim()
                ? buildDescription()
                : 'Nhập tên lô để xem mô tả tóm tắt.'}
            </div>
          </div>

          {submitError && (
            <div
              style={{
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                borderRadius: 10,
                padding: 12,
              }}
            >
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div
              style={{
                background: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0',
                borderRadius: 10,
                padding: 12,
              }}
            >
              {submitSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '12px 16px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              borderRadius: 10,
              border: 'none',
              background: submitting ? '#94a3b8' : '#166534',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            {submitting ? 'Đang tạo lô...' : 'Tạo lô hàng'}
          </button>
        </form>

        {products.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: '#6b7280',
              border: '2px dashed #e5e7eb',
              borderRadius: 12,
              background: '#fff',
            }}
          >
            <p style={{ fontSize: 18, marginTop: 0 }}>Chưa có lô hàng nào</p>
            <p style={{ marginBottom: 0 }}>Tạo lô đầu tiên bằng form bên trái.</p>
          </div>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: '#fff',
              borderRadius: 10,
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={thStyle}>Tên lô / sản phẩm</th>
                <th style={thStyle}>Nhóm</th>
                <th style={thStyle}>Mô hình</th>
                <th style={thStyle}>Nơi sản xuất</th>
                <th style={thStyle}>Ngày bắt đầu</th>
                <th style={thStyle}>Trạng thái</th>
                <th style={thStyle}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p._id} style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : undefined }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{p.category}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                    {p.type === 'Plant' ? 'Trồng trọt' : 'Chăn nuôi'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{p.origin}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                    {formatDate(p.cultivation_time)}
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        fontSize: typography.sizes.xs,
                        fontWeight: typography.weights.medium,
                        color: statusColors[p.status]?.text || colors.textSecondary,
                        background: statusColors[p.status]?.bg || colors.neutral[100],
                        padding: `${spacing[1]} ${spacing[3]}`,
                        borderRadius: borderRadius.full,
                      }}
                    >
                      {statusLabel[p.status] || p.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: spacing[3], alignItems: 'center' }}>
                      <Link to={`/trace/${p._id}`} style={{ color: colors.primary[600], fontSize: typography.sizes.sm, textDecoration: 'none', fontWeight: typography.weights.medium }}>
                        Xem trace
                      </Link>
                      <Link
                        to={`/add-event?productId=${p._id}`}
                        style={{ color: '#16a34a', fontSize: 13 }}
                      >
                        Ghi sự kiện
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
