// Builds build/DanceStage.rbxlx: the game scripts plus the full default-theme stage baked in.
// The stage comes from the real ThemeManager (run on the mocked Roblox API), so there is no duplicate
// map definition to keep in sync. Usage: node build-place.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { runBody, reflection, types as t, createDom, readXml, propertyInfo, here } from './harness.mjs';

const srcDir = join(here, '..', 'src');
const outFile = join(here, '..', 'build', 'DanceStage.rbxlx');

// ---- convert values captured from the mock into rbx-dom typed values --------------------------------
function convert(className, prop, value) {
  const info = propertyInfo(className, prop);
  if (!info) throw new Error(`${className}.${prop} is not a known property`);
  const dt = info.DataType;
  if (value && typeof value === 'object') {
    if (value.t === 'Vector3') return t.taggedVariant('Vector3', t.vector3(...value.v));
    if (value.t === 'Color3') return t.taggedVariant('Color3', t.color3(...value.v));
    if (value.t === 'CFrame') {
      // rbx-dom takes the rows of the rotation matrix; ours are the Right/Up/Back columns
      const [r, u, b] = [value.r, value.u, value.b];
      const rows = [0, 1, 2].map((i) => t.vector3(r[i], u[i], b[i]));
      return t.taggedVariant('CFrame', t.cframeFromMatrix(t.vector3(...value.p), ...rows));
    }
    throw new Error(`cannot convert ${className}.${prop}`);
  }
  if (typeof value === 'string' && dt?.Enum) {
    const item = value.split('.')[2];
    const number = reflection.enumItems(dt.Enum)[item];
    if (number === undefined || !value.startsWith(`Enum.${dt.Enum}.`)) throw new Error(`bad enum ${value} for ${className}.${prop}`);
    return t.taggedVariant('Enum', t.enumValue(number));
  }
  if (dt?.Value && ['Bool', 'Float32', 'Float64', 'Int32', 'Int64', 'String'].includes(dt.Value)) {
    return t.taggedVariant(dt.Value, value);
  }
  return value;
}

function toSpec(node) {
  return {
    className: node.class,
    name: node.name,
    properties: Object.fromEntries(Object.entries(node.props).map(([k, v]) => [k, convert(node.class, k, v)])),
    children: node.children.map(toSpec),
  };
}

// ---- scripts ---------------------------------------------------------------------------------------
function scriptSpecs(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.luau'))
    .sort()
    .map((file) => {
      const base = file.replace(/\.luau$/, '');
      const [name, kind] = base.split('.');
      const className = kind === 'server' ? 'Script' : kind === 'client' ? 'LocalScript' : 'ModuleScript';
      return { className, name, properties: { Source: readFileSync(join(dir, file), 'utf8') } };
    });
}

// ---- assemble --------------------------------------------------------------------------------------
const scene = JSON.parse(await runBody('build-scene.body.luau'));
const stageMap = toSpec(scene.map);
const lighting = toSpec(scene.lighting);

const place = {
  className: 'DataModel',
  children: [
    {
      className: 'Workspace',
      children: [
        stageMap,
        {
          // Far behind the camera so the streamer's own character is never in shot
          className: 'SpawnLocation',
          name: 'SpawnLocation',
          properties: {
            Anchored: t.taggedVariant('Bool', true),
            Neutral: t.taggedVariant('Bool', true),
            Duration: t.taggedVariant('Int32', 0),
            Size: t.taggedVariant('Vector3', t.vector3(6, 1, 6)),
            CFrame: t.taggedVariant('CFrame', t.cframeFromPosition(t.vector3(0, 0.5, 70))),
          },
        },
      ],
    },
    lighting,
    {
      className: 'ServerScriptService',
      children: [{ className: 'Folder', name: 'Stage', children: scriptSpecs(join(srcDir, 'server')) }],
    },
    {
      className: 'StarterPlayer',
      children: [{ className: 'StarterPlayerScripts', name: 'StarterPlayerScripts', children: scriptSpecs(join(srcDir, 'client')) }],
    },
  ],
};

const dom = createDom(place);
let text = Buffer.from(dom.toXml()).toString('utf8');

// rbx-dom writes script source as <string>; Roblox Studio itself writes <ProtectedString>. Use the
// canonical form so Studio is certain to load the scripts. (Sources never contain "]]>", checked here.)
const scripts = [...scriptSpecs(join(srcDir, 'server')), ...scriptSpecs(join(srcDir, 'client'))];
for (const s of scripts) {
  if (s.properties.Source.includes(']]>')) throw new Error(`${s.name} contains "]]>", which would break the CDATA block`);
}
const before = (text.match(/<string name="Source">/g) ?? []).length;
text = text.replace(/<string name="Source">(<!\[CDATA\[[\s\S]*?\]\]>)<\/string>/g, '<ProtectedString name="Source">$1</ProtectedString>');
const converted = (text.match(/<ProtectedString name="Source">/g) ?? []).length;
if (before !== scripts.length || converted !== scripts.length || /<string name="Source">/.test(text)) {
  throw new Error(`Source conversion mismatch: ${before} found, ${converted} converted, ${scripts.length} expected`);
}
const xml = Buffer.from(text, 'utf8');
mkdirSync(join(here, '..', 'build'), { recursive: true });
writeFileSync(outFile, xml);

// ---- verify the written file by reading it back ----------------------------------------------------
const back = readXml(xml);
const counts = {};
const byKey = new Map();
(function walk(node) {
  counts[node.class] = (counts[node.class] ?? 0) + 1;
  byKey.set(`${node.class}:${node.name}`, node);
  node.children.forEach(walk);
})(back.view());

console.log(`Theme baked in: ${scene.theme}`);
console.log(`Wrote ${outFile} (${(Buffer.byteLength(xml) / 1024).toFixed(0)} KB)`);
console.log('Instances:', JSON.stringify(counts));

const problems = [];
for (const key of ['Script:Main', 'Script:Bridge', 'Script:DevCommands', 'ModuleScript:ThemeManager', 'ModuleScript:Themes', 'LocalScript:StreamCamera', 'Folder:StageMap', 'Part:Floor', 'SpawnLocation:SpawnLocation']) {
  if (!byKey.has(key)) problems.push(`missing ${key}`);
}
const norm = (x) => String(x).replace(/\r\n/g, '\n');
for (const s of scripts) {
  const node = byKey.get(`${s.className}:${s.name}`);
  const read = node?.properties.Source;
  const readText = typeof read === 'string' ? read : read?.String ?? read?.ProtectedString ?? JSON.stringify(read);
  if (!node) problems.push(`missing ${s.className}:${s.name}`);
  else if (norm(readText) !== norm(s.properties.Source)) problems.push(`${s.name} source differs after read-back`);
}
if (problems.length) {
  console.error('Read-back check FAILED:', problems.join('; '));
  process.exit(1);
}
console.log(`Read-back check passed: required instances present and all ${scripts.length} scripts match their source files exactly.`);
