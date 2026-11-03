import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'config.json');

export const DEFAULTS = {
  tiktokUsername: '',
  universeId: '',
  apiKey: '',
  topic: 'TikTokStage',
  joinCooldownSec: 60,
  maxGiftRepeat: 5,
  sendIntervalMs: 300,
  dryRun: true,
};

export function loadConfig() {
  const cfg = { ...DEFAULTS };
  if (existsSync(FILE)) {
    try {
      Object.assign(cfg, JSON.parse(readFileSync(FILE, 'utf8')));
    } catch {
      /* corrupt file: fall back to defaults */
    }
  }
  return cfg;
}

/** Merge a patch from the UI. An empty apiKey means "keep the saved one". */
export function mergeConfig(current, patch) {
  const next = { ...current };
  for (const key of Object.keys(DEFAULTS)) {
    if (!(key in patch)) continue;
    if (key === 'apiKey' && !patch.apiKey) continue;
    const def = DEFAULTS[key];
    if (typeof def === 'number') next[key] = Math.max(0, Number(patch[key]) || def);
    else if (typeof def === 'boolean') next[key] = !!patch[key];
    else next[key] = String(patch[key]).trim();
  }
  return next;
}

export function saveConfig(cfg) {
  writeFileSync(FILE, JSON.stringify(cfg, null, 2), { mode: 0o600 });
}

/** Never send the API key to the browser. */
export function publicConfig(cfg) {
  const { apiKey, ...rest } = cfg;
  return { ...rest, hasApiKey: !!apiKey };
}
