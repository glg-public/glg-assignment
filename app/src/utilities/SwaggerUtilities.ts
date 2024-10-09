import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { Application } from "express";

export class SwaggerUtilities {
  public static addSwaggerMiddleware(app: Application): void {
    const swaggerSpec = swaggerJsDoc(this.getOptions());
    /* Swagger Express does not respect the base-path for asset serving, so also serve from root */
    app.use("/", swaggerUi.serveWithOptions({ redirect: false }));

    app.use(
      "/docs",
      swaggerUi.serveWithOptions({ redirect: false }),
      swaggerUi.setup(swaggerSpec, this.getUIOptions())
    );
  }

  private static getOptions(): any {
    return {
      definition: {
        openapi: "3.0.0",
        info: {
          title: "Orders API",
          description: "This service provides common support resolution tools.",
        },
        basePath: process.env.NODE_ENV == "production" ? `/${process.env.APP_NAME}` : "/"
      },
      apis: ["**/controllers/**/*.ts", "**/definitions/**/*.ts"]
    };
  }

  private static getUIOptions(): any {
    return {
      customSiteTitle: "Orders API",
      customCss: `
        #operations-tag-default,
        .swagger-ui .topbar,
        .scheme-container {
          display: none;
        }
      `
    };
  }
}
