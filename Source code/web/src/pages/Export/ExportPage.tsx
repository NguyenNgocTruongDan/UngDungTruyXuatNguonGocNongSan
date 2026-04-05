import React, { useEffect, useState } from 'react';
import { productApi } from '../../core/api/product.api';
import { exportApi, downloadBlob } from '../../core/api/export.api';
import type { Product } from '../../core/types';

const cardStyle: React.CSSProperties = { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 20 };
const buttonStyle: React.CSSProperties = { background: '#166534', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 };

const ExportPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => { productApi.getAll().then(({ data }) => setProducts(data.products)).catch((err) => setError(err.message)).finally(() => setLoading(false)); }, []);

  const handleExport = async (type: string, productId?: string) => {
    setExporting(type + (productId || '')); setError(''); setSuccess('');
    try {
      let blob: Blob; let filename: string;
      switch (type) {
        case 'product-pdf': if (!productId) return; blob = (await exportApi.getProductPdf(productId)).data; filename = `product-${productId}.pdf`; break;
        case 'timeline-pdf': if (!productId) return; blob = (await exportApi.getTimelinePdf(productId)).data; filename = `timeline-${productId}.pdf`; break;
        case 'qr': if (!productId) return; blob = (await exportApi.getQrCode(productId)).data; filename = `qr-${productId}.png`; break;
        case 'products-excel': blob = (await exportApi.getProductsExcel()).data; filename = `products-${new Date().toISOString().split('T')[0]}.xlsx`; break;
        case 'qr-batch': if (selectedProducts.length === 0) { setError('Chon it nhat mot san pham'); return; } blob = (await exportApi.getQrCodesBatch(selectedProducts)).data; filename = `qr-batch.pdf`; break;
        default: return;
      }
      downloadBlob(blob, filename); setSuccess(`Da tai xuong ${filename}`);
    } catch (err: any) { setError(err.message || 'Xuat file that bai'); }
    finally { setExporting(null); }
  };

  const toggleProductSelection = (productId: string) => setSelectedProducts((prev) => prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]);
  const selectAll = () => setSelectedProducts(selectedProducts.length === products.length ? [] : products.map((p) => p._id));

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>Xuat bao cao</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Xuat du lieu ra PDF, Excel hoac QR Code</p>
      {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ background: '#f0fdf4', color: '#166534', padding: 12, borderRadius: 8, marginBottom: 16 }}>{success}</div>}

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Xuat nhanh</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button style={buttonStyle} onClick={() => handleExport('products-excel')} disabled={exporting === 'products-excel'}>📊 {exporting === 'products-excel' ? 'Dang xuat...' : 'Xuat danh sach lo (Excel)'}</button>
          <button style={{ ...buttonStyle, background: '#7c3aed' }} onClick={() => handleExport('qr-batch')} disabled={exporting === 'qr-batch' || selectedProducts.length === 0}>📱 {exporting === 'qr-batch' ? 'Dang xuat...' : `Xuat QR hang loat (${selectedProducts.length} da chon)`}</button>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Chon lo de xuat</h2>
          <button onClick={selectAll} style={{ ...buttonStyle, background: '#6b7280', padding: '8px 12px' }}>{selectedProducts.length === products.length ? 'Bo chon tat ca' : 'Chon tat ca'}</button>
        </div>
        {loading ? <p>Dang tai...</p> : products.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center' }}>Chua co lo nong san</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: 10, textAlign: 'left', width: 40 }}><input type="checkbox" checked={selectedProducts.length === products.length} onChange={selectAll} /></th><th style={{ padding: 10, textAlign: 'left' }}>Ten lo</th><th style={{ padding: 10, textAlign: 'left' }}>Danh muc</th><th style={{ padding: 10, textAlign: 'left' }}>Trang thai</th><th style={{ padding: 10, textAlign: 'left' }}>Xuat rieng</th></tr></thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 10 }}><input type="checkbox" checked={selectedProducts.includes(product._id)} onChange={() => toggleProductSelection(product._id)} /></td>
                  <td style={{ padding: 10, fontWeight: 600 }}>{product.name}</td>
                  <td style={{ padding: 10 }}>{product.category}</td>
                  <td style={{ padding: 10 }}><span style={{ background: product.status === 'active' ? '#dcfce7' : '#f3f4f6', color: product.status === 'active' ? '#166534' : '#6b7280', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{product.status}</span></td>
                  <td style={{ padding: 10 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => handleExport('product-pdf', product._id)} disabled={!!exporting} style={{ ...buttonStyle, padding: '6px 10px', fontSize: 12 }} title="Xuat PDF">📄 PDF</button>
                      <button onClick={() => handleExport('timeline-pdf', product._id)} disabled={!!exporting} style={{ ...buttonStyle, padding: '6px 10px', fontSize: 12, background: '#2563eb' }} title="Timeline">📋 Timeline</button>
                      <button onClick={() => handleExport('qr', product._id)} disabled={!!exporting} style={{ ...buttonStyle, padding: '6px 10px', fontSize: 12, background: '#7c3aed' }} title="QR Code">📱 QR</button>
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

export default ExportPage;
