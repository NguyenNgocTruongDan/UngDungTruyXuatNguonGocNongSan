import 'package:app/providers/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const _eventTypes = [
  ('SEEDING', '🌱 Gieo hạt'),
  ('FERTILIZING', '🧪 Bón phân'),
  ('WATERING', '💧 Tưới nước'),
  ('PEST_CONTROL', '🐛 Kiểm soát sâu bệnh'),
  ('HARVESTING', '🌾 Thu hoạch'),
  ('PACKAGING', '📦 Đóng gói'),
  ('SHIPPING', '🚚 Vận chuyển'),
];

class AddEventScreen extends ConsumerStatefulWidget {
  const AddEventScreen({super.key, required this.productId});

  final String productId;

  @override
  ConsumerState<AddEventScreen> createState() => _AddEventScreenState();
}

class _AddEventScreenState extends ConsumerState<AddEventScreen> {
  final _formKey = GlobalKey<FormState>();
  String _selectedType = _eventTypes.first.$1;
  final _descCtrl = TextEditingController();
  final List<(TextEditingController, TextEditingController)> _detailRows = [];

  bool _submitting = false;
  String? _result;
  bool _success = false;

  @override
  void dispose() {
    _descCtrl.dispose();
    for (final (k, v) in _detailRows) {
      k.dispose();
      v.dispose();
    }
    super.dispose();
  }

  void _addDetailRow() {
    setState(() {
      _detailRows.add((TextEditingController(), TextEditingController()));
    });
  }

  void _removeDetailRow(int i) {
    _detailRows[i].$1.dispose();
    _detailRows[i].$2.dispose();
    setState(() => _detailRows.removeAt(i));
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _submitting = true;
      _result = null;
    });

    final details = <String, dynamic>{};
    for (final (kCtrl, vCtrl) in _detailRows) {
      final k = kCtrl.text.trim();
      final v = vCtrl.text.trim();
      if (k.isNotEmpty && v.isNotEmpty) details[k] = v;
    }

    try {
      final traceService = ref.read(traceServiceProvider);
      final event = await traceService.createEvent(
        productId: widget.productId,
        eventType: _selectedType,
        description: _descCtrl.text.trim(),
        details: details.isEmpty ? null : details,
      );

      setState(() {
        _success = true;
        _result = event.onChainStatus == 'confirmed'
            ? 'Đã ghi nhận thành công.\nTx: ${event.txHash ?? "N/A"}'
            : 'Đã lưu dữ liệu, đang chờ xác nhận thêm.';
      });
    } catch (e) {
      setState(() {
        _success = false;
        _result = 'Lỗi: $e';
      });
    } finally {
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Ghi nhận hoạt động')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: cs.primaryContainer,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: cs.primary, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Thông tin hoạt động sẽ được lưu lại để phục vụ truy xuất và đối chiếu sau này.',
                        style: TextStyle(
                          fontSize: 12,
                          color: cs.onPrimaryContainer,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Loại hoạt động *',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[700],
                ),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: _selectedType,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 14,
                  ),
                ),
                items: _eventTypes
                    .map(
                      (t) => DropdownMenuItem(value: t.$1, child: Text(t.$2)),
                    )
                    .toList(),
                onChanged: (v) => setState(() => _selectedType = v!),
              ),
              const SizedBox(height: 20),
              Text(
                'Mô tả hoạt động *',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[700],
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _descCtrl,
                decoration: const InputDecoration(
                  hintText: 'VD: Bón phân NPK 16-16-8, 200kg/ha',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
                validator: (v) => v != null && v.trim().isNotEmpty
                    ? null
                    : 'Vui lòng nhập mô tả',
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Chi tiết kỹ thuật',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[700],
                    ),
                  ),
                  TextButton.icon(
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Thêm'),
                    onPressed: _addDetailRow,
                  ),
                ],
              ),
              ..._detailRows.asMap().entries.map((entry) {
                final i = entry.key;
                final (kCtrl, vCtrl) = entry.value;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: TextFormField(
                          controller: kCtrl,
                          decoration: const InputDecoration(
                            hintText: 'Tên mục',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        flex: 3,
                        child: TextFormField(
                          controller: vCtrl,
                          decoration: const InputDecoration(
                            hintText: 'Giá trị',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: () => _removeDetailRow(i),
                      ),
                    ],
                  ),
                );
              }),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: FilledButton.icon(
                  icon: _submitting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.cloud_upload),
                  label: Text(
                    _submitting ? 'Đang gửi dữ liệu...' : 'Lưu hoạt động',
                  ),
                  onPressed: _submitting ? null : _submit,
                ),
              ),
              if (_result != null)
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(top: 20),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: _success ? Colors.green[50] : Colors.red[50],
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: _success ? Colors.green[200]! : Colors.red[200]!,
                    ),
                  ),
                  child: Text(
                    _result!,
                    style: TextStyle(
                      color: _success ? Colors.green[800] : Colors.red[800],
                      fontSize: 13,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
