import React, { useMemo } from 'react';
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  typography,
} from '../../core/theme';

interface Coordinates {
  lat: number;
  lng: number;
}

interface FarmingAreaMapProps {
  coordinates?: Coordinates;
  title?: string;
  address?: string;
  height?: number;
}

const MAP_DELTA = 0.008;

const isValidCoordinate = (value: number, min: number, max: number) =>
  Number.isFinite(value) && value >= min && value <= max;

const hasValidCoordinates = (
  coordinates?: Coordinates
): coordinates is Coordinates =>
  Boolean(
    coordinates &&
      isValidCoordinate(coordinates.lat, -90, 90) &&
      isValidCoordinate(coordinates.lng, -180, 180)
  );

const buildEmbedUrl = ({ lat, lng }: Coordinates) => {
  const west = lng - MAP_DELTA;
  const east = lng + MAP_DELTA;
  const south = lat - MAP_DELTA;
  const north = lat + MAP_DELTA;
  const bbox = [west, south, east, north].join(',');

  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox
  )}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
};

const buildOpenStreetMapUrl = ({ lat, lng }: Coordinates) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;

const FarmingAreaMap: React.FC<FarmingAreaMapProps> = ({
  coordinates,
  title = 'Bản đồ vùng trồng',
  address,
  height = 220,
}) => {
  const embedUrl = useMemo(
    () => (hasValidCoordinates(coordinates) ? buildEmbedUrl(coordinates) : ''),
    [coordinates]
  );

  const mapUrl = useMemo(
    () =>
      hasValidCoordinates(coordinates) ? buildOpenStreetMapUrl(coordinates) : '',
    [coordinates]
  );

  if (!hasValidCoordinates(coordinates)) {
    return (
      <div
        style={{
          borderRadius: borderRadius.xl,
          border: `1px dashed ${colors.neutral[300]}`,
          background: colors.neutral[50],
          padding: spacing[5],
          color: colors.textSecondary,
        }}
      >
        <div
          style={{
            fontWeight: typography.weights.semibold,
            color: colors.textPrimary,
            marginBottom: spacing[2],
          }}
        >
          {title}
        </div>
        <p style={{ margin: 0, fontSize: typography.sizes.sm, lineHeight: 1.6 }}>
          Chưa có tọa độ để hiển thị bản đồ. Hãy cập nhật `latitude` và
          `longitude` cho vùng trồng để bật chế độ xem vị trí trực quan.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: spacing[2],
          marginBottom: spacing[3],
        }}
      >
        <div>
          <div
            style={{
              fontWeight: typography.weights.semibold,
              color: colors.textPrimary,
              marginBottom: spacing[1],
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: typography.sizes.xs,
              color: colors.textSecondary,
            }}
          >
            {address || 'Vị trí vùng trồng theo tọa độ đã khai báo'}
          </div>
        </div>
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            textDecoration: 'none',
            color: colors.primary[700],
            fontWeight: typography.weights.semibold,
            fontSize: typography.sizes.sm,
          }}
        >
          Mở bản đồ lớn
        </a>
      </div>

      <div
        style={{
          borderRadius: borderRadius.xl,
          overflow: 'hidden',
          border: `1px solid ${colors.neutral[200]}`,
          boxShadow: shadows.sm,
          background: colors.surface,
        }}
      >
        <iframe
          title={title}
          src={embedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{
            width: '100%',
            height,
            border: 'none',
            display: 'block',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: spacing[2],
          flexWrap: 'wrap',
          marginTop: spacing[3],
        }}
      >
        <span
          style={{
            background: colors.primary[50],
            color: colors.primary[700],
            padding: `${spacing[1]} ${spacing[3]}`,
            borderRadius: borderRadius.full,
            fontSize: typography.sizes.xs,
            fontWeight: typography.weights.semibold,
          }}
        >
          Lat: {coordinates.lat.toFixed(6)}
        </span>
        <span
          style={{
            background: colors.neutral[100],
            color: colors.textSecondary,
            padding: `${spacing[1]} ${spacing[3]}`,
            borderRadius: borderRadius.full,
            fontSize: typography.sizes.xs,
            fontWeight: typography.weights.semibold,
          }}
        >
          Lng: {coordinates.lng.toFixed(6)}
        </span>
      </div>
    </div>
  );
};

export default FarmingAreaMap;
