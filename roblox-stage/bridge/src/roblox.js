import { encodeMessage } from './parse.js';

const USERS_API = 'https://users.roblox.com/v1/usernames/users';

/** Resolve a Roblox username to its canonical name (cached). Returns null if it does not exist. */
export function createUsernameChecker(fetchFn = fetch) {
  const cache = new Map();
  return async function check(username) {
    const key = username.toLowerCase();
    if (cache.has(key)) return cache.get(key);
    const res = await fetchFn(USERS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
    });
    if (!res.ok) throw new Error(`users API ${res.status}`);
    const body = await res.json();
    const name = body?.data?.[0]?.name ?? null;
    cache.set(key, name);
    return name;
  };
}

/** Publish a message to the game via Open Cloud Messaging Service. */
export function createPublisher({ universeId, apiKey, topic }, fetchFn = fetch) {
  const url = `https://apis.roblox.com/messaging-service/v1/universes/${universeId}/topics/${encodeURIComponent(topic)}`;
  return async function publish(msg) {
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ message: encodeMessage(msg) }),
    });
    if (!res.ok) throw new Error(`messaging API ${res.status} ${await res.text()}`);
  };
}
