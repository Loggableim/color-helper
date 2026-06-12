/* ===== Color Helper - Color Wheel Mathematics ===== */

export type HarmonyType =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'split-complementary'
  | 'tetradic'
  | 'monochromatic';

export interface WheelPoint {
  hue: number;       // 0-360
  saturation: number; // 0-100
  lightness: number;  // 0-100
  hex: string;
  label: string;
}

export const HARMONY_TYPES: { value: HarmonyType; label: string; description: string }[] = [
  { value: 'complementary', label: 'Complementary', description: 'Colors opposite each other' },
  { value: 'analogous', label: 'Analogous', description: 'Colors adjacent on the wheel' },
  { value: 'triadic', label: 'Triadic', description: 'Three evenly spaced colors' },
  { value: 'split-complementary', label: 'Split Complementary', description: 'Base + two adjacent to complement' },
  { value: 'tetradic', label: 'Tetradic', description: 'Two complementary pairs' },
  { value: 'monochromatic', label: 'Monochromatic', description: 'One hue at varying lightness' },
];

/**
 * Given a base hue, return the harmony color points on the wheel.
 */
export function getHarmonyPoints(
  baseHue: number,
  type: HarmonyType,
  sat: number = 70,
  light: number = 55
): WheelPoint[] {
  const base = toWheelPoint(baseHue, sat, light, 'Base');

  switch (type) {
    case 'complementary':
      return [
        base,
        toWheelPoint((baseHue + 180) % 360, sat, light, 'Complement'),
      ];

    case 'analogous':
      return [
        toWheelPoint((baseHue - 30 + 360) % 360, sat, light, 'Left'),
        base,
        toWheelPoint((baseHue + 30) % 360, sat, light, 'Right'),
      ];

    case 'triadic':
      return [
        base,
        toWheelPoint((baseHue + 120) % 360, sat, light, 'Triad 1'),
        toWheelPoint((baseHue + 240) % 360, sat, light, 'Triad 2'),
      ];

    case 'split-complementary': {
      const comp = (baseHue + 180) % 360;
      return [
        base,
        toWheelPoint((comp - 30 + 360) % 360, sat, light, 'Split 1'),
        toWheelPoint((comp + 30) % 360, sat, light, 'Split 2'),
      ];
    }

    case 'tetradic':
      return [
        base,
        toWheelPoint((baseHue + 60) % 360, sat, light, 'Tetrad 1'),
        toWheelPoint((baseHue + 180) % 360, sat, light, 'Tetrad 2'),
        toWheelPoint((baseHue + 240) % 360, sat, light, 'Tetrad 3'),
      ];

    case 'monochromatic':
      return [
        toWheelPoint(baseHue, sat, 25, 'Dark'),
        toWheelPoint(baseHue, sat, 40, 'Dim'),
        base,
        toWheelPoint(baseHue, sat, 70, 'Light'),
        toWheelPoint(baseHue, sat, 85, 'Pale'),
      ];

    default:
      return [base];
  }
}

function toWheelPoint(hue: number, sat: number, light: number, label: string): WheelPoint {
  const hex = hslToHex(hue, sat, light);
  return { hue, saturation: sat, lightness: light, hex, label };
}

/* ---- HSL → Hex ---- */

function hslToHex(h: number, s: number, l: number): string {
  const ss = s / 100;
  const ll = l / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ll - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  return `#${[r, g, b].map(v =>
    Math.round((v + m) * 255).toString(16).padStart(2, '0')
  ).join('')}`;
}

/* ---- Canvas drawing utilities ---- */

export interface WheelRenderOptions {
  cx: number;
  cy: number;
  radius: number;
  baseHue: number;
  harmonyType: HarmonyType;
  sat: number;
  light: number;
}

/**
 * Draw the color wheel (rainbow ring) onto a canvas context.
 */
export function drawColorWheel(
  ctx: CanvasRenderingContext2D,
  opts: WheelRenderOptions
): void {
  const { cx, cy, radius } = opts;
  const innerRadius = radius * 0.65;

  // Draw hue ring
  for (let i = 0; i < 360; i++) {
    const startAngle = (i - 90) * Math.PI / 180;
    const endAngle = (i + 1 - 90) * Math.PI / 180;
    const hue = i;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
    ctx.closePath();

    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fill();
  }

  // Inner circle
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();
}

/**
 * Draw harmony points (handles) on the wheel.
 */
export function drawHarmonyPoints(
  ctx: CanvasRenderingContext2D,
  opts: WheelRenderOptions
): WheelPoint[] {
  const { cx, cy, radius, baseHue, harmonyType, sat, light } = opts;
  const points = getHarmonyPoints(baseHue, harmonyType, sat, light);
  const ringRadius = (radius + radius * 0.65) / 2;

  points.forEach((point, i) => {
    const angle = (point.hue - 90) * Math.PI / 180;
    const x = cx + ringRadius * Math.cos(angle);
    const y = cy + ringRadius * Math.sin(angle);

    // Outer glow
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = i === 0 ? '#6366f1' : '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner dot
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = point.hex;
    ctx.fill();

    // Label
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(point.label, x, y + 20);
  });

  return points;
}

/**
 * Get hue from a mouse position relative to the wheel center.
 * Returns 0-360 or -1 if outside wheel.
 */
export function getHueFromPosition(
  mx: number,
  my: number,
  cx: number,
  cy: number,
  radius: number
): number {
  const dx = mx - cx;
  const dy = my - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const innerRadius = radius * 0.65;

  // Only respond to clicks on the colored ring
  if (dist < innerRadius || dist > radius) return -1;

  let angle = Math.atan2(dy, dx) * 180 / Math.PI;
  angle = (angle + 90 + 360) % 360;
  return Math.round(angle);
}
