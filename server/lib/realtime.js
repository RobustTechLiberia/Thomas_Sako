/**
 * In-memory Server-Sent Events hub for realtime poll updates.
 *
 * Uses zero external infrastructure: any Node process can broadcast, and
 * each connected client immediately receives the latest cached results so a
 * fresh page load always shows current counts without an extra round-trip.
 */
export class RealtimeHub {
  constructor() {
    this.clients = new Map(); // res -> { pollId, heartbeat }
    this.cache = new Map(); // pollId -> { payload, at }
  }

  static serializeEvent(event, data) {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  }

  setCached(pollId, payload) {
    this.cache.set(pollId, { payload, at: Date.now() });
  }

  getCached(pollId) {
    const entry = this.cache.get(pollId);
    return entry ? entry.payload : null;
  }

  hasCached(pollId, ttlMs = 30_000) {
    const entry = this.cache.get(pollId);
    return !!entry && Date.now() - entry.at < ttlMs;
  }

  /**
   * Registers a connected SSE response for a poll. Immediately sends a
   * snapshot event if cached results exist so subscribers start with data.
   */
  subscribe(res, pollId) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write("retry: 3000\n\n");

    const cached = this.getCached(pollId);
    if (cached) {
      res.write(RealtimeHub.serializeEvent("poll-update", cached));
    }
    res.write(RealtimeHub.serializeEvent("ready", { pollId }));

    const heartbeat = setInterval(() => {
      res.write(": ping\n\n");
    }, 25_000);

    const listener = () => {
      clearInterval(heartbeat);
      this.clients.delete(res);
      res.end();
    };
    res.on("close", listener);
    res.on("error", listener);

    this.clients.set(res, { pollId, heartbeat });
    return () => {
      clearInterval(heartbeat);
      this.clients.delete(res);
      res.end();
    };
  }

  /** Broadcasts a poll-update to every client subscribed to `pollId`. */
  broadcast(pollId, payload) {
    this.setCached(pollId, payload);
    for (const [res, meta] of this.clients.entries()) {
      if (meta.pollId === pollId) {
        try {
          res.write(RealtimeHub.serializeEvent("poll-update", payload));
        } catch {
          // client gone; cleaned up by the close listener
        }
      }
    }
  }

  closeAll() {
    for (const [, meta] of this.clients.entries()) {
      clearInterval(meta.heartbeat);
    }
    for (const [res] of this.clients.entries()) {
      try {
        res.end();
      } catch {
        /* ignore */
      }
    }
    this.clients.clear();
  }
}

export const createHub = () => new RealtimeHub();
export default createHub;
