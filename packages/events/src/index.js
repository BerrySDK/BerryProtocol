/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BerryEventBus = void 0;
const node_events_1 = require("node:events");
class BerryEventBus {
    emitter = new node_events_1.EventEmitter();
    on(event, listener) {
        this.emitter.on(event, listener);
        return this;
    }
    once(event, listener) {
        this.emitter.once(event, listener);
        return this;
    }
    off(event, listener) {
        this.emitter.off(event, listener);
        return this;
    }
    emit(event, payload) {
        return this.emitter.emit(event, payload);
    }
}
exports.BerryEventBus = BerryEventBus;
//# sourceMappingURL=index.js.map
