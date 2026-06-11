/* ===== URL Parameter Utilities ===== */

/**
 * Liest einen Query-Parameter aus der URL (Client-side).
 * Liefert null wenn nicht vorhanden oder ungültig.
 */
export function getQueryParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

/**
 * Aktualisiert einen Query-Parameter in der URL ohne Reload (History API).
 * Wenn value null oder leer ist, wird der Parameter entfernt.
 */
export function setQueryParam(key: string, value: string | null): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (value && value.length > 0) {
    url.searchParams.set(key, value);
  } else {
    url.searchParams.delete(key);
  }
  window.history.replaceState({}, '', url.toString());
}

/**
 * Batch-Update mehrerer Query-Parameter.
 */
export function setQueryParams(params: Record<string, string | null>): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(params)) {
    if (value && value.length > 0) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  }
  window.history.replaceState({}, '', url.toString());
}

/**
 * Parst einen HEX-Farbwert aus Query-Param.
 * Akzeptiert: "7c3aed", "#7c3aed", "7c3", "#7c3"
 * Liefert normalisierten HEX (#7c3aed) oder null.
 */
export function parseHexParam(value: string | null): string | null {
  if (!value) return null;
  let hex = value.trim().replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  if (hex.length === 6 && /^[0-9a-fA-F]+$/.test(hex)) {
    return '#' + hex.toLowerCase();
  }
  return null;
}

/**
 * Erstellt einen Link zu einem anderen Tool mit Query-Param.
 * Beispiel: toolLink('/color-picker/', '7c3aed') → '/color-picker/?color=7c3aed'
 */
export function toolLink(path: string, params: Record<string, string>): string {
  const url = new URL(path, 'https://color-helper.com');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.pathname + url.search;
}

/**
 * Sammlung von Tool-Link-Helpern für einheitliche Querverweise.
 */
export const toolLinks = {
  colorPicker: (hex: string) => toolLink('/color-picker/', { color: hex.replace('#', '') }),
  colorConverter: (hex: string) => toolLink('/color-converter/', { color: hex.replace('#', '') }),
  paletteGenerator: (hex: string) => toolLink('/color-palette-generator/', { base: hex.replace('#', '') }),
  contrastChecker: (fg: string, bg: string) =>
    toolLink('/contrast-checker/', { fg: fg.replace('#', ''), bg: bg.replace('#', '') }),
  gradientGenerator: (from: string, to: string, angle?: number) =>
    toolLink('/gradient-generator/', {
      from: from.replace('#', ''),
      to: to.replace('#', ''),
      ...(angle !== undefined ? { angle: String(angle) } : {}),
    }),
  colorPage: (slug: string) => `/colors/${slug}/`,
};
