// Shared by smoke-test.mjs and build-place.mjs: runs a Luau "body" file against the real game
// modules (src/server/*.luau) on a Luau VM with the mocked Roblox API from mock-roblox.luau.
import { LuauState } from 'luau-web';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
export const { reflection, types, createDom, readXml } = require('rbx-dom');
export const here = dirname(fileURLToPath(import.meta.url));
// STAGE_SRC lets tests point at a modified copy of the scripts
export const serverDir = process.env.STAGE_SRC ?? join(here, '..', 'src', 'server');
const clientDir = process.env.STAGE_CLIENT ?? join(here, '..', 'src', 'client');

// Main and DevCommands need live events/players, so they are only syntax-checked, not run here.
// [record name, file name without .luau, directory (default: server scripts)]
const MODULES = [['Config', 'Config'], ['Layout', 'Layout'], ['Themes', 'Themes'], ['ThemeManager', 'ThemeManager'], ['StageActor', 'StageActor'], ['GiftQueue', 'GiftQueue'], ['Effects', 'Effects'], ['StageAPI', 'StageAPI'], ['GiftActions', 'GiftActions'], ['DevActions', 'DevActions'], ['Bridge', 'Bridge.server'], ['CameraRig', 'CameraRig', clientDir]];
const CLASSES = ['Part', 'Folder', 'PointLight', 'SpotLight', 'Atmosphere', 'BloomEffect', 'Lighting', 'Workspace', 'Animation', 'Animator', 'BillboardGui', 'TextLabel', 'Humanoid', 'Model', 'ParticleEmitter', 'ColorCorrectionEffect', 'DepthOfFieldEffect'];

function toLua(value) {
  if (value === null || value === undefined) return 'nil';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  const entries = Object.entries(value).map(([k, v]) => `[${JSON.stringify(k)}]=${toLua(v)}`);
  return `{${entries.join(',')}}`;
}

/** Walks superclasses because reflection.property() does not resolve inherited properties. */
export function propertyInfo(className, prop) {
  for (const cls of reflection.superclasses(className)) {
    const info = reflection.property(cls, prop);
    if (info) return info;
  }
  return undefined;
}

function buildProps() {
  const props = {};
  for (const cls of CLASSES) {
    props[cls] = {};
    for (const parent of reflection.superclasses(cls)) {
      for (const name of reflection.propertyNames(parent)) {
        if (name in props[cls]) continue;
        const info = reflection.property(parent, name);
        const dt = info?.DataType;
        const type = dt?.Enum ? `Enum:${dt.Enum}` : dt?.Value ?? 'Unknown';
        props[cls][name] = { type, writable: ['ReadWrite', 'Write', 'Custom'].includes(info?.Scriptability) };
      }
    }
  }
  return props;
}

/** Runs `<bodyFile>` and returns what it returns (Luau string results arrive as a string or an array). */
export async function runBody(bodyFile) {
  const enums = Object.fromEntries(
    reflection.enumNames().map((n) => [n, Object.fromEntries(Object.keys(reflection.enumItems(n)).map((i) => [i, true]))]),
  );
  const mock = readFileSync(join(here, 'mock-roblox.luau'), 'utf8')
    .replace('local PROPS = __PROPS__', `local PROPS = ${toLua(buildProps())}`)
    .replace('local ENUMS = __ENUMS__', `local ENUMS = ${toLua(enums)}`);

  const moduleSource = MODULES.map(
    ([name, file, dir]) => `records[${JSON.stringify(name)}] = { run = function(script)\n${readFileSync(join(dir ?? serverDir, `${file}.luau`), 'utf8')}\nend }`,
  ).join('\n');

  const chunk = `
local mock = (function()
${mock}
end)()
local records = {}
local folder = setmetatable({}, { __index = function(_, k) return records[k] end })
function require(record)
	if not record.loaded then
		record.loaded = true
		record.value = record.run({ Parent = folder })
	end
	return record.value
end
${moduleSource}
${readFileSync(join(here, bodyFile), 'utf8')}
`;
  const state = await LuauState.createAsync();
  const fn = state.loadstring(chunk, 'harness');
  if (typeof fn === 'string') throw new Error(`Harness failed to compile: ${fn}`);
  const result = await fn();
  return Array.isArray(result) ? result.join('\n') : String(result);
}
