import { createApp } from "./create-app.js";

const { app, config } = await createApp();
app.enableShutdownHooks();
await app.listen(config.port);
console.log(`API ready on http://localhost:${config.port}/api`);
