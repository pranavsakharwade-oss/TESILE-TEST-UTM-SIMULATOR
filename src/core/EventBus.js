/**
 * EventBus - High-performance Decoupled Pub/Sub Event Dispatcher
 * Bridges Physics, 3D Graphics, Interaction Rigs, and HUD Telemetry
 */
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback);
    return () => this.off(eventName, callback);
  }

  off(eventName, callback) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).delete(callback);
    }
  }

  emit(eventName, payload) {
    if (this.listeners.has(eventName)) {
      for (const callback of this.listeners.get(eventName)) {
        try {
          callback(payload);
        } catch (err) {
          console.error(`[EventBus] Error in listener for "${eventName}":`, err);
        }
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}

export const events = new EventBus();
