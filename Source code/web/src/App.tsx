import React, { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useSearchParams,
} from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import TraceDetailPage from './pages/TraceDetail/TraceDetailPage';
import { AuthProvider } from './core/context/AuthContext';
import { useAuth } from './core/hooks/useAuth';
import { productApi } from './core/api/product.api';
import { traceEventApi } from './core/api/traceEvent.api';
import type { EventType, Product, TraceEvent } from './core/types';

const eventTypeOptions: EventType[] = [
  'SEEDING',
  'FERTILIZING',
  'WATERING',
  'PEST_CONTROL',
  'HARVESTING',
  'PACKAGING',
  'SHIPPING',
];

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f7f8f4',
  color: '#172033',
};

const contentStyle: React.CSSProperties = {
  maxWidth: 1080,
  margin: '0 auto',
  padding: '24px 20px 40px',
};

const topNavLink = (active: boolean): React.CSSProperties => ({
  color: active ? '#14532d' : '#475569',
  textDecoration: 'none',
  fontWeight: 700,
  padding: '10px 14px',
  borderRadius: 9999,
  backgroundColor: active ? '#dcfce7' : 'transparent',
});

const ProtectedRoute: React.FC = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div style={{ padding: 24 }}>Dang tai...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const AppShell: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = useMemo(
    () => [
      { to: '/', label: 'Lo nong san' },
      { to: '/add-event', label: 'Ghi nhat ky' },
    ],
    []
  );

  return (
    <div style={shellStyle}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(12px)',
          background: 'rgba(247, 248, 244, 0.92)',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            ...contentStyle,
            paddingTop: 16,
            paddingBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>AgriTrace Web</div>
            <div style={{ color: '#64748b', fontSize: 13 }}>
              Ban thao tac nhanh cho lo nong san va truy xuat
            </div>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {navItems.map((item) => {
              const active = item.to === '/'
                ? location.pathname === '/' || location.pathname === '/products'
                : location.pathname.startsWith(item.to);
              return (
                <Link key={item.to} to={item.to} style={topNavLink(active)}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>Dang nhap boi</div>
              <div style={{ fontWeight: 700 }}>{user?.name || user?.email || 'Nguoi dung'}</div>
            </div>
            <button
              onClick={logout}
              style={{
                border: '1px solid #d1d5db',
                background: '#fff',
                borderRadius: 10,
                padding: '10px 14px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Dang xuat
            </button>
          </div>
        </div>
      </header>

      <main style={contentStyle}>
        <Outlet />
      </main>
    </div>
  );
};

const QuickAddEventPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TraceEvent | null>(null);
  const [productId, setProductId] = useState(searchParams.get('productId') || '');
  const [eventType, setEventType] = useState<EventType>('SEEDING');
  const [description, setDescription] = useState('');

  useEffect(() => {
    let mounted = true;

    productApi
      .getAll()
      .then((res) => {
        if (!mounted) return;
        const list = res.data.products;
        setProducts(list);
        if (!productId && list.length > 0) {
          setProductId(list[0]._id);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Khong tai duoc danh sach lo');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!productId || !description.trim()) {
      setError('Vui long chon lo va nhap mo ta su kien');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await traceEventApi.create({
        product: productId,
        eventType,
        description: description.trim(),
      });
      setResult(data);
      setDescription('');
      setEventType('SEEDING');
    } catch (err: any) {
      setError(err.message || 'Khong tao duoc su kien');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Ghi nhat ky canh tac</h1>
        <p style={{ margin: '8px 0 0', color: '#64748b' }}>
          Chon lo, ghi mo ta ngan gon, sau do gui len backend va blockchain.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 16,
          maxWidth: 760,
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div style={{ display: 'grid', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontWeight: 700 }}>Lo nong san</span>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={loading || products.length === 0}
                style={{ padding: 12, borderRadius: 10, border: '1px solid #d1d5db' }}
              >
                {products.length === 0 ? (
                  <option value="">Khong co lo nao</option>
                ) : (
                  products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} - {product.origin}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontWeight: 700 }}>Loai hanh dong</span>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                style={{ padding: 12, borderRadius: 10, border: '1px solid #d1d5db' }}
              >
                {eventTypeOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontWeight: 700 }}>Ghi chu</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Vi du: Bon phan dot 1, tuoi nuoc sang som, thu hoach ngay 11/03."
                style={{ padding: 12, borderRadius: 10, border: '1px solid #d1d5db', resize: 'vertical' }}
              />
            </label>

            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  color: '#b91c1c',
                  border: '1px solid #fecaca',
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                {error}
              </div>
            )}

            {result && (
              <div
                style={{
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Tao su kien thanh cong</div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  Trang thai blockchain: {result.onChainStatus}
                </div>
                {result.txHash && (
                  <div style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
                    Tx: {result.txHash}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || loading}
              style={{
                background: submitting ? '#94a3b8' : '#166534',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '12px 16px',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Dang ghi len blockchain...' : 'Gui su kien'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/trace/:productId" element={<TraceDetailPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="/products" element={<DashboardPage />} />
          <Route path="/add-event" element={<QuickAddEventPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
