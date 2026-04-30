/**
 * @fileoverview A lightweight publish-subscribe (pub-sub) event bus.
 * 一个轻量级的发布-订阅（pub-sub）事件总线。
 * Decouples game systems by letting them communicate through named events
 * rather than holding direct references to each other.
 * 通过命名事件进行通信，将游戏系统解耦，无需持有对彼此的直接引用。
 *
 * Usage:
 *   const bus = new EventBus();
 *   bus.subscribe("playerDied", (data) => console.log(data));
 *   bus.publish("playerDied", { reason: "spike" });
 */

export class EventBus {
    constructor() {
        /** @type {Object.<string, Function[]>} Map of event name → list of callbacks. | 事件名到回调函数列表的映射。 */
        this.events = {};
    }

    /**
     * Register a callback to be called whenever the given event is published.
     * 注册一个回调函数，每当指定事件被发布时调用。
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
     * 从事件中移除一个之前注册的回调函数。
     * Does nothing if the event or callback is not found.
     * 若事件或回调不存在，则不做任何操作。
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
     * 触发一个事件，按注册顺序调用所有订阅者。
     * @param {string} event - The event name to fire.
     * @param {*}      data  - Arbitrary payload passed to every callback.
     */
    publish(event, data) {
        if(!this.events[event]) return;
        this.events[event].forEach(cb => cb(data));
    }
}
