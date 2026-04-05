import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import QRCode from 'qrcode';
import { Readable } from 'stream';
import Product from '../models/Product';
import TraceEvent from '../models/TraceEvent';
import { NotFoundError } from '../utils/errors';
import env from '../config/env';

interface ProductFilter {
  status?: string;
  category?: string;
  type?: string;
  created_by?: string;
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getBlockchainStatus = (event: any): string => {
  switch (event.onChainStatus) {
    case 'confirmed':
      return 'Đã xác thực trên Blockchain';
    case 'pending':
      return 'Đang chờ xác thực';
    case 'failed':
      return 'Xác thực thất bại';
    case 'skipped':
      return 'Không ghi Blockchain';
    default:
      return 'Không xác định';
  }
};

const getEventTypeName = (eventType: string): string => {
  const typeNames: Record<string, string> = {
    SEEDING: 'Gieo hạt',
    FERTILIZING: 'Bón phân',
    WATERING: 'Tưới nước',
    PEST_CONTROL: 'Kiểm soát sâu bệnh',
    HARVESTING: 'Thu hoạch',
    PACKAGING: 'Đóng gói',
    SHIPPING: 'Vận chuyển',
  };
  return typeNames[eventType] || eventType;
};

export const exportProductToPDF = async (productId: string): Promise<Buffer> => {
  const product = await Product.findById(productId)
    .populate('created_by', 'first_name last_name email')
    .populate('farming_area', 'name location');

  if (!product) {
    throw new NotFoundError(`Không tìm thấy sản phẩm ${productId}`);
  }

  const events = await TraceEvent.find({ product: productId })
    .populate('recorded_by', 'first_name last_name')
    .sort({ createdAt: 1 });

  const traceUrl = `${env.FRONTEND_URL}/trace/${productId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(traceUrl, { width: 150, margin: 1 });
  const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('BÁO CÁO TRUY XUẤT NGUỒN GỐC', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Ngày tạo: ${formatDate(new Date())}`, { align: 'center' });
    doc.moveDown(2);

    // QR Code
    doc.image(qrCodeBuffer, doc.page.width - 150 - 50, 100, { width: 100 });
    doc.fontSize(8).text('Quét để xem chi tiết', doc.page.width - 150 - 50, 205, { width: 100, align: 'center' });

    // Product Information Section
    doc.fontSize(16).font('Helvetica-Bold').text('THÔNG TIN SẢN PHẨM', 50, 150);
    doc.moveTo(50, 170).lineTo(350, 170).stroke();
    doc.moveDown(0.5);

    const productInfo = [
      ['Tên sản phẩm:', product.name],
      ['Danh mục:', product.category],
      ['Loại:', product.type === 'Plant' ? 'Thực vật' : 'Động vật'],
      ['Nguồn gốc:', product.origin || 'Việt Nam'],
      ['Trạng thái:', product.status === 'active' ? 'Đang hoạt động' : product.status === 'completed' ? 'Hoàn thành' : 'Nháp'],
      ['Mã sản phẩm:', productId],
    ];

    if (product.cultivation_time) {
      productInfo.push(['Thời gian canh tác:', product.cultivation_time]);
    }

    const creator = product.created_by as any;
    if (creator) {
      productInfo.push(['Người tạo:', `${creator.first_name || ''} ${creator.last_name || ''}`.trim()]);
    }

    let yPos = 185;
    productInfo.forEach(([label, value]) => {
      doc.fontSize(11).font('Helvetica-Bold').text(label, 50, yPos);
      doc.font('Helvetica').text(String(value), 160, yPos);
      yPos += 18;
    });

    // Description
    if (product.description) {
      doc.moveDown(1);
      yPos = doc.y;
      doc.fontSize(11).font('Helvetica-Bold').text('Mô tả:', 50, yPos);
      doc.font('Helvetica').text(product.description, 50, yPos + 15, { width: 300 });
    }

    // Blockchain Status Section
    doc.moveDown(2);
    yPos = doc.y + 20;
    doc.fontSize(16).font('Helvetica-Bold').text('TRẠNG THÁI BLOCKCHAIN', 50, yPos);
    doc.moveTo(50, yPos + 20).lineTo(350, yPos + 20).stroke();

