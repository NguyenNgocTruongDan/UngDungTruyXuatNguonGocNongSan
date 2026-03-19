import 'package:app/core/router.dart';
import 'package:app/core/theme.dart';
import 'package:app/models/batch.dart';
import 'package:app/providers/providers.dart';
import 'package:app/widgets/blockchain_badge.dart';
import 'package:app/widgets/liquid_glass.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

class TimelineScreen extends ConsumerStatefulWidget {
  const TimelineScreen({super.key, this.initialBatchId});

  final String? initialBatchId;

  @override
  ConsumerState<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends ConsumerState<TimelineScreen> {
  final TextEditingController _manualBatchIdController =
      TextEditingController();
  String? _activeBatchId;

  @override
  void initState() {
    super.initState();
    _activeBatchId = widget.initialBatchId;
    if (_activeBatchId != null) {
      _manualBatchIdController.text = _activeBatchId!;
    }
  }

  @override
  void dispose() {
    _manualBatchIdController.dispose();
    super.dispose();
  }

  void _loadManualBatchId() {
    final value = _manualBatchIdController.text.trim();
    if (value.isEmpty) return;

    setState(() => _activeBatchId = value);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dòng thời gian truy xuất'),
        actions: [
          IconButton(
            onPressed: () {
              if (_activeBatchId == null || _activeBatchId!.isEmpty) return;
              ref.invalidate(batchTimelineProvider(_activeBatchId!));
            },
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: GlassPageBackground(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          children: [
            GlassPanel(
              padding: const EdgeInsets.all(22),
              colors: [
                Colors.white.withValues(alpha: 0.58),
                const Color(0xB8DCE8FF),
              ],
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Thông tin truy xuất lô nông sản',
                    style: TextStyle(
                      color: AppColors.muted,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Nhập mã lô hoặc quét QR để xem lịch sử cập nhật.',
                    style: Theme.of(
                      context,
                    ).textTheme.headlineSmall?.copyWith(fontSize: 24),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Hiển thị đầy đủ thông tin lô, các công đoạn canh tác và minh chứng xác nhận nếu có.',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GlassPanel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Tìm lô nông sản',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _manualBatchIdController,
                    decoration: const InputDecoration(
                      labelText: 'Mã lô',
                      hintText: 'Nhập mã lô hoặc mã đọc từ QR',
                      prefixIcon: Icon(Icons.search_rounded),
                    ),
                    onSubmitted: (_) => _loadManualBatchId(),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: _loadManualBatchId,
                          icon: const Icon(Icons.timeline_rounded),
                          label: const Text('Xem truy xuất'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () =>
                              Navigator.pushNamed(context, AppRouter.scanner),
                          icon: const Icon(Icons.qr_code_scanner_rounded),
                          label: const Text('Quét QR'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            if (_activeBatchId == null || _activeBatchId!.isEmpty)
              const _EmptyTimelineState()
            else
              ref
                  .watch(batchTimelineProvider(_activeBatchId!))
                  .when(
                    loading: () => const Padding(
                      padding: EdgeInsets.only(top: 48),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                    error: (error, _) => _TimelineErrorState(
                      message: 'Không tải được thông tin truy xuất.\n$error',
                      onRetry: () => ref.invalidate(
                        batchTimelineProvider(_activeBatchId!),
                      ),
                    ),
                    data: (batch) => _TimelineView(batch: batch),
                  ),
          ],
        ),
      ),
    );
  }
}

class _TimelineView extends StatelessWidget {
  const _TimelineView({required this.batch});

  final Batch batch;

  @override
  Widget build(BuildContext context) {
    final events = [...batch.events]
      ..sort((a, b) => a.createdAt.compareTo(b.createdAt));
    final confirmedCount = events
        .where((event) => event.onChainStatus == 'confirmed')
        .length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GlassPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const GlassIconCapsule(
                    icon: Icons.inventory_2_rounded,
                    size: 56,
                    color: AppColors.pine,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          batch.productName,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 4),
                        Text('Mã lô: ${batch.batchId}'),
                        if (batch.origin.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text('Xuất xứ: ${batch.origin}'),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
              if (batch.description.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(batch.description),
              ],
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _SummaryStat(
                      value: '${events.length}',
                      label: 'Tổng sự kiện',
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _SummaryStat(
                      value: '$confirmedCount',
                      label: 'Đã xác nhận',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        Text('Dòng thời gian', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        const Text(
          'Mỗi thẻ thể hiện một lần cập nhật trong quá trình sản xuất, sơ chế hoặc vận chuyển.',
        ),
        const SizedBox(height: 14),
        if (events.isEmpty)
          const GlassPanel(child: Text('Lô này chưa có nhật ký canh tác nào.'))
        else
          ListView.builder(
            itemCount: events.length,
            shrinkWrap: true,
            reverse: true,
            physics: const NeverScrollableScrollPhysics(),
            itemBuilder: (context, index) {
              final event = events[index];
              final isLast = index == events.length - 1;

              return _TimelineEventTile(event: event, isLast: isLast);
            },
          ),
      ],
    );
  }
}

class _TimelineEventTile extends StatelessWidget {
  const _TimelineEventTile({required this.event, required this.isLast});

  final BatchEvent event;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final railColor = _statusColor(event.onChainStatus);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 42,
          child: Column(
            children: [
              Container(
                width: 18,
                height: 18,
                margin: const EdgeInsets.only(top: 12),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [railColor, railColor.withValues(alpha: 0.6)],
                  ),
                  border: Border.all(color: Colors.white, width: 3),
                ),
              ),
              Container(
                width: 2,
                height: isLast ? 0 : 164,
                margin: const EdgeInsets.only(top: 8),
                color: railColor.withValues(alpha: 0.28),
              ),
            ],
          ),
        ),
        Expanded(
          child: Padding(
            padding: EdgeInsets.only(bottom: isLast ? 0 : 14),
            child: GlassPanel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _labelForAction(event.actionType),
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 17,
                                color: AppColors.ink,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              DateFormat(
                                'dd/MM/yyyy - HH:mm',
                              ).format(event.createdAt),
                              style: const TextStyle(
                                color: AppColors.muted,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      BlockchainBadge(
                        status: event.onChainStatus,
                        txHash: event.transactionHash,
                      ),
                    ],
                  ),
                  if (event.note.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    Text(
                      event.note,
                      style: const TextStyle(color: AppColors.ink, height: 1.5),
                    ),
                  ],
                  if (event.imageUrls.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    SizedBox(
                      height: 90,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: event.imageUrls.length,
                        separatorBuilder: (context, index) =>
                            const SizedBox(width: 10),
                        itemBuilder: (context, index) {
                          return ClipRRect(
                            borderRadius: BorderRadius.circular(20),
                            child: Image.network(
                              event.imageUrls[index],
                              width: 90,
                              height: 90,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) =>
                                  Container(
                                    width: 90,
                                    height: 90,
                                    color: Colors.white.withValues(alpha: 0.22),
                                    child: const Icon(
                                      Icons.broken_image_outlined,
                                      color: AppColors.muted,
                                    ),
                                  ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                  const SizedBox(height: 14),
                  _DataLine(
                    label: 'Mã giao dịch',
                    value: event.transactionHash ?? 'Đang chờ xác nhận',
                  ),
                  if (event.dataHash != null && event.dataHash!.isNotEmpty)
                    _DataLine(label: 'Mã băm dữ liệu', value: event.dataHash!),
                  if (event.actor != null && event.actor!.isNotEmpty)
                    _DataLine(label: 'Người thực hiện', value: event.actor!),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'confirmed':
        return AppColors.pine;
      case 'failed':
        return AppColors.danger;
      default:
        return const Color(0xFFC9871B);
    }
  }

  String _labelForAction(String actionType) {
    switch (actionType) {
      case 'SEEDING':
        return 'Gieo hạt';
      case 'FERTILIZING':
        return 'Bón phân';
      case 'WATERING':
        return 'Tưới nước';
      case 'PEST_CONTROL':
        return 'Chăm sóc / Kiểm soát sâu bệnh';
      case 'HARVESTING':
        return 'Thu hoạch';
      case 'PACKAGING':
        return 'Đóng gói';
      case 'SHIPPING':
        return 'Vận chuyển';
      default:
        return actionType;
    }
  }
}

class _SummaryStat extends StatelessWidget {
  const _SummaryStat({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      radius: 22,
      padding: const EdgeInsets.all(16),
      colors: [
        Colors.white.withValues(alpha: 0.34),
        Colors.white.withValues(alpha: 0.14),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 4),
          Text(label),
        ],
      ),
    );
  }
}

class _DataLine extends StatelessWidget {
  const _DataLine({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.muted,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          SelectableText(
            value,
            style: const TextStyle(
              fontSize: 12,
              fontFamily: 'monospace',
              color: AppColors.ink,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyTimelineState extends StatelessWidget {
  const _EmptyTimelineState();

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      child: Column(
        children: [
          const GlassIconCapsule(
            icon: Icons.qr_code_2_rounded,
            size: 66,
            color: AppColors.pine,
          ),
          const SizedBox(height: 16),
          Text(
            'Chưa có lô nào được chọn.',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          const Text(
            'Hãy quét QR hoặc nhập mã lô để xem toàn bộ thông tin truy xuất của lô nông sản.',
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _TimelineErrorState extends StatelessWidget {
  const _TimelineErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      child: Column(
        children: [
          const GlassIconCapsule(
            icon: Icons.error_outline_rounded,
            size: 66,
            color: AppColors.danger,
          ),
          const SizedBox(height: 16),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(height: 1.5),
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: onRetry, child: const Text('Thử lại')),
        ],
      ),
    );
  }
}
