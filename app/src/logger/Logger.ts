import util from "util";
import chalk from "chalk";

import { LogLevel, LogLevelValue } from "./LogLevel";

const { LOG_LEVEL, INSTANCE_TYPE, DISABLE_DASHBOARD_LOGGING, DASHBOARD_LOGGING_PREFIX } = process.env;

interface DashboardLog {
  action: string;
}

const InstanceType = (INSTANCE_TYPE || "UNKNOWN").toUpperCase();

export class Logger {
  constructor(private readonly prefix: string) {
    this.trace(`Logger Instance Created`);
  }

  public trace(...messages: any): void {
    if (!this.shouldLog(LogLevel.TRACE)) return;
    messages.forEach((message: any) => {
      const format = this.formatMessage(message);
      console.debug(chalk.dim.magenta(`[TRACE] [${this.prefix}]`), chalk.dim.magenta(format));
    });
  }

  public debug(...messages: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    messages.forEach((message: any) => {
      const format = this.formatMessage(message);
      console.debug(chalk.dim.yellow(`[DEBUG] [${this.prefix}]`), chalk.dim.yellow(format));
    });
  }

  public info(...messages: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    messages.forEach((message: any) => {
      const format = this.formatMessage(message);
      console.info(chalk.blueBright(`[INFO] [${this.prefix}]`), chalk.blueBright(format));
    });
  }

  public warn(...messages: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    messages.forEach((message: any) => {
      const format = this.formatMessage(message);
      console.warn(chalk.bgYellow(`[WARN] [${this.prefix}]`), chalk.bgYellow(format));
    });
  }

  public error(...messages: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    messages.forEach((message: any) => {
      const format = this.formatMessage(message);
      console.error(chalk.red(`[ERROR] [${this.prefix}]`), chalk.red(format));
    });
  }

  public dashboard<L extends DashboardLog>(log: L): void {
    if (DISABLE_DASHBOARD_LOGGING === "true") return;
    console.log(DASHBOARD_LOGGING_PREFIX, JSON.stringify({ ...log, instance: InstanceType, source: this.prefix }));
  }

  private shouldLog(targetLogLevel: LogLevel): boolean {
    const currentLogLevelValue = LogLevelValue[this.getLogLevel()];
    const targetLogLevelValue = LogLevelValue[targetLogLevel];
    return currentLogLevelValue <= targetLogLevelValue;
  }

  private getLogLevel(): LogLevel {
    if (!LOG_LEVEL || !Object.values(LogLevel).includes(LOG_LEVEL.toUpperCase() as any)) return LogLevel.INFO;
    return LOG_LEVEL.toUpperCase() as LogLevel;
  }

  private formatMessage(message?: any) {
    const isString = Object.prototype.toString.call(message) === "[object String]";
    return isString ? message : util.inspect(message, { depth: null });
  }
}
