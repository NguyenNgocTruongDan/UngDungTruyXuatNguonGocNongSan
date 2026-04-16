import 'package:app/models/farming_area.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

const _mapCardBorder = Color(0xFFFCD34D);
const _mapCardBackground = Color(0xFFFFFBEB);
const _mapCardText = Color(0xFF92400E);
const _mapAccent = Color(0xFF166534);

class FarmingAreaMapCard extends StatelessWidget {
  const FarmingAreaMapCard({
    super.key,
    required this.farmingArea,
    this.title = 'Ban do vung trong',
    this.height = 220,
  });

  final FarmingArea farmingArea;
  final String title;
  final double height;

  @override
  Widget build(BuildContext context) {
    final coordinates = farmingArea.coordinates;

    if (coordinates == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: _mapCardBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                color: _mapCardText,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Chua co toa do de hien thi ban do. Hay cap nhat latitude va longitude cho vung trong.',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[700],
                height: 1.45,
              ),
            ),
          ],
        ),
      );
    }

    final point = LatLng(coordinates.lat, coordinates.lng);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _mapCardBorder),
      ),
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
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: _mapCardText,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      farmingArea.address,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[700],
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              TextButton.icon(
                onPressed: () => _openMap(point),
                icon: const Icon(Icons.open_in_new, size: 16),
                label: const Text('Mo lon'),
                style: TextButton.styleFrom(
                  foregroundColor: _mapAccent,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 8,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              height: height,
              child: FlutterMap(
                options: MapOptions(
                  initialCenter: point,
                  initialZoom: 15,
                  interactionOptions: const InteractionOptions(
                    flags: InteractiveFlag.none,
                  ),
                ),
                children: [
                  TileLayer(
                    urlTemplate:
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  ),
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: point,
                        width: 44,
                        height: 44,
                        child: const Icon(
                          Icons.location_on,
                          color: Colors.red,
                          size: 36,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _CoordinateChip(
                label: 'Lat',
                value: coordinates.lat.toStringAsFixed(6),
                backgroundColor: _mapCardBackground,
                foregroundColor: _mapCardText,
              ),
              _CoordinateChip(
                label: 'Lng',
                value: coordinates.lng.toStringAsFixed(6),
                backgroundColor: const Color(0xFFF1F5F9),
                foregroundColor: const Color(0xFF334155),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Map data © OpenStreetMap contributors',
            style: TextStyle(fontSize: 11, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Future<void> _openMap(LatLng point) async {
    final uri = Uri.parse(
      'https://www.openstreetmap.org/?mlat=${point.latitude}&mlon=${point.longitude}#map=15/${point.latitude}/${point.longitude}',
    );

    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

class _CoordinateChip extends StatelessWidget {
  const _CoordinateChip({
    required this.label,
    required this.value,
    required this.backgroundColor,
    required this.foregroundColor,
  });

  final String label;
  final String value;
  final Color backgroundColor;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        '$label: $value',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: foregroundColor,
        ),
      ),
    );
  }
}
