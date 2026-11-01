// Pure helpers: no network, easy to test.

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

/** Extract a Roblox username from a chat line, or null. Accepts "name" or "!join name". */
export function extractUsername(comment) {
  if (typeof comment !== 'string') return null;
  let text = comment.trim();
  const cmd = text.match(/^[!/](?:join|roblox)\s+(\S+)$/i);
  if (cmd) text = cmd[1];
  if (text.startsWith('@')) text = text.slice(1);
  if (!USERNAME_RE.test(text)) return null;
  // Roblox rules: no leading/trailing underscore, at most one underscore.
  if (text.startsWith('_') || text.endsWith('_')) return null;
  if ((text.match(/_/g) || []).length > 1) return null;
  return text;
}

/** Normalise chat event fields across library versions. */
export function readChat(data) {
  const viewer = data?.user?.uniqueId ?? data?.uniqueId ?? '';
  return { viewer, comment: data?.comment ?? '' };
}

/**
 * Normalise a gift event. Returns null for events that must be ignored
 * (streakable gifts that have not finished their streak yet).
 */
export function readGift(data, maxRepeat = 5) {
  const type = data?.giftDetails?.giftType ?? data?.giftType;
  const repeatEnd = data?.repeatEnd;
  // giftType 1 = streakable: only count when the streak ends.
  if (type === 1 && !repeatEnd) return null;
  const name = data?.giftDetails?.giftName ?? data?.giftName;
  if (!name) return null;
  const repeat = Math.max(1, Number(data?.repeatCount) || 1);
  return {
    gift: String(name),
    count: Math.min(repeat, maxRepeat),
    viewer: data?.user?.uniqueId ?? data?.uniqueId ?? '',
  };
}

/** Build the JSON string sent to Roblox. Must stay under 1 KB. */
export function encodeMessage(msg) {
  const json = JSON.stringify(msg);
  if (Buffer.byteLength(json) > 1000) throw new Error('message too large');
  return json;
}
