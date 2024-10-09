import express, { Request, Response } from "express";

import { SwaggerUtilities } from "./utilities/SwaggerUtilities";
import { Logger } from "./logger/Logger";
import { OrdersRouter } from "./controllers/orders/OrdersRouter";

const { PORT } = process.env;

const app = express();

const logger = new Logger("Server");

app.use(express.json());
app.get("/", (req: Request, res: Response) => {
  return res.status(200).send("Support Resolution Tool </br><a href='./docs/'>Documentation</a>");
});

app.get("/healthcheck", (req: Request, res: Response) => {
  return res.status(200).send("OK");
});

SwaggerUtilities.addSwaggerMiddleware(app);

app.use("/api/orders", new OrdersRouter().getRouter());

const httpInstance = app.listen(PORT, () => {
  logger.info(`Application listening on port ${PORT}!`);
});

/**************************************************/
/*               SHUTDOWN HANDLERS                */
/**************************************************/

const exitEvents = ["SIGINT", "SIGHUP", "SIGTERM", "SIGUSR1", "SIGUSR2"];
exitEvents.forEach((event) => {
  process.on(event, () => {
    httpInstance.close();
    logger.info("Graceful shutdown.");
    process.exit(0);
  });
});
