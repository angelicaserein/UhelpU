export class EventBus {
    constructor() {
        this.events = {};
    }

    subscribe(event, callback) {
        if(!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    unsubscribe(event, callback) {
        if(!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);

        if(this.events[event].length === 0) {
            delete this.events[event];
        }
    }

    publish(event, data) {
        if(!this.events[event]) return;
        this.events[event].forEach(cb => cb(data));
    }
}
