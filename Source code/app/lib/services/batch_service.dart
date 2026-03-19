import 'package:app/core/api_client.dart';
import 'package:app/models/batch.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';

class BatchService {
  BatchService({Dio? dio}) : _dio = dio ?? ApiClient.instance.dio;

  final Dio _dio;

  Future<List<Batch>> getBatches() async {
    final response = await _dio.get('/products');
    final payload = response.data;

    final items = payload is List
        ? payload
        : (payload is Map<String, dynamic>
              ? (payload['products'] as List<dynamic>? ?? const [])
              : const <dynamic>[]);

    return items
        .map((item) => _mapProductToBatch(item as Map<String, dynamic>))
        .toList();
  }

  Future<Batch> getTimeline(String batchId) async {
    final response = await _dio.get('/trace/$batchId');
    final payload = response.data as Map<String, dynamic>;

    final product = payload['product'] as Map<String, dynamic>? ?? const {};
    final events = (payload['events'] as List<dynamic>? ?? const []);

    return Batch(
      id: (product['_id'] ?? batchId).toString(),
      batchId: (product['_id'] ?? batchId).toString(),
      productName: (product['name'] ?? '').toString(),
      productType: (product['category'] ?? product['type'] ?? '').toString(),
      origin: (product['origin'] ?? '').toString(),
      description: (product['description'] ?? '').toString(),
      status: (product['status'] ?? 'active').toString(),
      qrCodeUrl: (product['qrcode'] ?? '').toString(),
      events: events
          .map((item) => _mapTraceEvent(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<CreateEventResult> addFarmingEvent({
    required String batchId,
    required String actionType,
    required String note,
    required List<XFile> images,
  }) async {
    final response = await _dio.post(
      '/trace/events',
      data: {
        'product': batchId,
        'eventType': actionType,
        'description': note,
        'images': images
            .map((image) => {'path': image.path, 'filename': image.name})
            .toList(),
      },
    );

    final payload = response.data as Map<String, dynamic>;
    final event =
        (payload['event'] as Map<String, dynamic>?) ??
        (payload['traceEvent'] as Map<String, dynamic>?) ??
        const {};
    final blockchain =
        payload['blockchain'] as Map<String, dynamic>? ?? const {};
    final message =
        (payload['msg'] ??
                payload['message'] ??
                payload['warning'] ??
                (blockchain.isNotEmpty
                    ? 'Đã lưu nhật ký và ghi nhận xác thực thành công.'
                    : 'Đã lưu nhật ký nhưng blockchain chưa được cấu hình.'))
            .toString();

    return CreateEventResult(
      message: message,
      batchId: batchId,
      transactionHash:
          (payload['txHash'] ?? blockchain['txHash'] ?? event['txHash'] ?? '')
              .toString(),
      dataHash:
          payload['dataHash']?.toString() ??
          blockchain['dataHash']?.toString() ??
          event['dataHash']?.toString(),
      onChainStatus:
          (payload['onChainStatus'] ?? event['onChainStatus'] ?? 'pending')
              .toString(),
      warning: payload['warning']?.toString(),
    );
  }

  Batch _mapProductToBatch(Map<String, dynamic> product) {
    return Batch(
      id: (product['_id'] ?? '').toString(),
      batchId: (product['_id'] ?? '').toString(),
      productName: (product['name'] ?? '').toString(),
      productType: (product['category'] ?? product['type'] ?? '').toString(),
      origin: (product['origin'] ?? '').toString(),
      description: (product['description'] ?? '').toString(),
      status: (product['status'] ?? 'active').toString(),
      qrCodeUrl: (product['qrcode'] ?? '').toString(),
      events: const [],
    );
  }

  BatchEvent _mapTraceEvent(Map<String, dynamic> event) {
    return BatchEvent(
      id: (event['_id'] ?? '').toString(),
      actionType: (event['eventType'] ?? event['actionType'] ?? '').toString(),
      note: (event['description'] ?? event['note'] ?? '').toString(),
      imageUrls: (event['images'] as List<dynamic>? ?? const [])
          .map(
            (item) => item is Map<String, dynamic>
                ? (item['path'] ?? item['url'] ?? '').toString()
                : item.toString(),
          )
          .where((item) => item.isNotEmpty)
          .toList(),
      dataHash: event['dataHash']?.toString(),
      transactionHash:
          event['transactionHash']?.toString() ?? event['txHash']?.toString(),
      blockNumber: event['blockNumber'] is num
          ? (event['blockNumber'] as num).toInt()
          : null,
      actor:
          event['actor']?.toString() ??
          (event['recorded_by'] is Map<String, dynamic>
              ? (event['recorded_by']['first_name'] ?? '').toString()
              : null),
      onChainStatus: (event['onChainStatus'] ?? 'pending').toString(),
      createdAt:
          DateTime.tryParse((event['createdAt'] ?? '').toString()) ??
          DateTime.now(),
    );
  }
}
