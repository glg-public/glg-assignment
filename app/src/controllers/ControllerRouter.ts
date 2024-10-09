import { Router as ExpressRouter } from "express";

export abstract class ControllerRouter<C> {
  protected readonly controller: C;
  protected readonly router: ExpressRouter;

  protected constructor(ControllerCreator: { new (): C }) {
    this.controller = new ControllerCreator();
    this.router = ExpressRouter();
  }

  public abstract getRouter(): ExpressRouter;
}
