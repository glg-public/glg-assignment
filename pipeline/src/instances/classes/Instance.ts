import { EventEmitter } from "events";

export abstract class Instance extends EventEmitter {
  protected constructor() {
    super();
  }

  public abstract start(): Promise<void>;
  public abstract stop(): Promise<void>;
}
