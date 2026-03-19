import 'package:app/models/product.dart';
import 'package:app/models/trace_event.dart';

class FullTrace {
  final Product product;
  final List<TraceEvent> events;
  final OnChainInfo? onChain;

  FullTrace({required this.product, required this.events, this.onChain});

  factory FullTrace.fromJson(Map<String, dynamic> json) => FullTrace(
        product: Product.fromJson(json['product'] as Map<String, dynamic>),
        events: (json['events'] as List<dynamic>)
            .map((e) => TraceEvent.fromJson(e as Map<String, dynamic>))
            .toList(),
        onChain: json['onChain'] != null
            ? OnChainInfo.fromJson(json['onChain'] as Map<String, dynamic>)
            : null,
      );
}

class OnChainInfo {
  final String batchId;
  final String owner;
  final int actionCount;

  OnChainInfo({
    required this.batchId,
    required this.owner,
    required this.actionCount,
  });

  factory OnChainInfo.fromJson(Map<String, dynamic> json) => OnChainInfo(
        batchId: json['batchId'] as String? ?? '',
        owner: json['owner'] as String? ?? '',
        actionCount: (json['actions'] as List<dynamic>?)?.length ?? 0,
      );
}

