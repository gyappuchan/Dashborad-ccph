// Usage: node check-luau.mjs <file.luau>...   Compiles each file with Luau; exit 1 on any syntax error.
// loadstring() returns an error STRING on failure (it does not throw), so check the type.
import { LuauState } from 'luau-web';
import { readFileSync } from 'node:fs';
const state = await LuauState.createAsync();
let bad = 0;
for (const f of process.argv.slice(2)) {
  const result = state.loadstring(readFileSync(f, 'utf8'), f);
  if (typeof result === 'string') {
    bad++;
    console.log('FAIL ', f, '\n      ', result.split('\n')[0]);
  } else {
    console.log('OK   ', f);
  }
}
process.exit(bad ? 1 : 0);