    const confirmedEvents = events.filter(e => e.onChainStatus === 'confirmed').length;
    const blockchainStatus = product.onChainBatchId ? 'Đã đăng ký trên Blockchain' : 'Chưa đăng ký';

    yPos += 35;
    doc.fontSize(11).font('Helvetica-Bold').text('Trạng thái:', 50, yPos);
    doc.font('Helvetica').text(blockchainStatus, 160, yPos);
    yPos += 18;

    if (product.onChainBatchId) {
      doc.font('Helvetica-Bold').text('Batch ID:', 50, yPos);
      doc.font('Helvetica').text(product.onChainBatchId, 160, yPos);
      yPos += 18;
    }

    doc.font('Helvetica-Bold').text('Sự kiện đã xác thực:', 50, yPos);
    doc.font('Helvetica').text(`${confirmedEvents}/${events.length}`, 160, yPos);

    // Timeline Section
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('LỊCH SỬ TRUY XUẤT', 50, 50);
    doc.moveTo(50, 70).lineTo(545, 70).stroke();
    doc.moveDown(1);

    if (events.length === 0) {
      doc.fontSize(12).font('Helvetica').text('Chưa có sự kiện nào được ghi nhận.', 50, 90);
    } else {
      yPos = 90;
      events.forEach((event, index) => {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        // Event box
        doc.rect(50, yPos, 495, 80).stroke();

        // Event number circle
        doc.circle(70, yPos + 40, 15).fill('#4A90A4');
        doc.fillColor('white').fontSize(12).font('Helvetica-Bold').text(String(index + 1), 63, yPos + 34);
        doc.fillColor('black');

        // Event details
        doc.fontSize(13).font('Helvetica-Bold').text(getEventTypeName(event.eventType), 95, yPos + 10, { width: 200 });
        doc.fontSize(10).font('Helvetica').text(formatDate(event.createdAt), 95, yPos + 28);

        const recorder = event.recorded_by as any;
        if (recorder) {
          doc.text(`Người ghi: ${recorder.first_name || ''} ${recorder.last_name || ''}`.trim(), 95, yPos + 42);
        }

        doc.text(event.description.substring(0, 60) + (event.description.length > 60 ? '...' : ''), 95, yPos + 56);

        // Blockchain status badge
        const statusText = getBlockchainStatus(event);
        const statusColor = event.onChainStatus === 'confirmed' ? '#27ae60' : event.onChainStatus === 'pending' ? '#f39c12' : '#e74c3c';
        doc.fillColor(statusColor).fontSize(9).text(statusText, 380, yPos + 10, { width: 150, align: 'right' });
        doc.fillColor('black');

        if (event.txHash) {
          doc.fontSize(8).text(`TX: ${event.txHash.substring(0, 20)}...`, 380, yPos + 25, { width: 150, align: 'right' });
        }

        yPos += 95;
      });
    }

    // Footer
    doc.fontSize(8).font('Helvetica').text(
      `Báo cáo được tạo tự động bởi hệ thống truy xuất nguồn gốc nông sản - ${formatDate(new Date())}`,
      50,
      doc.page.height - 50,
      { align: 'center', width: 495 }
    );

    doc.end();
  });
};

export const exportTraceTimeline = async (productId: string): Promise<Buffer> => {
  // This uses the same logic as exportProductToPDF but focuses more on the timeline
  return exportProductToPDF(productId);
};

