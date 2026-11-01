import test from 'node:test';
import assert from 'node:assert/strict';
import { extractUsername, readGift, encodeMessage } from '../src/parse.js';
import { Cooldown, Sender } from '../src/limits.js';
import { createBridge } from '../src/bridge.js';

test('extractUsername accepts valid names and commands', () => {
  assert.equal(extractUsername('Builderman'), 'Builderman');
  assert.equal(extractUsername('  !join Cool_Guy1 '), 'Cool_Guy1');
  assert.equal(extractUsername('@Roblox'), 'Roblox');
});

test('extractUsername rejects chatter and invalid names', () => {
  for (const bad of ['hello everyone', 'hi', '_bad', 'bad_', 'a_b_c', 'x'.repeat(21), '', null, '😀😀😀']) {
    assert.equal(extractUsername(bad), null, String(bad));
  }
});

test('readGift ignores unfinished streaks and caps repeats', () => {
  assert.equal(readGift({ giftDetails: { giftName: 'Rose', giftType: 1 }, repeatEnd: false }), null);
  const g = readGift({ giftDetails: { giftName: 'Rose', giftType: 1 }, repeatEnd: true, repeatCount: 99, user: { uniqueId: 'a' } }, 5);
  assert.deepEqual(g, { gift: 'Rose', count: 5, viewer: 'a' });
  assert.equal(readGift({ giftDetails: { giftName: 'Lion', giftType: 2 }, repeatCount: 1 }).count, 1);
});

test('encodeMessage rejects oversized payloads', () => {
  assert.throws(() => encodeMessage({ x: 'a'.repeat(1100) }));
});

test('Cooldown blocks repeat use within the window', () => {
  let t = 0;
  const c = new Cooldown(60, () => t);
  assert.ok(c.tryUse('a'));
  t = 30_000;
  assert.ok(!c.tryUse('a'));
  t = 61_000;
  assert.ok(c.tryUse('a'));
});

test('Sender sends in order and drops when the queue is full', async () => {
  const out = [];
  const s = new Sender(async (m) => out.push(m), 1, 2);
  assert.ok(s.push(1)); // taken immediately by the running loop
  assert.ok(s.push(2));
  assert.ok(s.push(3)); // pending is now [2, 3] = full
  assert.ok(!s.push(4)); // dropped
  await new Promise((r) => setTimeout(r, 50));
  assert.deepEqual(out, [1, 2, 3]);
});

test('bridge: valid join is sent once, cooldown and unknown users dropped', async () => {
  const sent = [];
  const bridge = createBridge({
    checkUsername: async (n) => (n === 'Roblox' ? 'Roblox' : null),
    sender: { push: (m) => sent.push(m) },
    cooldown: new Cooldown(60),
    log: () => {},
  });
  await bridge.onChat({ user: { uniqueId: 'v1' }, comment: 'Roblox' });
  await bridge.onChat({ user: { uniqueId: 'v1' }, comment: 'Roblox' }); // cooldown
  await bridge.onChat({ user: { uniqueId: 'v2' }, comment: 'NoSuchUserXyz' }); // not found
  await bridge.onChat({ user: { uniqueId: 'v3' }, comment: 'lol nice' }); // chatter
  assert.deepEqual(sent, [{ kind: 'join', username: 'Roblox', by: 'v1' }]);
});

test('bridge: gift is forwarded', () => {
  const sent = [];
  const bridge = createBridge({ checkUsername: async () => null, sender: { push: (m) => sent.push(m) }, cooldown: new Cooldown(1), log: () => {} });
  bridge.onGift({ giftDetails: { giftName: 'Galaxy', giftType: 2 }, repeatCount: 1, user: { uniqueId: 'v9' } });
  assert.deepEqual(sent, [{ kind: 'gift', gift: 'Galaxy', count: 1, by: 'v9' }]);
});
