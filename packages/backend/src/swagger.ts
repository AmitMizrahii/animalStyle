import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AnimalStyle - Animal Adoption Platform API",
      version: "1.0.0",
      description:
        "Full-stack animal adoption platform with JWT authentication and AI-powered search",
      contact: {
        name: "Support",
        email: "support@animalstyle.com",
      },
    },
    servers: [
      {
        url: process.env.BASE_URL || "http://localhost:3001",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const specs = swaggerJSDoc(swaggerOptions);
export { swaggerUi };
