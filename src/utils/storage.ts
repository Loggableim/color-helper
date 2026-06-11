/* ===== Central Storage System ===== */

export interface SavedPalette {
  id: string;
  name: string;
  colors: string[];
  createdAt: string;
  updatedAt: string;
  source: 'picker' | 'image' | 'generator' | 'random' | 'brand' | 'converter' | 'gradient';
}

export interface StorageData {
  palettes: SavedPalette[];
  recentColors: string[];
}

const STORAGE_KEY = 'color-helper:saved-palettes';
const MAX_RECENT = 20;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** localStorage mit Fehlerbehandlung für Private Mode */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // silent
  }
}

function getDefaults(): StorageData {
  return { palettes: [], recentColors: [] };
}

/** Gesamten Storage laden */
export function loadStorage(): StorageData {
  const raw = safeGetItem(STORAGE_KEY);
  if (!raw) return getDefaults();
  try {
    const parsed = JSON.parse(raw);
    return {
      palettes: Array.isArray(parsed.palettes) ? parsed.palettes : [],
      recentColors: Array.isArray(parsed.recentColors) ? parsed.recentColors : [],
    };
  } catch {
    return getDefaults();
  }
}

/** Gesamten Storage speichern */
export function saveStorage(data: StorageData): boolean {
  return safeSetItem(STORAGE_KEY, JSON.stringify(data));
}

/** Storage löschen */
export function clearStorage(): void {
  safeRemoveItem(STORAGE_KEY);
}

/* ===== Recent Colors ===== */

export function getRecentColors(): string[] {
  return loadStorage().recentColors;
}

/** Farbe zu Recent hinzufügen (Duplikate vermeiden, max 20) */
export function addRecentColor(hex: string): void {
  const data = loadStorage();
  const normalized = hex.toLowerCase();
  data.recentColors = [normalized, ...data.recentColors.filter(c => c !== normalized)];
  if (data.recentColors.length > MAX_RECENT) {
    data.recentColors = data.recentColors.slice(0, MAX_RECENT);
  }
  saveStorage(data);
}

export function clearRecentColors(): void {
  const data = loadStorage();
  data.recentColors = [];
  saveStorage(data);
}

/* ===== Saved Palettes ===== */

export function getPalettes(): SavedPalette[] {
  return loadStorage().palettes;
}

export function savePalette(
  name: string,
  colors: string[],
  source: SavedPalette['source']
): SavedPalette {
  const data = loadStorage();
  const palette: SavedPalette = {
    id: generateId(),
    name,
    colors: colors.map(c => c.toLowerCase()),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source,
  };
  data.palettes = [palette, ...data.palettes];
  saveStorage(data);
  return palette;
}

export function deletePalette(id: string): void {
  const data = loadStorage();
  data.palettes = data.palettes.filter(p => p.id !== id);
  saveStorage(data);
}

export function renamePalette(id: string, newName: string): void {
  const data = loadStorage();
  const palette = data.palettes.find(p => p.id === id);
  if (palette) {
    palette.name = newName;
    palette.updatedAt = new Date().toISOString();
    saveStorage(data);
  }
}

export function updatePaletteColors(id: string, colors: string[]): void {
  const data = loadStorage();
  const palette = data.palettes.find(p => p.id === id);
  if (palette) {
    palette.colors = colors.map(c => c.toLowerCase());
    palette.updatedAt = new Date().toISOString();
    saveStorage(data);
  }
}

/* ===== Export Formatters ===== */

export function formatCSSVariables(colors: string[], prefix: string = 'color'): string {
  return colors
    .map((c, i) => `  --${prefix}-${i + 1}: ${c};`)
    .join('\n');
}

export function formatCSSVariablesNamed(palette: Record<string, string>): string {
  return Object.entries(palette)
    .map(([name, hex]) => `  --${name}: ${hex};`)
    .join('\n');
}

export function formatJSON(colors: string[]): string {
  return JSON.stringify(colors, null, 2);
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

export function formatContrastSummary(
  fg: string,
  bg: string,
  ratio: number,
  aa: boolean,
  aaa: boolean,
  aaLarge: boolean,
  aaaLarge: boolean
): string {
  return `"${fg}" on "${bg}" contrast ratio: ${ratio}:1. ` +
    `WCAG: AA (normal) ${aa ? 'PASS' : 'FAIL'}, ` +
    `AA (large) ${aaLarge ? 'PASS' : 'FAIL'}, ` +
    `AAA (normal) ${aaa ? 'PASS' : 'FAIL'}, ` +
    `AAA (large) ${aaaLarge ? 'PASS' : 'FAIL'}.`;
}
