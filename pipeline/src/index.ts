import { Application } from "./Application";
import { Logger } from "./utilities/logger/Logger";

const application = Application.getInstance();

const logger = new Logger("Root");

process.on("exit", async () => await application.stop());
process.on("SIGINT", async () => await application.stop());
process.on("SIGHUP", async () => await application.stop());
process.on("SIGTERM", async () => await application.stop());
process.on("SIGUSR1", async () => await application.stop());
process.on("SIGUSR2", async () => await application.stop());
process.on("beforeExit", async () => await application.stop());

process.on("uncaughtException", async (error) => {
  logger.error(error);
  process.exit(1);
});

setImmediate(async () => await application.start());
