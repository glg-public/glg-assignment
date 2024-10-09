import axios, { AxiosError } from "axios";

import { Instance } from "./Instance";
import { Logger } from "../../utilities/logger/Logger";
import { InstanceSignal } from "./InstanceSignal";

export class SingletonInstance extends Instance {
  private jobStartEpoch: number | undefined = undefined;
  protected logger: Logger;

  protected constructor({ loggerPrefix}: { loggerPrefix: string }) {
    super();
    this.logger = new Logger(loggerPrefix);
  }

  public async start(): Promise<void> {
    try {
      this.jobStartEpoch = Date.now();
    } catch (error: any) {
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      const jobEndEpoch = Date.now();
      this.logger.dashboard({ action: "JOB_END", jobRuntimeMs: jobEndEpoch - this.jobStartEpoch! });
    } catch (error: any) {
      process.exit(1);
    }
  }

  protected handleError(error: AxiosError | any): void {
    if (axios.isAxiosError(error)) {
      const err = <AxiosError>error;
      this.logger.error(err.response?.data || err.stack || err.message);
      this.logger.dashboard({ action: "ERROR", error: err.response?.data || err.stack || err.message });
    } else {
      this.logger.error(error.stack || error.message);
      this.logger.dashboard({ action: "ERROR", error: error.stack || error.message });
    }
    this.emit(InstanceSignal.ERROR_SHUTDOWN);
  }
}
