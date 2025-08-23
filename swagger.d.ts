declare module "./swagger" {
  import type { OpenAPIV3 } from "openapi-types";

  const swaggerSpec: OpenAPIV3.Document;
  export default swaggerSpec;
}
