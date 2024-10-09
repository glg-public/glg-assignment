import axios, { AxiosError } from "axios";
import { Request, Response } from "express";
import { Logger } from "../logger/Logger";

export class Controller {
  protected readonly logger: Logger;

  protected constructor(logPrefix: string) {
    this.logger = new Logger(logPrefix);
  }

  protected handleError(req: Request, res: Response, error: AxiosError | any) {
    if (axios.isAxiosError(error)) {
      const err = <AxiosError>error;
      this.logger.error(`${err.response?.status} on ${req.path}`, err.response?.data);
    } else {
      this.logger.error(error.stack || error.message);
    }
    res.status(500).json({ success: false, error: "INTERNAL_ERROR" });
  }
}
