import { Logger } from "./utilities/logger/Logger";

import { InstanceSignal } from "./instances/classes/InstanceSignal";
import { InstanceManager } from "./instances/classes/InstanceManager";

const logger = new Logger("Application");

const { GITHUB_SHA } = process.env;

const signalHandlers: Array<{ signal: InstanceSignal; exitCode: number; message: string }> = [
  { signal: InstanceSignal.KILL_SWITCH, exitCode: 1, message: "Received kill switch signal!" },
  { signal: InstanceSignal.ERROR_SHUTDOWN, exitCode: 1, message: "Received error shutdown signal!" },
  { signal: InstanceSignal.CLEAN_SHUTDOWN, exitCode: 0, message: "Received clean shutdown signal!" }
];

export class Application {
  private static instance?: Application;

  private readonly instanceManager: InstanceManager;

  constructor() {
    this.instanceManager = new InstanceManager();
    signalHandlers.forEach(({ signal, exitCode, message }) => {
      this.instanceManager.on(signal, async () => {
        logger.debug(message);
        await this.stop(exitCode);
      });
    });
  }

  public async start(): Promise<void> {
    try {
      await this.instanceManager.start();
    } catch (e) {
      logger.error(e);
      process.exit(1);
    }
  }

  public async stop(code?: number): Promise<void> {
    try {
      await this.instanceManager.stop();
    } catch (error: any) {
      logger.error(error);
      process.exit(1);
    }

    logger.dashboard({ action: "SHUTDOWN" });
    logger.debug("Shutdown handled successfully!");
    /* Do cleanup if there is any */
    process.exit(code || 0);
  }

  public static getInstance(): Application {
    if (!this.instance) this.instance = new Application();
    return this.instance;
  }
}
