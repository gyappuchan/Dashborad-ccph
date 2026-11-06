import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const THEMES_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'server', 'Themes.luau');
const FALLBACK = ['DiscoNeon', 'Halloween', 'Simple'];

/**
 * Theme names are defined once, in the game's Themes.luau (lines like `Themes.Halloween = {`).
 * Reading them from there keeps this panel in sync when you add a theme. Falls back to a built-in list
 * if the file is not next to the bridge (the game still validates every name it receives).
 */
export function listThemes(file = THEMES_FILE) {
  try {
    const names = [...readFileSync(file, 'utf8').matchAll(/^\s*Themes\.(\w+)\s*=/gm)].map((m) => m[1]);
    return names.length ? names.sort() : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
