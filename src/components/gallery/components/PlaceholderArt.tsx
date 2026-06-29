import type { GalleryItem } from '../data';

interface Props {
  item: GalleryItem;
  width: number;
  height: number;
}

export default function PlaceholderArt({ item, width, height }: Props) {
  const { placeholderColor, artColor: art, svgPattern, id } = item;
  const seed = id * 137;

  if (svgPattern === 'lines') {
    const lines = Array.from({ length: 8 }, (_, i) => {
      const y = (height / 8) * i + height / 16;
      const opacity = 0.32 + (i % 3) * 0.13;
      return (
        <line
          key={i}
          x1={0}
          y1={y}
          x2={width}
          y2={y + (seed % 30) - 15}
          stroke={art}
          strokeWidth="1"
          opacity={opacity}
        />
      );
    });
    return (
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', inset: 0 }}
      >
        <rect width={width} height={height} fill={placeholderColor} />
        {lines}
        <rect
          x={width * 0.2}
          y={height * 0.3}
          width={width * 0.6}
          height={height * 0.4}
          fill="none"
          stroke={art}
          strokeWidth="1"
          opacity={0.3}
        />
      </svg>
    );
  }

  if (svgPattern === 'circles') {
    const circles = Array.from({ length: 5 }, (_, i) => {
      const r = 20 + i * 18;
      const cx = width * 0.5 + (seed % 20) - 10;
      const cy = height * 0.5;
      return (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={art}
          strokeWidth="1.25"
          opacity={0.42}
        />
      );
    });
    return (
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', inset: 0 }}
      >
        <rect width={width} height={height} fill={placeholderColor} />
        {circles}
      </svg>
    );
  }

  if (svgPattern === 'grid') {
    const cols = 5;
    const rows = Math.round(cols * item.aspectRatio);
    const cw = width / cols;
    const rh = height / rows;
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const filled = (r * cols + c + seed) % 7 === 0;
        cells.push(
          <rect
            key={`${r}-${c}`}
            x={c * cw + 1}
            y={r * rh + 1}
            width={cw - 2}
            height={rh - 2}
            fill={filled ? art : 'transparent'}
            opacity={filled ? 0.5 : 1}
          />,
        );
      }
    }
    return (
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', inset: 0 }}
      >
        <rect width={width} height={height} fill={placeholderColor} />
        {cells}
        {Array.from({ length: cols + 1 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={i * cw}
            y1={0}
            x2={i * cw}
            y2={height}
            stroke={art}
            strokeWidth="0.75"
            opacity={0.2}
          />
        ))}
        {Array.from({ length: rows + 1 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={i * rh}
            x2={width}
            y2={i * rh}
            stroke={art}
            strokeWidth="0.75"
            opacity={0.2}
          />
        ))}
      </svg>
    );
  }

  if (svgPattern === 'dots') {
    const dots = [];
    const cols = 8,
      rows = Math.round(cols * item.aspectRatio);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const opacity = (r * cols + c + seed) % 5 === 0 ? 0.6 : 0.24;
        dots.push(
          <circle
            key={`${r}-${c}`}
            cx={(c + 0.5) * (width / cols)}
            cy={(r + 0.5) * (height / rows)}
            r="2"
            fill={art}
            opacity={opacity}
          />,
        );
      }
    }
    return (
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', inset: 0 }}
      >
        <rect width={width} height={height} fill={placeholderColor} />
        {dots}
      </svg>
    );
  }

  if (svgPattern === 'arcs') {
    const arcs = Array.from({ length: 6 }, (_, i) => {
      const r = 30 + i * 22;
      const startAngle = (seed * i) % 360;
      const endAngle = startAngle + 60 + i * 30;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const cx = width * 0.5,
        cy = height * 0.6;
      const x1 = cx + r * Math.cos(toRad(startAngle));
      const y1 = cy + r * Math.sin(toRad(startAngle));
      const x2 = cx + r * Math.cos(toRad(endAngle));
      const y2 = cy + r * Math.sin(toRad(endAngle));
      return (
        <path
          key={i}
          d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
          fill="none"
          stroke={art}
          strokeWidth="1.5"
          opacity={0.45}
        />
      );
    });
    return (
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', inset: 0 }}
      >
        <rect width={width} height={height} fill={placeholderColor} />
        {arcs}
      </svg>
    );
  }

  // noise — diagonal hash marks
  const marks = Array.from({ length: 12 }, (_, i) => {
    const x = (width / 12) * i;
    return (
      <line
        key={i}
        x1={x}
        y1={0}
        x2={x + 40}
        y2={height}
        stroke={art}
        strokeWidth="1"
        opacity={0.22}
      />
    );
  });
  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', inset: 0 }}
    >
      <rect width={width} height={height} fill={placeholderColor} />
      {marks}
    </svg>
  );
}
