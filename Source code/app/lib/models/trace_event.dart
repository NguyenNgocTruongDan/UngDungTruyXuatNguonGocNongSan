class TraceEvent {
  final String id;
  final String product;
  final String batchId;
  final String eventType;
  final String description;
  final Map<String, dynamic>? details;
  final List<String> images;
  final String? dataHash;
  final String? txHash;
  final int? blockNumber;
  final String onChainStatus; // pending | confirmed | failed
  final DateTime createdAt;

  TraceEvent({
    required this.id,
    required this.product,
    required this.batchId,
    required this.eventType,
    required this.description,
    this.details,
    required this.images,
    this.dataHash,
    this.txHash,
    this.blockNumber,
    required this.onChainStatus,
    required this.createdAt,
  });

  factory TraceEvent.fromJson(Map<String, dynamic> json) => TraceEvent(
    id: json['_id'] as String,
    product: json['product'] is Map
        ? json['product']['_id'] as String
        : json['product'] as String,
    batchId: json['batchId'] as String? ?? '',
    eventType: json['eventType'] as String,
    description: json['description'] as String? ?? '',
    details: json['details'] as Map<String, dynamic>?,
    images:
        (json['images'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
        [],
    dataHash: json['dataHash'] as String?,
    txHash: json['txHash'] as String?,
    blockNumber: json['blockNumber'] as int?,
    onChainStatus: json['onChainStatus'] as String? ?? 'pending',
    createdAt: DateTime.parse(
      json['createdAt'] as String? ?? DateTime.now().toIso8601String(),
    ),
  );

  String get eventLabel => _eventLabels[eventType] ?? eventType;

  String get eventIcon => _eventIcons[eventType] ?? '📋';

  static const _eventLabels = {
    'SEEDING': 'Gieo hạt',
    'FERTILIZING': 'Bón phân',
    'WATERING': 'Tưới nước',
    'PEST_CONTROL': 'Kiểm soát sâu bệnh',
    'HARVESTING': 'Thu hoạch',
    'PACKAGING': 'Đóng gói',
    'SHIPPING': 'Vận chuyển',
  };

  static const _eventIcons = {
    'SEEDING': '🌱',
    'FERTILIZING': '🧪',
    'WATERING': '💧',
    'PEST_CONTROL': '🐛',
    'HARVESTING': '🌾',
    'PACKAGING': '📦',
    'SHIPPING': '🚚',
  };
}
