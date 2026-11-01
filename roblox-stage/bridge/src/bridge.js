import { extractUsername, readChat, readGift } from './parse.js';

/**
 * Wires TikTok events to the game. Dependencies are injected so it can be tested.
 * deps: { checkUsername, sender, cooldown, maxGiftRepeat, log }
 */
export function createBridge({ checkUsername, sender, cooldown, maxGiftRepeat = 5, log = console.log }) {
  async function onChat(data) {
    const { viewer, comment } = readChat(data);
    const username = extractUsername(comment);
    if (!username) return;
    if (!cooldown.tryUse(viewer)) {
      log(`[chat] ${viewer}: cooldown, ignored`);
      return;
    }
    let canonical;
    try {
      canonical = await checkUsername(username);
    } catch (err) {
      log(`[chat] lookup failed for ${username}: ${err.message}`);
      return;
    }
    if (!canonical) {
      log(`[chat] ${viewer}: "${username}" is not a Roblox user`);
      return;
    }
    log(`[join] ${viewer} -> ${canonical}`);
    sender.push({ kind: 'join', username: canonical, by: viewer });
  }

  function onGift(data) {
    const gift = readGift(data, maxGiftRepeat);
    if (!gift) return;
    log(`[gift] ${gift.viewer} sent ${gift.gift} x${gift.count}`);
    sender.push({ kind: 'gift', gift: gift.gift, count: gift.count, by: gift.viewer });
  }

  return { onChat, onGift };
}
