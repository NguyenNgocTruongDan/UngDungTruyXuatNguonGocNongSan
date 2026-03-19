import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface Props {
  productId: string;
  productName?: string;
}

const QRCodeGenerator: React.FC<Props> = ({ productId, productName }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const traceUrl = `${window.location.origin}/trace/${productId}`;

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `qr-${productName || productId}.png`;
    link.href = url;
    link.click();
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div ref={canvasRef}>
        <QRCodeCanvas value={traceUrl} size={180} level="H" includeMargin />
      </div>
      <p style={{ fontSize: 11, color: '#999', marginTop: 4, wordBreak: 'break-all' }}>{traceUrl}</p>
      <button onClick={handleDownload} style={{ marginTop: 8, cursor: 'pointer', fontSize: 13 }}>
        ? T?i QR Code
      </button>
    </div>
  );
};

export default QRCodeGenerator;
