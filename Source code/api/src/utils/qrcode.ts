import QRCode from 'qrcode';

const generateQR = async (text: string): Promise<string> => {
  return QRCode.toDataURL(text, { width: 300, margin: 2 });
};

export default generateQR;
