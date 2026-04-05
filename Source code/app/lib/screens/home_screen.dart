import 'package:app/core/router.dart';
import 'package:app/core/theme.dart';
import 'package:app/widgets/liquid_glass.dart';
import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: GlassPageBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
            children: [
              Row(
                children: [
                  const GlassIconCapsule(
                    icon: Icons.eco_rounded,
                    color: AppColors.pine,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text('AgriTrace', style: textTheme.titleLarge),
                  ),
                ],
              ),
              const SizedBox(height: 22),
              GlassPanel(
                padding: const EdgeInsets.all(24),
                colors: [
                  Colors.white.withValues(alpha: 0.54),
                  const Color(0xB7DAE7FF),
                ],
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.34),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text(
                        'Truy xuất nguồn gốc nông sản',
                        style: TextStyle(
                          color: AppColors.ink,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Text(
                      'Theo dõi hành trình của từng lô nông sản.',
                      style: textTheme.displaySmall?.copyWith(fontSize: 32),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Ứng dụng hỗ trợ quét QR, xem nhật ký canh tác và kiểm tra thông tin truy xuất của sản phẩm.',
                    ),
                    const SizedBox(height: 20),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: const [
                        _GlassChip(label: 'QR'),
                        _GlassChip(label: 'Nhật ký canh tác'),
                        _GlassChip(label: 'Truy xuất'),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              _GlassActionCard(
                icon: Icons.qr_code_scanner_rounded,
                title: 'Quét QR',
                subtitle: 'Mở nhanh thông tin lô nông sản và lịch sử cập nhật.',
                onTap: () => Navigator.pushNamed(context, AppRouter.scanner),
              ),
              const SizedBox(height: 14),
              _GlassActionCard(
                icon: Icons.person_rounded,
                title: 'Đăng nhập quản lý',
                subtitle:
                    'Cập nhật nhật ký sản xuất, đóng gói và vận chuyển cho từng lô.',
                onTap: () => Navigator.pushNamed(context, AppRouter.login),
              ),
              const SizedBox(height: 14),
              _GlassActionCard(
                icon: Icons.person_add_rounded,
                title: 'Đăng ký tài khoản',
                subtitle:
                    'Tạo tài khoản mới để quản lý lô nông sản của bạn.',
                onTap: () => Navigator.pushNamed(context, AppRouter.register),
              ),
              const SizedBox(height: 18),
              GlassPanel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Vì sao chọn cách làm này',
                      style: textTheme.titleLarge,
                    ),
                    const SizedBox(height: 14),
                    const _FeatureLine(
                      icon: Icons.touch_app_rounded,
                      title: 'Bám đúng nghiệp vụ',
                      subtitle:
                          'Chọn luồng quét mã, tra cứu và cập nhật nhật ký vì đây là các bước sát với truy xuất nông sản thực tế.',
                    ),
                    const SizedBox(height: 12),
                    const _FeatureLine(
                      icon: Icons.agriculture_rounded,
                      title: 'Dễ dùng cho người vận hành',
                      subtitle:
                          'Các chức năng được giữ ngắn gọn để người quản lý lô, nông dân hoặc người xem đều thao tác nhanh.',
                    ),
                    const SizedBox(height: 12),
                    const _FeatureLine(
                      icon: Icons.verified_rounded,
                      title: 'Thông tin dễ đối chiếu',
                      subtitle:
                          'Mốc thời gian, ảnh minh chứng và trạng thái xác nhận được đặt cùng nhau để tiện kiểm tra và trình bày.',
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GlassActionCard extends StatelessWidget {
  const _GlassActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(28),
      onTap: onTap,
      child: GlassPanel(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            GlassIconCapsule(icon: icon, size: 58, color: AppColors.pine),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(subtitle),
                ],
              ),
            ),
            const Icon(
              Icons.arrow_forward_ios_rounded,
              size: 18,
              color: AppColors.muted,
            ),
          ],
        ),
      ),
    );
  }
}

class _FeatureLine extends StatelessWidget {
  const _FeatureLine({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GlassIconCapsule(icon: icon, size: 42, color: AppColors.pine),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 2),
              Text(subtitle),
            ],
          ),
        ),
      ],
    );
  }
}

class _GlassChip extends StatelessWidget {
  const _GlassChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      radius: 999,
      blur: 16,
      child: Text(
        label,
        style: const TextStyle(
          fontWeight: FontWeight.w700,
          color: AppColors.ink,
        ),
      ),
    );
  }
}
