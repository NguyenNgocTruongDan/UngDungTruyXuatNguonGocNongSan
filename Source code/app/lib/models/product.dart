class Product {
  final String id;
  final String name;
  final String? description;
  final String category;
  final String origin;
  final List<String> images;
  final String? onChainBatchId;
  final String status; // draft | active | completed

  Product({
    required this.id,
    required this.name,
    this.description,
    required this.category,
    required this.origin,
    required this.images,
    this.onChainBatchId,
    required this.status,
  });

  /// `batchId` dùng trên blockchain đang lấy trực tiếp từ `_id`.
  String get batchId => id;

  factory Product.fromJson(Map<String, dynamic> json) => Product(
    id: json['_id'] as String,
    name: json['name'] as String,
    description: json['description'] as String?,
    category: json['category'] as String? ?? '',
    origin: json['origin'] as String? ?? '',
    images: _parseImages(json['images']),
    onChainBatchId: json['onChainBatchId'] as String?,
    status: json['status'] as String? ?? 'draft',
  );

  static List<String> _parseImages(dynamic raw) {
    if (raw == null) return [];
    if (raw is! List) return [];
    return raw
        .map((e) {
          if (e is Map) return (e['path'] as String?) ?? '';
          return e.toString();
        })
        .where((s) => s.isNotEmpty)
        .toList();
  }
}
