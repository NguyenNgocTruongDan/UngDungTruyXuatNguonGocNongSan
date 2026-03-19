import 'dart:io';

import 'package:app/core/theme.dart';
import 'package:app/models/batch.dart';
import 'package:app/providers/providers.dart';
import 'package:app/widgets/liquid_glass.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

class AddEventScreen extends ConsumerStatefulWidget {
  const AddEventScreen({super.key, this.initialBatchId});

  final String? initialBatchId;

  @override
  ConsumerState<AddEventScreen> createState() => _AddEventScreenState();
}

class _AddEventScreenState extends ConsumerState<AddEventScreen> {
  static const _actionTypes = <String>[
    'SEEDING',
    'FERTILIZING',
    'WATERING',
    'PEST_CONTROL',
    'HARVESTING',
    'PACKAGING',
    'SHIPPING',
  ];

  final _formKey = GlobalKey<FormState>();
  final _noteController = TextEditingController();
  final _picker = ImagePicker();

  String? _selectedBatchId;
  String _selectedActionType = _actionTypes.first;
  List<XFile> _selectedImages = const [];
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _selectedBatchId = widget.initialBatchId;
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _pickFromCamera() async {
    final file = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
    );
    if (file == null) return;

    setState(() {
      _selectedImages = [..._selectedImages, file];
    });
  }

  Future<void> _pickFromGallery() async {
    final files = await _picker.pickMultiImage(imageQuality: 80);
    if (files.isEmpty) return;

    setState(() {
      _selectedImages = [..._selectedImages, ...files];
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedBatchId == null || _selectedBatchId!.isEmpty) return;

    setState(() => _submitting = true);

    try {
      final result = await ref
          .read(batchServiceProvider)
          .addFarmingEvent(
            batchId: _selectedBatchId!,
            actionType: _selectedActionType,
            note: _noteController.text.trim(),
            images: _selectedImages,
          );

      if (!mounted) return;

      ref.invalidate(batchTimelineProvider(_selectedBatchId!));
      ref.invalidate(batchListProvider);

      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(28),
          ),
          title: const Text('Đã lưu nhật ký thành công'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(result.message),
              if (result.warning != null && result.warning!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  result.warning!,
                  style: const TextStyle(color: AppColors.muted, height: 1.45),
                ),
              ],
              const SizedBox(height: 16),
              const Text(
                'Trạng thái xác nhận',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Text(
                result.onChainStatus == 'confirmed'
                    ? 'Đã xác nhận'
                    : result.onChainStatus == 'skipped'
                    ? 'Chưa cấu hình blockchain'
                    : result.onChainStatus == 'failed'
                    ? 'Gửi xác nhận thất bại'
                    : 'Đang chờ xử lý',
              ),
              const SizedBox(height: 16),
              const Text(
                'Mã giao dịch',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              SelectableText(
                result.transactionHash.isEmpty
                    ? 'Chưa có mã giao dịch'
                    : result.transactionHash,
                style: const TextStyle(
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: AppColors.ink,
                ),
              ),
            ],
          ),
          actions: [
            FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Đóng'),
            ),
          ],
        ),
      );

      setState(() {
        _noteController.clear();
        _selectedImages = const [];
        _selectedActionType = _actionTypes.first;
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Không lưu được nhật ký: $error')));
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final batchesAsync = ref.watch(batchListProvider);
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Thêm nhật ký canh tác')),
      body: GlassPageBackground(
        child: Stack(
          children: [
            batchesAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: GlassPanel(
                    child: Text(
                      'Không tải được danh sách lô.\n$error',
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
              data: (batches) {
                if (_selectedBatchId == null && batches.isNotEmpty) {
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (!mounted || _selectedBatchId != null) return;
                    setState(() => _selectedBatchId = batches.first.batchId);
                  });
                }

                final selectedBatch = _findBatchById(batches, _selectedBatchId);

                return ListView(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
                  children: [
                    GlassPanel(
                      padding: const EdgeInsets.all(22),
                      colors: [
                        Colors.white.withValues(alpha: 0.58),
                        const Color(0xB8DDE8FF),
                      ],
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Ghi nhận nhật ký canh tác',
                            style: TextStyle(
                              color: AppColors.muted,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            'Cập nhật thông tin mới cho lô nông sản.',
                            style: textTheme.headlineSmall?.copyWith(
                              fontSize: 24,
                            ),
                          ),
                          const SizedBox(height: 10),
                          const Text(
                            'Ghi chú và hình ảnh sẽ được lưu kèm để phục vụ truy xuất và đối chiếu trong quá trình sản xuất.',
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (selectedBatch != null)
                      GlassPanel(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Lô đang thao tác',
                              style: TextStyle(
                                color: AppColors.muted,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              selectedBatch.productName,
                              style: textTheme.titleLarge,
                            ),
                            const SizedBox(height: 4),
                            Text('Mã lô: ${selectedBatch.batchId}'),
                            if (selectedBatch.origin.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text('Xuất xứ: ${selectedBatch.origin}'),
                            ],
                          ],
                        ),
                      ),
                    const SizedBox(height: 16),
                    GlassPanel(
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Thông tin nhật ký',
                              style: textTheme.titleLarge,
                            ),
                            const SizedBox(height: 14),
                            _BatchDropdown(
                              batches: batches,
                              selectedBatchId: _selectedBatchId,
                              onChanged: (value) {
                                setState(() => _selectedBatchId = value);
                              },
                            ),
                            const SizedBox(height: 14),
                            DropdownButtonFormField<String>(
                              initialValue: _selectedActionType,
                              decoration: const InputDecoration(
                                labelText: 'Công đoạn canh tác',
                                prefixIcon: Icon(Icons.track_changes_rounded),
                              ),
                              items: _actionTypes
                                  .map(
                                    (value) => DropdownMenuItem(
                                      value: value,
                                      child: Text(_labelForAction(value)),
                                    ),
                                  )
                                  .toList(),
                              onChanged: (value) {
                                if (value == null) return;
                                setState(() => _selectedActionType = value);
                              },
                            ),
                            const SizedBox(height: 14),
                            TextFormField(
                              controller: _noteController,
                              minLines: 5,
                              maxLines: 7,
                              decoration: const InputDecoration(
                                labelText: 'Ghi chú chi tiết',
                                hintText:
                                    'Ví dụ: Tưới nước lúc 6h sáng, bón phân hữu cơ 5kg, ghi nhận tình trạng cây trồng...',
                                alignLabelWithHint: true,
                                prefixIcon: Icon(Icons.description_outlined),
                              ),
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'Vui lòng nhập ghi chú cho nhật ký';
                                }
                                return null;
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    GlassPanel(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Hình ảnh minh chứng',
                            style: textTheme.titleLarge,
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Ảnh chụp từ ruộng, nhà sơ chế hoặc kho đóng gói sẽ giúp hồ sơ truy xuất rõ ràng hơn.',
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: _pickFromCamera,
                                  icon: const Icon(Icons.camera_alt_rounded),
                                  label: const Text('Chụp ảnh'),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: _pickFromGallery,
                                  icon: const Icon(Icons.photo_library_rounded),
                                  label: const Text('Thư viện'),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          if (_selectedImages.isEmpty)
                            GlassPanel(
                              radius: 22,
                              padding: const EdgeInsets.all(16),
                              colors: [
                                Colors.white.withValues(alpha: 0.26),
                                Colors.white.withValues(alpha: 0.12),
                              ],
                              child: const Text(
                                'Chưa có ảnh nào được chọn. Bạn vẫn có thể lưu nhật ký chỉ với phần ghi chú.',
                              ),
                            )
                          else
                            SizedBox(
                              height: 110,
                              child: ListView.separated(
                                scrollDirection: Axis.horizontal,
                                itemCount: _selectedImages.length,
                                separatorBuilder: (context, index) =>
                                    const SizedBox(width: 10),
                                itemBuilder: (context, index) {
                                  final image = _selectedImages[index];
                                  return Stack(
                                    children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(22),
                                        child: Image.file(
                                          File(image.path),
                                          width: 110,
                                          height: 110,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                      Positioned(
                                        top: 8,
                                        right: 8,
                                        child: InkWell(
                                          onTap: () {
                                            setState(() {
                                              _selectedImages = [
                                                ..._selectedImages,
                                              ]..removeAt(index);
                                            });
                                          },
                                          child: const GlassIconCapsule(
                                            icon: Icons.close_rounded,
                                            size: 30,
                                            color: AppColors.ink,
                                          ),
                                        ),
                                      ),
                                    ],
                                  );
                                },
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                    FilledButton.icon(
                      onPressed: _submitting ? null : _submit,
                      icon: const Icon(Icons.cloud_upload_rounded),
                      label: const Text('Lưu nhật ký và gửi xác nhận'),
                    ),
                  ],
                );
              },
            ),
            if (_submitting)
              Positioned.fill(
                child: ColoredBox(
                  color: Colors.black.withValues(alpha: 0.22),
                  child: Center(
                    child: GlassPanel(
                      padding: const EdgeInsets.all(24),
                      child: const Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircularProgressIndicator(),
                          SizedBox(height: 16),
                          Text(
                            'Đang gửi dữ liệu và chờ hệ thống xác nhận...',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: AppColors.ink,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Batch? _findBatchById(List<Batch> batches, String? batchId) {
    if (batchId == null || batchId.isEmpty) return null;
    for (final batch in batches) {
      if (batch.batchId == batchId) return batch;
    }
    return null;
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

class _BatchDropdown extends StatelessWidget {
  const _BatchDropdown({
    required this.batches,
    required this.selectedBatchId,
    required this.onChanged,
  });

  final List<Batch> batches;
  final String? selectedBatchId;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    final currentValue = batches.any((item) => item.batchId == selectedBatchId)
        ? selectedBatchId
        : null;

    return DropdownButtonFormField<String>(
      initialValue: currentValue,
      decoration: const InputDecoration(
        labelText: 'Lô nông sản',
        prefixIcon: Icon(Icons.inventory_2_outlined),
      ),
      items: batches
          .map(
            (batch) => DropdownMenuItem(
              value: batch.batchId,
              child: Text('${batch.productName} (${batch.batchId})'),
            ),
          )
          .toList(),
      onChanged: onChanged,
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Vui lòng chọn lô nông sản';
        }
        return null;
      },
    );
  }
}
