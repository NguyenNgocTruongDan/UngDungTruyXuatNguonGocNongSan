import 'package:app/models/trace_event.dart';
import 'package:app/providers/providers.dart';
import 'package:app/widgets/blockchain_badge.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:timeline_tile/timeline_tile.dart';

// Màu sắc chủ đạo
const _primaryGreen = Color(0xFF166534);
const _lightGreen = Color(0xFFDCFCE7);
const _borderGreen = Color(0xFF86EFAC);
const _amberBg = Color(0xFFFEF3C7);
const _amberBorder = Color(0xFFFCD34D);
const _blueBg = Color(0xFFDBEAFE);
const _blueBorder = Color(0xFF93C5FD);
const _blueText = Color(0xFF1D4ED8);
const _purpleBg = Color(0xFFF3E8FF);
const _purpleBorder = Color(0xFFD8B4FE);
const _purpleText = Color(0xFF7C3AED);

class TraceTimelineScreen extends ConsumerWidget {
  const TraceTimelineScreen({super.key, required this.productId});

  final String productId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final traceAsync = ref.watch(fullTraceProvider(productId));
    final dateFmt = DateFormat('dd/MM/yyyy HH:mm');
    final shortDateFmt = DateFormat('dd/MM/yyyy');

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: traceAsync.when(
        loading: () => const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: _primaryGreen),
              SizedBox(height: 16),
              Text('Đang tải thông tin...', style: TextStyle(color: Colors.grey)),
            ],
          ),
        ),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(50),
                  ),
                  child: const Icon(Icons.error_outline, size: 48, color: Color(0xFFDC2626)),
                ),
                const SizedBox(height: 16),
                Text(
                  'Không tìm thấy thông tin',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFFDC2626),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '$err',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey[600], fontSize: 14),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Quay lại'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _primaryGreen,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        data: (trace) {
          final product = trace.product;
          final events = trace.events;
          final certs = product.farmingArea?['certifications'] as List? ?? [];
          
          // Tính toán thống kê
          final confirmedEvents = events.where((e) => e.onChainStatus == 'confirmed').length;
          final daysSinceCultivation = product.cultivationTime != null
              ? DateTime.now().difference(product.cultivationTime!).inDays
              : null;

          return CustomScrollView(
            slivers: [
              // Hero Section với gradient
              SliverToBoxAdapter(
                child: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF166534), Color(0xFF22C55E)],
                    ),
                  ),
                  child: SafeArea(
                    bottom: false,
                    child: Column(
                      children: [
                        // AppBar custom với nút share
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          child: Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.arrow_back, color: Colors.white),
                                onPressed: () => Navigator.of(context).pop(),
                              ),
                              const Expanded(
                                child: Text(
                                  'Truy xuất nguồn gốc',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                              // Nút Share
                              IconButton(
                                icon: const Icon(Icons.share, color: Colors.white),
                                onPressed: () => _shareProduct(context, product),
                              ),
                              // Nút QR
                              IconButton(
                                icon: const Icon(Icons.qr_code, color: Colors.white),
                                onPressed: () => _showQRDialog(context, product.batchId, product.name),
                              ),
                            ],
                          ),
                        ),
                        // Product Info
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Image
                              ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: product.images.isNotEmpty
                                    ? Image.network(
                                        product.images.first,
                                        width: 100,
                                        height: 100,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, __, ___) => _imagePlaceholder(),
                                      )
                                    : _imagePlaceholder(),
                              ),
                              const SizedBox(width: 16),
                              // Info
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Tên sản phẩm
                                    Text(
                                      product.name,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    // Badges row: Type + Status
                                    Row(
                                      children: [
                                        // Type badge
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: Colors.white.withValues(alpha: 0.2),
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Text(product.typeIcon, style: const TextStyle(fontSize: 14)),
                                              const SizedBox(width: 4),
                                              Text(
                                                product.typeLabel,
                                                style: const TextStyle(color: Colors.white, fontSize: 12),
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        // Status badge
                                        _buildStatusBadge(product.status),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    _heroInfoRow(Icons.category, product.category),
                                    _heroInfoRow(Icons.location_on, product.origin),
                                    if (product.cultivationTime != null)
                                      _heroInfoRow(Icons.calendar_today, 
                                        'Bắt đầu: ${shortDateFmt.format(product.cultivationTime!)}'),
                                    if (product.createdByName.isNotEmpty)
                                      _heroInfoRow(Icons.person, 'Tạo bởi: ${product.createdByName}'),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Cards Section
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // ===== CARD THỐNG KÊ TỔNG QUAN =====
                    _buildInfoCard(
                      icon: '📊',
                      title: 'Thống kê tổng quan',
                      color: _purpleBg,
                      borderColor: _purpleBorder,
                      child: Row(
                        children: [
                          Expanded(child: _buildStatItem('📋', '${events.length}', 'Sự kiện')),
                          Container(width: 1, height: 50, color: _purpleBorder),
                          Expanded(child: _buildStatItem('✅', '$confirmedEvents', 'Đã xác thực')),
                          Container(width: 1, height: 50, color: _purpleBorder),
                          Expanded(
                            child: _buildStatItem(
                              '📅', 
                              daysSinceCultivation != null ? '$daysSinceCultivation' : 'N/A', 
                              'Ngày canh tác'
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // ===== CARD MÃ LÔ SẢN PHẨM =====
                    _buildInfoCard(
                      icon: '🏷️',
                      title: 'Mã lô sản phẩm',
                      color: _lightGreen,
                      borderColor: _borderGreen,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          GestureDetector(
                            onTap: () {
                              Clipboard.setData(ClipboardData(text: product.batchId));
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Đã sao chép mã lô!')),
                              );
                            },
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: _borderGreen),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.qr_code, color: _primaryGreen, size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      product.batchId,
                                      style: const TextStyle(
                                        fontFamily: 'monospace',
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                  const Icon(Icons.copy, color: Colors.grey, size: 16),
                                ],
                              ),
                            ),
                          ),
                          if (product.description != null && product.description!.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Text(
                              product.description!,
                              style: TextStyle(color: Colors.grey[700], fontSize: 13),
                            ),
                          ],
                          if (product.createdAt != null) ...[
                            const SizedBox(height: 8),
                            Text(
                              'Ngày tạo: ${shortDateFmt.format(product.createdAt!)}',
                              style: TextStyle(color: Colors.grey[500], fontSize: 12),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // ===== CARD VÙNG CANH TÁC =====
                    if (product.farmingArea != null)
                      _buildInfoCard(
                        icon: '🌾',
                        title: 'Vùng canh tác',
                        color: _amberBg,
                        borderColor: _amberBorder,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _detailRow('Tên vùng', product.farmingArea!['name'] ?? 'N/A'),
                            _detailRow('Địa chỉ', product.farmingArea!['address'] ?? 'N/A'),
                            if (product.farmingArea!['area_size'] != null)
                              _detailRow('Diện tích', '${product.farmingArea!['area_size']} ha'),
                            if (product.farmingArea!['owner'] != null)
                              _detailRow('Chủ sở hữu', 
                                '${product.farmingArea!['owner']['first_name'] ?? ''} ${product.farmingArea!['owner']['last_name'] ?? ''}'),
                          ],
                        ),
                      ),
                    if (product.farmingArea != null) const SizedBox(height: 12),

                    // ===== CARD CHỨNG NHẬN CHẤT LƯỢNG =====
                    if (certs.isNotEmpty)
                      _buildInfoCard(
                        icon: '📜',
                        title: 'Chứng nhận chất lượng (${certs.length})',
                        color: _lightGreen,
                        borderColor: _borderGreen,
                        child: Column(
                          children: certs.map<Widget>((cert) {
                            final isValid = cert['status'] == 'valid';
                            String icon = '📋';
                            if (cert['type'] == 'VietGAP') icon = '🇻🇳';
                            if (cert['type'] == 'GlobalGAP') icon = '🌍';
                            if (cert['type'] == 'Organic') icon = '🌿';
                            
                            // Parse expiry date
                            DateTime? expiryDate;
                            if (cert['expiry_date'] != null) {
                              expiryDate = DateTime.tryParse(cert['expiry_date'].toString());
                            }
                            final daysUntilExpiry = expiryDate != null 
                                ? expiryDate.difference(DateTime.now()).inDays 
                                : null;
                            final isExpiringSoon = daysUntilExpiry != null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;
                            
                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: isValid ? _primaryGreen : const Color(0xFFDC2626),
                                  width: 2,
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(icon, style: const TextStyle(fontSize: 28)),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              cert['name'] ?? cert['type'],
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              'Số: ${cert['certificate_number'] ?? 'N/A'}',
                                              style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                                            ),
                                            Text(
                                              'Cấp bởi: ${cert['issuing_authority'] ?? 'N/A'}',
                                              style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: isValid ? _lightGreen : const Color(0xFFFEE2E2),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          isValid ? '✓ Hợp lệ' : '✗ Hết hạn',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: isValid ? _primaryGreen : const Color(0xFFDC2626),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  // Hiển thị ngày hết hạn
                                  if (expiryDate != null) ...[
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: isExpiringSoon ? const Color(0xFFFEF3C7) : Colors.grey[100],
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            isExpiringSoon ? Icons.warning_amber : Icons.event,
                                            size: 14,
                                            color: isExpiringSoon ? const Color(0xFFD97706) : Colors.grey[600],
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Hết hạn: ${shortDateFmt.format(expiryDate)}',
                                            style: TextStyle(
                                              fontSize: 11,
                                              color: isExpiringSoon ? const Color(0xFFD97706) : Colors.grey[600],
                                              fontWeight: isExpiringSoon ? FontWeight.bold : FontWeight.normal,
                                            ),
                                          ),
                                          if (isExpiringSoon) ...[
                                            const SizedBox(width: 4),
                                            Text(
                                              '(còn $daysUntilExpiry ngày)',
                                              style: const TextStyle(
                                                fontSize: 10,
                                                color: Color(0xFFD97706),
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                  ],
                                  // Hiển thị scope nếu có
                                  if (cert['scope'] != null && cert['scope'].toString().isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      'Phạm vi: ${cert['scope']}',
                                      style: TextStyle(fontSize: 11, color: Colors.grey[600], fontStyle: FontStyle.italic),
                                    ),
                                  ],
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    if (certs.isNotEmpty) const SizedBox(height: 12),

                    // ===== CARD BLOCKCHAIN =====
                    _buildInfoCard(
                      icon: '⛓️',
                      title: 'Xác thực Blockchain',
                      color: _blueBg,
                      borderColor: _blueBorder,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(
                                  trace.onChain != null ? Icons.verified : Icons.pending,
                                  color: trace.onChain != null ? _blueText : Colors.grey,
                                  size: 28,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      trace.onChain != null 
                                          ? 'Đã xác thực trên Blockchain'
                                          : 'Chưa có dữ liệu Blockchain',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: trace.onChain != null ? _blueText : Colors.grey[600],
                                      ),
                                    ),
                                    if (trace.onChain != null) ...[
                                      const SizedBox(height: 4),
                                      Text(
                                        '${trace.onChain!.actionCount} sự kiện đã ghi',
                                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),
                          if (trace.onChain != null) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: _blueBorder),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _detailRow('Batch ID', trace.onChain!.batchId),
                                  if (trace.onChain!.owner.isNotEmpty)
                                    _detailRow('Owner', _truncateAddress(trace.onChain!.owner)),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ===== TIMELINE HEADER =====
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: _primaryGreen,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.timeline, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Lịch sử truy xuất',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _lightGreen,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '${events.length} sự kiện',
                            style: const TextStyle(
                              color: _primaryGreen,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // ===== TIMELINE =====
                    if (events.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          children: [
                            Icon(Icons.history, size: 48, color: Colors.grey[400]),
                            const SizedBox(height: 12),
                            Text(
                              'Chưa có sự kiện nào',
                              style: TextStyle(color: Colors.grey[600], fontSize: 14),
                            ),
                          ],
                        ),
                      )
                    else
                      ...List.generate(events.length, (i) {
                        final evt = events[i];
                        final isFirst = i == 0;
                        final isLast = i == events.length - 1;
                        final isConfirmed = evt.onChainStatus == 'confirmed';

                        return TimelineTile(
                          isFirst: isFirst,
                          isLast: isLast,
                          indicatorStyle: IndicatorStyle(
                            width: 36,
                            height: 36,
                            indicator: Container(
                              decoration: BoxDecoration(
                                color: isConfirmed ? _primaryGreen : Colors.grey[400],
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: (isConfirmed ? _primaryGreen : Colors.grey).withValues(alpha: 0.3),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Center(
                                child: Text(
                                  evt.eventIcon,
                                  style: const TextStyle(fontSize: 16),
                                ),
                              ),
                            ),
                          ),
                          beforeLineStyle: LineStyle(
                            color: _primaryGreen.withValues(alpha: 0.3),
                            thickness: 3,
                          ),
                          afterLineStyle: LineStyle(
                            color: _primaryGreen.withValues(alpha: 0.3),
                            thickness: 3,
                          ),
                          endChild: _EventCard(event: evt, dateFmt: dateFmt),
                        );
                      }),
                    const SizedBox(height: 32),
                  ]),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  // ===== HELPER WIDGETS =====

  Widget _imagePlaceholder() => Container(
    width: 100,
    height: 100,
    decoration: BoxDecoration(
      color: Colors.white.withValues(alpha: 0.2),
      borderRadius: BorderRadius.circular(12),
    ),
    child: const Icon(Icons.eco, color: Colors.white54, size: 40),
  );

  Widget _heroInfoRow(IconData icon, String text) => Padding(
    padding: const EdgeInsets.only(top: 4),
    child: Row(
      children: [
        Icon(icon, size: 14, color: Colors.white70),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    ),
  );

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;
    String label;
    IconData icon;
    
    switch (status) {
      case 'active':
        bgColor = const Color(0xFF22C55E);
        textColor = Colors.white;
        label = 'Đang SX';
        icon = Icons.play_circle;
        break;
      case 'completed':
        bgColor = const Color(0xFF166534);
        textColor = Colors.white;
        label = 'Hoàn thành';
        icon = Icons.check_circle;
        break;
      default:
        bgColor = Colors.white.withValues(alpha: 0.3);
        textColor = Colors.white;
        label = 'Nháp';
        icon = Icons.edit;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: textColor),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(color: textColor, fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildStatItem(String emoji, String value, String label) {
    return Column(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 20)),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: _purpleText,
          ),
        ),
        Text(
          label,
          style: TextStyle(fontSize: 11, color: Colors.grey[600]),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildInfoCard({
    required String icon,
    required String title,
    required Color color,
    required Color borderColor,
    required Widget child,
  }) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: borderColor),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(icon, style: const TextStyle(fontSize: 20)),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
          ],
        ),
        const Divider(height: 20),
        child,
      ],
    ),
  );

  Widget _detailRow(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 85,
          child: Text(
            label,
            style: TextStyle(fontSize: 12, color: Colors.grey[600], fontWeight: FontWeight.w500),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    ),
  );

  String _truncateAddress(String addr) {
    if (addr.length <= 16) return addr;
    return '${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}';
  }

  void _shareProduct(BuildContext context, dynamic product) {
    final text = '''
🌾 Thông tin truy xuất nguồn gốc

📦 Sản phẩm: ${product.name}
🏷️ Mã lô: ${product.batchId}
📍 Xuất xứ: ${product.origin}
📂 Danh mục: ${product.category}

🔗 Quét mã QR hoặc nhập mã lô để xem chi tiết lịch sử sản xuất.
''';
    Share.share(text, subject: 'Truy xuất nguồn gốc: ${product.name}');
  }

  void _showQRDialog(BuildContext context, String batchId, String productName) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.qr_code, color: _primaryGreen),
            const SizedBox(width: 8),
            Expanded(child: Text(productName, style: const TextStyle(fontSize: 16))),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _borderGreen, width: 2),
              ),
              child: QrImageView(
                data: batchId,
                version: QrVersions.auto,
                size: 200,
                backgroundColor: Colors.white,
                eyeStyle: const QrEyeStyle(
                  eyeShape: QrEyeShape.square,
                  color: _primaryGreen,
                ),
                dataModuleStyle: const QrDataModuleStyle(
                  dataModuleShape: QrDataModuleShape.square,
                  color: _primaryGreen,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.tag, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      batchId,
                      style: const TextStyle(fontFamily: 'monospace', fontSize: 11),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }
}

// ===== EVENT CARD WIDGET =====
class _EventCard extends StatelessWidget {
  const _EventCard({required this.event, required this.dateFmt});

  final TraceEvent event;
  final DateFormat dateFmt;

  @override
  Widget build(BuildContext context) {
    final isConfirmed = event.onChainStatus == 'confirmed';
    
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 8, 0, 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isConfirmed ? _borderGreen : Colors.grey[300]!,
          width: isConfirmed ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            children: [
              Expanded(
                child: Text(
                  event.eventLabel,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  dateFmt.format(event.createdAt),
                  style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                ),
              ),
            ],
          ),
          
          // Description
          const SizedBox(height: 8),
          Text(
            event.description,
            style: TextStyle(fontSize: 13, color: Colors.grey[700]),
          ),
          
          // Người ghi nhận
          if (event.recordedByName.isNotEmpty) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(Icons.person_outline, size: 14, color: Colors.grey[500]),
                const SizedBox(width: 4),
                Text(
                  'Ghi bởi: ${event.recordedByName}',
                  style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                ),
              ],
            ),
          ],
          
          // Details
          if (event.details != null && event.details!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Wrap(
                spacing: 12,
                runSpacing: 8,
                children: event.details!.entries
                    .map((e) => Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '${e.key}:',
                              style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${e.value}',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ))
                    .toList(),
              ),
            ),
          ],
          
          // Images thumbnail
          if (event.images.isNotEmpty) ...[
            const SizedBox(height: 10),
            SizedBox(
              height: 60,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: event.images.length,
                itemBuilder: (ctx, idx) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      event.images[idx],
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 60,
                        height: 60,
                        color: Colors.grey[200],
                        child: const Icon(Icons.image_not_supported, size: 20),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
          
          // Blockchain badge + block info
          const SizedBox(height: 10),
          Row(
            children: [
              BlockchainBadge(status: event.onChainStatus, txHash: event.txHash),
              const Spacer(),
              if (event.blockNumber != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: _blueBg,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.memory, size: 12, color: _blueText),
                      const SizedBox(width: 4),
                      Text(
                        'Block #${event.blockNumber}',
                        style: const TextStyle(
                          fontSize: 10,
                          color: _blueText,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              if (event.dataHash != null && event.blockNumber == null)
                Tooltip(
                  message: event.dataHash!,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      '#${event.dataHash!.substring(0, 8)}',
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.grey[500],
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}