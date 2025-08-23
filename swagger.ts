import type { SwaggerDefinition } from "swagger-jsdoc";

import swaggerJsDoc from "swagger-jsdoc";

const swaggerDefinition: SwaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Genom API",
    version: "1.0.0",
    description: "Документация Genom API",
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 3000}`,
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ["./src/api/*.ts"], // путь к вашим маршрутам
};

const swaggerSpec = swaggerJsDoc(options);

export default swaggerSpec;