export const exportProductsToExcel = async (filters: ProductFilter = {}): Promise<Buffer> => {
  const query: any = {};
  if (filters.status) query.status = filters.status;
  if (filters.category) query.category = filters.category;
  if (filters.type) query.type = filters.type;
  if (filters.created_by) query.created_by = filters.created_by;

  const products = await Product.find(query)
    .populate('created_by', 'first_name last_name email')
    .sort({ createdAt: -1 });

  const productIds = products.map(p => p._id);
  const eventCounts = await TraceEvent.aggregate([
    { $match: { product: { $in: productIds } } },
    { $group: { _id: '$product', count: { $sum: 1 } } },
  ]);

  const eventCountMap = new Map(eventCounts.map(e => [e._id.toString(), e.count]));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Hệ thống truy xuất nguồn gốc nông sản';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Danh sách sản phẩm');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 28 },
    { header: 'Tên sản phẩm', key: 'name', width: 30 },
    { header: 'Danh mục', key: 'category', width: 20 },
    { header: 'Loại', key: 'type', width: 15 },
    { header: 'Nguồn gốc', key: 'origin', width: 20 },
    { header: 'Trạng thái', key: 'status', width: 15 },
    { header: 'Ngày tạo', key: 'createdAt', width: 20 },
    { header: 'Số sự kiện', key: 'eventsCount', width: 12 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4A90A4' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add data rows
  products.forEach((product) => {
    const creator = product.created_by as any;
    const statusMap: Record<string, string> = {
      draft: 'Nháp',
      active: 'Đang hoạt động',
      completed: 'Hoàn thành',
    };

    worksheet.addRow({
      id: product._id.toString(),
      name: product.name,
      category: product.category,
      type: product.type === 'Plant' ? 'Thực vật' : 'Động vật',
      origin: product.origin || 'Việt Nam',
      status: statusMap[product.status] || product.status,
      createdAt: formatDate((product as any).createdAt),
      eventsCount: eventCountMap.get(product._id.toString()) || 0,
    });
  });

  // Style data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: 'middle' };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      // Alternate row colors
      if (rowNumber % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' },
        };
      }
    }
  });

  // Add summary at the bottom
  worksheet.addRow([]);
  const summaryRow = worksheet.addRow(['Tổng số sản phẩm:', products.length]);
  summaryRow.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

export const generateQRCode = async (productId: string): Promise<Buffer> => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new NotFoundError(`Không tìm thấy sản phẩm ${productId}`);
  }

  const traceUrl = `${env.FRONTEND_URL}/trace/${productId}`;
  const qrBuffer = await QRCode.toBuffer(traceUrl, {
    type: 'png',
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  return qrBuffer;
};

export const generateQRCodesBatch = async (productIds: string[]): Promise<Map<string, Buffer>> => {
  const products = await Product.find({ _id: { $in: productIds } });

  if (products.length === 0) {
    throw new NotFoundError('Không tìm thấy sản phẩm nào');
  }

  const qrCodes = new Map<string, Buffer>();

  for (const product of products) {
    const traceUrl = `${env.FRONTEND_URL}/trace/${product._id}`;
    const qrBuffer = await QRCode.toBuffer(traceUrl, {
      type: 'png',
      width: 400,
      margin: 2,
    });
    qrCodes.set(product._id.toString(), qrBuffer);
  }

  return qrCodes;
};

export const generateQRCodesPDFBatch = async (productIds: string[]): Promise<Buffer> => {
  const products = await Product.find({ _id: { $in: productIds } });

  if (products.length === 0) {
    throw new NotFoundError('Không tìm thấy sản phẩm nào');
  }

  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 30 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('MÃ QR SẢN PHẨM', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Ngày tạo: ${formatDate(new Date())}`, { align: 'center' });
    doc.moveDown(2);

    const qrSize = 150;
    const colWidth = 180;
    const rowHeight = 200;
    const cols = 3;
    const startX = 30;
    let currentCol = 0;
    let currentY = doc.y;

    for (const product of products) {
      if (currentY + rowHeight > doc.page.height - 50) {
        doc.addPage();
        currentY = 50;
        currentCol = 0;
      }

      const x = startX + (currentCol * colWidth);
      const traceUrl = `${env.FRONTEND_URL}/trace/${product._id}`;
      const qrDataUrl = await QRCode.toDataURL(traceUrl, { width: qrSize, margin: 1 });
      const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

      doc.image(qrBuffer, x + 15, currentY, { width: qrSize });
      doc.fontSize(9).font('Helvetica-Bold').text(
        product.name.substring(0, 20) + (product.name.length > 20 ? '...' : ''),
        x,
        currentY + qrSize + 5,
        { width: colWidth, align: 'center' }
      );
      doc.fontSize(7).font('Helvetica').text(
        product._id.toString().substring(0, 15) + '...',
        x,
        currentY + qrSize + 18,
        { width: colWidth, align: 'center' }
      );

      currentCol++;
      if (currentCol >= cols) {
        currentCol = 0;
        currentY += rowHeight;
      }
    }

    doc.end();
  });
};
