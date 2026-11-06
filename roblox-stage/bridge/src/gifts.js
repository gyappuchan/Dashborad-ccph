import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const CONFIG_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'server', 'Config.luau');

/**
 * Gifts are defined once, in the game's Config.luau (lines like `Rose = { Action = "Hearts", ... },`
 * inside `Gifts = { ... }`). Reading them from there keeps this panel in sync with the game.
 * Returns [{ name, action }]; an empty list if the file is not next to the bridge.
 */
export function listGifts(file = CONFIG_FILE) {
  try {
    const text = readFileSync(file, 'utf8');
    const block = text.match(/^\s*Gifts = \{([\s\S]*?)^\t\},/m)?.[1] ?? '';
    return [...block.matchAll(/^\s*(\w+) = \{[^}]*?\b(?:Action|Effect) = "(\w+)"/gm)].map((m) => ({ name: m[1], action: m[2] }));
  } catch {
    return [];
  }
}
