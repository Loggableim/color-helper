/* ===== Color Helper - Export Utilities ===== */

export type ExportFormat = 'css' | 'scss' | 'tailwind' | 'json' | 'figma';

export interface ExportOptions {
  colors: string[];
  prefix?: string;
  paletteName?: string;
  format: ExportFormat;
  asVariables?: boolean;
}

// ---- Core formatters ----

export function formatCSSVariables(colors: string[], prefix: string = 'color'): string {
  return colors
    .map((c, i) => `  --${prefix}-${i + 1}: ${c};`)
    .join('\n');
}

export function formatCSSVariablesNamed(colors: Record<string, string>): string {
  return Object.entries(colors)
    .map(([name, hex]) => `  --${name}: ${hex};`)
    .join('\n');
}

export function formatSCSSVariables(colors: string[], prefix: string = 'color'): string {
  return colors
    .map((c, i) => `$${prefix}-${i + 1}: ${c};`)
    .join('\n');
}

export function formatTailwindConfig(colors: Record<string, string>): string {
  const entries = Object.entries(colors)
    .map(([name, hex]) => `    '${name}': '${hex}'`)
    .join(',\n');
  return `{\n  colors: {\n${entries}\n  }\n}`;
}

export function formatTailwindArbitrary(hex: string): string {
  return `bg-[${hex}] text-[${hex}] border-[${hex}]`;
}

export function formatJSON(colors: string[]): string {
  return JSON.stringify(colors, null, 2);
}

export function formatFigmaVariables(colors: Record<string, string>): string {
  // Figma Variables JSON format for token import
  const variables = Object.entries(colors).map(([name, hex]) => ({
    name: name,
    type: 'COLOR',
    value: hexToFigmaColor(hex),
    scopes: ['ALL_SCOPES'],
  }));
  return JSON.stringify({ variables }, null, 2);
}

function hexToFigmaColor(hex: string): { r: number; g: number; b: number; a: number } {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return { r: Math.round(r * 1000) / 1000, g: Math.round(g * 1000) / 1000, b: Math.round(b * 1000) / 1000, a: 1 };
}

// ---- Export processor ----

export function formatExport(options: ExportOptions): string {
  const { colors, format, prefix = 'color', paletteName } = options;

  switch (format) {
    case 'css':
      if (paletteName) {
        return `/* ${paletteName} */\n:root {\n${formatCSSVariables(colors, prefix)}\n}`;
      }
      return `:root {\n${formatCSSVariables(colors, prefix)}\n}`;

    case 'scss':
      if (paletteName) {
        return `// ${paletteName}\n${formatSCSSVariables(colors, prefix)}`;
      }
      return formatSCSSVariables(colors, prefix);

    case 'tailwind': {
      const named: Record<string, string> = {};
      colors.forEach((c, i) => { named[`${prefix}-${i + 1}`] = c; });
      return `// tailwind.config.js\nmodule.exports = ${formatTailwindConfig(named)}`;
    }

    case 'json':
      if (paletteName) {
        return JSON.stringify({ name: paletteName, colors, generated: new Date().toISOString() }, null, 2);
      }
      return formatJSON(colors);

    case 'figma': {
      const named: Record<string, string> = {};
      colors.forEach((c, i) => { named[`${prefix}/${i + 1}`] = c; });
      return formatFigmaVariables(named);
    }

    default:
      return colors.join(', ');
  }
}

// ---- File download ----

export function downloadAsFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadExport(colors: string[], format: ExportFormat, paletteName?: string): void {
  const content = formatExport({ colors, format, paletteName: paletteName || 'color-helper-palette' });
  const extMap: Record<ExportFormat, string> = {
    css: 'css',
    scss: 'scss',
    tailwind: 'js',
    json: 'json',
    figma: 'json',
  };
  const filename = `${(paletteName || 'palette').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.${extMap[format]}`;
  downloadAsFile(content, filename, 'text/plain');
}

// ---- Copy with fallback ----

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  }
}

// ---- Format labels ----

export const EXPORT_FORMATS: { value: ExportFormat; label: string; icon: string }[] = [
  { value: 'css', label: 'CSS Variables', icon: '🎨' },
  { value: 'scss', label: 'SCSS Variables', icon: '💎' },
  { value: 'tailwind', label: 'Tailwind Config', icon: '🌊' },
  { value: 'json', label: 'JSON Design Tokens', icon: '📋' },
  { value: 'figma', label: 'Figma Variables', icon: '🖼️' },
];
