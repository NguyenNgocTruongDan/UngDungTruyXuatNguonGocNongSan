import 'package:app/core/theme.dart';
import 'package:app/widgets/liquid_glass.dart';
import 'package:flutter/material.dart';

class BlockchainBadge extends StatelessWidget {
  const BlockchainBadge({super.key, required this.status, this.txHash});

  final String status;
  final String? txHash;

  @override
  Widget build(BuildContext context) {
    final config = switch (status) {
      'confirmed' => (
        icon: Icons.verified_rounded,
        label: 'Đã xác nhận',
        fg: AppColors.pine,
      ),
      'failed' => (
        icon: Icons.error_outline_rounded,
        label: 'Thất bại',
        fg: AppColors.danger,
      ),
      _ => (
        icon: Icons.schedule_rounded,
        label: 'Đang chờ',
        fg: const Color(0xFFB37510),
      ),
    };

    return GlassPanel(
      radius: 999,
      blur: 16,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      colors: [
        Colors.white.withValues(alpha: 0.32),
        Colors.white.withValues(alpha: 0.14),
      ],
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(config.icon, size: 14, color: config.fg),
          const SizedBox(width: 6),
          Text(
            config.label,
            style: TextStyle(
              color: config.fg,
              fontWeight: FontWeight.w800,
              fontSize: 11,
              letterSpacing: 0.2,
            ),
          ),
          if (txHash != null && txHash!.isNotEmpty) ...[
            const SizedBox(width: 8),
            Container(
              width: 1,
              height: 12,
              color: config.fg.withValues(alpha: 0.22),
            ),
            const SizedBox(width: 8),
            Text(
              _minify(txHash!),
              style: TextStyle(
                color: config.fg,
                fontSize: 10,
                fontWeight: FontWeight.w700,
                fontFamily: 'monospace',
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _minify(String value) {
    if (value.length <= 14) return value;
    return '${value.substring(0, 6)}...${value.substring(value.length - 4)}';
  }
}
