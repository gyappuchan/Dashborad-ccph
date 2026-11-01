/** One join per TikTok viewer per cooldown window. */
export class Cooldown {
  constructor(seconds, now = () => Date.now()) {
    this.ms = seconds * 1000;
    this.now = now;
    this.last = new Map();
  }
  /** Returns true and records the attempt if allowed. */
  tryUse(key) {
    const t = this.now();
    const prev = this.last.get(key);
    if (prev !== undefined && t - prev < this.ms) return false;
    this.last.set(key, t);
    return true;
  }
}

/** Sends messages one by one with a minimum gap, to respect API rate limits. */
export class Sender {
  constructor(sendFn, intervalMs, maxPending = 200) {
    this.sendFn = sendFn;
    this.intervalMs = intervalMs;
    this.maxPending = maxPending;
    this.pending = [];
    this.running = false;
  }
  push(msg) {
    if (this.pending.length >= this.maxPending) return false;
    this.pending.push(msg);
    this.run();
    return true;
  }
  async run() {
    if (this.running) return;
    this.running = true;
    while (this.pending.length) {
      const msg = this.pending.shift();
      try {
        await this.sendFn(msg);
      } catch (err) {
        console.error('[send] failed:', err.message);
      }
      await new Promise((r) => setTimeout(r, this.intervalMs));
    }
    this.running = false;
  }
}
