// Command-line mode. For the local web app use: npm run app
import { createController } from './controller.js';
import { loadConfig } from './config.js';

const env = process.env;
const cfg = {
  ...loadConfig(),
  ...(env.TIKTOK_USERNAME && { tiktokUsername: env.TIKTOK_USERNAME }),
  ...(env.ROBLOX_UNIVERSE_ID && { universeId: env.ROBLOX_UNIVERSE_ID }),
  ...(env.ROBLOX_API_KEY && { apiKey: env.ROBLOX_API_KEY }),
  ...(env.ROBLOX_TOPIC && { topic: env.ROBLOX_TOPIC }),
  ...(env.JOIN_COOLDOWN_SEC && { joinCooldownSec: Number(env.JOIN_COOLDOWN_SEC) }),
  ...(env.MAX_GIFT_REPEAT && { maxGiftRepeat: Number(env.MAX_GIFT_REPEAT) }),
  ...(env.SEND_INTERVAL_MS && { sendIntervalMs: Number(env.SEND_INTERVAL_MS) }),
  dryRun: process.argv.includes('--dry-run'), // CLI sends for real unless --dry-run is given
};

const controller = createController();
controller.start(cfg).catch((e) => {
  console.error(e.message);
  process.exit(1);
});
process.on('SIGINT', () => {
  controller.stop();
  process.exit(0);
});
