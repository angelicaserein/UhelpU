/**
 * @fileoverview A lightweight publish-subscribe (pub-sub) event bus.
 * Decouples game systems by letting them communicate through named events
 * rather than holding direct references to each other.
 *
 * Usage:
 *   const bus = new EventBus();
 *   bus.subscribe("playerDied", (data) => console.log(data));
 *   bus.publish("playerDied", { reason: "spike" });
 */

export class EventBus {
    constructor() {
        /** @type {Object.<string, Function[]>} Map of event name → list of callbacks. */
        this.events = {};
    }

    /**
     * Register a callback to be called whenever the given event is published.
     * @param {string}   event    - The event name (use EventTypes constants to avoid typos).
     * @param {Function} callback - Handler to invoke; receives the published data as its argument.
     */
    subscribe(event, callback) {
        if(!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    /**
     * Remove a previously registered callback from an event.
     * Does nothing if the event or callback is not found.
     * @param {string}   event    - The event name to unsubscribe from.
     * @param {Function} callback - The exact function reference that was passed to subscribe().
     */
    unsubscribe(event, callback) {
        if(!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);

        if(this.events[event].length === 0) {
            delete this.events[event];
        }
    }

    /**
     * Fire an event, calling every subscriber in the order they were registered.
     * @param {string} event - The event name to fire.
     * @param {*}      data  - Arbitrary payload passed to every callback.
     */
    publish(event, data) {
        if(!this.events[event]) return;
        this.events[event].forEach(cb => cb(data));
    }
}
