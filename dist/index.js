"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const initialize_helper_1 = require("./helper/initialize.helper");
const server_1 = require("./server");
async function bootstrap() {
    try {
        await (0, initialize_helper_1.start)();
        (0, server_1.startHttpServer)();
        setInterval(() => { }, 1 << 30);
    }
    catch (err) {
        console.error('Failed to start NBS mediator', err);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=index.js.map