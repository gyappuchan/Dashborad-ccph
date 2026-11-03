import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';
import { createBridge } from './bridge.js';
import { Cooldown, Sender } from './limits.js';
import { createPublisher, createUsernameChecker } from './roblox.js';

/** Owns the TikTok connection. Used by both the CLI and the local web app. */
export function createController({ log = console.log } = {}) {
  let connection = null;
  let stopping = false;
  let retryTimer = null;
  const checkUsername = createUsernameChecker();

  function makePublish(cfg) {
    if (cfg.dryRun) return async (msg) => log(`[dry-run] would publish: ${JSON.stringify(msg)}`);
    return createPublisher({ universeId: cfg.universeId, apiKey: cfg.apiKey, topic: cfg.topic });
  }

  function validate(cfg, { needTikTok }) {
    if (needTikTok && !cfg.tiktokUsername) throw new Error('กรุณาใส่ชื่อ TikTok');
    if (!cfg.dryRun && (!cfg.universeId || !cfg.apiKey)) throw new Error('โหมดส่งจริงต้องมี Universe ID และ API key');
  }

  async function start(cfg) {
    if (connection) throw new Error('กำลังทำงานอยู่แล้ว');
    validate(cfg, { needTikTok: true });
    stopping = false;
    const bridge = createBridge({
      checkUsername,
      sender: new Sender(makePublish(cfg), cfg.sendIntervalMs),
      cooldown: new Cooldown(cfg.joinCooldownSec),
      maxGiftRepeat: cfg.maxGiftRepeat,
      log,
    });
    const conn = new TikTokLiveConnection(cfg.tiktokUsername);
    connection = conn;
    conn.on(WebcastEvent.CHAT, (d) => bridge.onChat(d).catch((e) => log(`[error] ${e.message}`)));
    conn.on(WebcastEvent.GIFT, (d) => bridge.onGift(d));
    conn.on(ControlEvent.CONNECTED, () => log(`เชื่อมต่อไลฟ์ @${cfg.tiktokUsername} แล้ว${cfg.dryRun ? ' (ทดลอง ไม่ส่งเข้าเกม)' : ''}`));
    conn.on(ControlEvent.ERROR, (e) => log(`[tiktok] error: ${e?.message ?? e}`));
    conn.on(ControlEvent.DISCONNECTED, () => {
      if (stopping || connection !== conn) return;
      log('หลุดการเชื่อมต่อ จะลองใหม่ใน 10 วินาที...');
      retryTimer = setTimeout(() => {
        conn.connect().catch((e) => log(`[tiktok] เชื่อมต่อใหม่ไม่สำเร็จ: ${e.message}`));
      }, 10000);
    });
    try {
      await conn.connect();
    } catch (e) {
      connection = null;
      throw new Error(`เชื่อมต่อไม่ได้ (ไลฟ์อยู่หรือเปล่า?): ${e.message}`);
    }
  }

  function stop() {
    stopping = true;
    clearTimeout(retryTimer);
    if (connection) {
      try {
        connection.disconnect();
      } catch {
        /* already closed */
      }
      connection = null;
      log('หยุดการทำงานแล้ว');
    }
  }

  /** Send a fake join/gift to the game without TikTok (for testing the game side). */
  async function sendTest(cfg, test) {
    validate(cfg, { needTikTok: false });
    const publish = makePublish(cfg);
    if (test.kind === 'join') {
      const name = await checkUsername(String(test.username || ''));
      if (!name) throw new Error('ไม่พบชื่อ Roblox นี้');
      await publish({ kind: 'join', username: name, by: 'test' });
    } else if (test.kind === 'gift') {
      await publish({ kind: 'gift', gift: String(test.gift || 'Rose'), count: 1, by: 'test' });
    } else {
      throw new Error('ชนิดการทดสอบไม่ถูกต้อง');
    }
    log(`ส่งทดสอบ ${test.kind} แล้ว`);
  }

  return { start, stop, sendTest, isRunning: () => connection !== null };
}
