// Runs the real game scripts on a Luau VM with a mocked Roblox API (see harness.mjs).
// Catches runtime errors, misspelled properties/enums and wrong value types. It cannot check how
// things look or play in Roblox Studio. Usage: node smoke-test.mjs
import { runBody } from './harness.mjs';

let text;
try {
  text = await runBody('smoke-test.body.luau');
} catch (e) {
  console.error('Smoke test crashed:', e.message ?? e);
  process.exit(1);
}
console.log(text);
process.exit(text.includes('FAILED') ? 1 : 0);
