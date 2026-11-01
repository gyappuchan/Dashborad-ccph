import 'node:process';
import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';
import { createBridge } from './bridge.js';
import { Cooldown, Sender } from './limits.js';
import { createPublisher, createUsernameChecker } from './roblox.js';

const dryRun = process.argv.includes('--dry-run');
const env = process.env;

function need(name) {
  if (!env[name]) {
    console.error(`Missing ${name}. Copy .env.example to .env, fill it in, then run: node --env-file=.env src/index.js`);
    process.exit(1);
  }
  return env[name];
}

const tiktokUser = need('TIKTOK_USERNAME');
const publish = dryRun
  ? async (msg) => console.log('[dry-run] would publish:', JSON.stringify(msg))
  : createPublisher({
      universeId: need('ROBLOX_UNIVERSE_ID'),
      apiKey: need('ROBLOX_API_KEY'),
      topic: env.ROBLOX_TOPIC || 'TikTokStage',
    });

const bridge = createBridge({
  checkUsername: createUsernameChecker(),
  sender: new Sender(publish, Number(env.SEND_INTERVAL_MS) || 300),
  cooldown: new Cooldown(Number(env.JOIN_COOLDOWN_SEC) || 60),
  maxGiftRepeat: Number(env.MAX_GIFT_REPEAT) || 5,
});

const connection = new TikTokLiveConnection(tiktokUser);
connection.on(WebcastEvent.CHAT, (d) => bridge.onChat(d).catch((e) => console.error(e)));
connection.on(WebcastEvent.GIFT, (d) => bridge.onGift(d));
connection.on(ControlEvent.CONNECTED, () => console.log(`Connected to @${tiktokUser}'s LIVE${dryRun ? ' (dry-run)' : ''}`));
connection.on(ControlEvent.ERROR, (e) => console.error('[tiktok] error:', e?.message ?? e));
connection.on(ControlEvent.DISCONNECTED, () => {
  console.log('Disconnected. Retrying in 10s...');
  setTimeout(() => connection.connect().catch((e) => console.error('[tiktok] reconnect failed:', e.message)), 10000);
});

connection.connect().catch((e) => {
  console.error('Could not connect (is the account LIVE?):', e.message);
  process.exit(1);
});
