import 'package:app/models/trace_event.dart';
import 'package:app/providers/providers.dart';
import 'package:app/widgets/blockchain_badge.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:timeline_tile/timeline_tile.dart';

class TraceTimelineScreen extends ConsumerWidget {
  const TraceTimelineScreen({super.key, required this.productId});

  final String productId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final traceAsync = ref.watch(fullTraceProvider(productId));

    return Scaffold(
      appBar: AppBar(title: const Text('Truy xuất nguồn gốc')),
      body: traceAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline, size: 56, color: Colors.red),
                const SizedBox(height: 12),
                Text(
                  'Không tìm thấy thông tin',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  '$err',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey[600], fontSize: 13),
                ),
              ],
            ),
          ),
        ),
        data: (trace) {
          final product = trace.product;
          final events = trace.events;
          final cs = Theme.of(context).colorScheme;
          final dateFmt = DateFormat('dd/MM/yyyy HH:mm');

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            children: [
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (product.images.isNotEmpty)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            product.images.first,
                            height: 180,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) =>
                                Container(
                                  height: 120,
                                  color: Colors.grey[200],
                                  child: const Center(
                                    child: Icon(Icons.image_not_supported),
                                  ),
                                ),
                          ),
                        ),
                      const SizedBox(height: 12),
                      Text(
                        product.name,
                        style: Theme.of(context).textTheme.headlineSmall
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      if (product.description != null &&
                          product.description!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            product.description!,
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                        ),
                      const Divider(height: 24),
                      _InfoRow('Danh mục', product.category),
                      _InfoRow('Xuất xứ', product.origin),
                      _InfoRow('Mã lô', product.batchId),
                      if (trace.onChain != null) ...[
                        const Divider(height: 20),
                        Row(
                          children: [
                            Icon(Icons.link, size: 16, color: cs.primary),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'Đã ghi ${trace.onChain!.actionCount} sự kiện xác thực',
                                style: TextStyle(
                                  color: cs.primary,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Lịch sử truy xuất (${events.length} sự kiện)',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              ...List.generate(events.length, (i) {
                final evt = events[i];
                final isFirst = i == 0;
                final isLast = i == events.length - 1;
                final isConfirmed = evt.onChainStatus == 'confirmed';

                return TimelineTile(
                  isFirst: isFirst,
                  isLast: isLast,
                  indicatorStyle: IndicatorStyle(
                    width: 28,
                    color: isConfirmed ? cs.primary : Colors.grey[400]!,
                    iconStyle: IconStyle(
                      iconData: isConfirmed ? Icons.check_circle : Icons.circle,
                      color: Colors.white,
                      fontSize: 16,
                    ),
                  ),
                  beforeLineStyle: LineStyle(
                    color: cs.primary.withValues(alpha: 0.3),
                    thickness: 2,
                  ),
                  endChild: _EventCard(event: evt, dateFmt: dateFmt),
                );
              }),
            ],
          );
        },
      ),
    );
  }
}

class _EventCard extends StatelessWidget {
  const _EventCard({required this.event, required this.dateFmt});

  final TraceEvent event;
  final DateFormat dateFmt;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 8, 0, 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(event.eventIcon, style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  event.eventLabel,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
              ),
              Text(
                dateFmt.format(event.createdAt),
                style: TextStyle(fontSize: 11, color: Colors.grey[500]),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            event.description,
            style: TextStyle(fontSize: 13, color: Colors.grey[700]),
          ),
          if (event.details != null && event.details!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Wrap(
                spacing: 8,
                runSpacing: 4,
                children: event.details!.entries
                    .map(
                      (e) => Chip(
                        label: Text(
                          '${e.key}: ${e.value}',
                          style: const TextStyle(fontSize: 11),
                        ),
                        visualDensity: VisualDensity.compact,
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    )
                    .toList(),
              ),
            ),
          const SizedBox(height: 8),
          BlockchainBadge(status: event.onChainStatus, txHash: event.txHash),
          if (event.dataHash != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                'Hash: ${event.dataHash!.substring(0, 18)}...',
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.grey[400],
                  fontFamily: 'monospace',
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }
}
