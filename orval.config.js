import { defineConfig } from "orval";
import "dotenv/config";

const SWAGGER_URL = process.env.EXPO_PUBLIC_SWAGGER_API_URL;
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default defineConfig({
  api: {
    mock: false,
    input: {
      target: SWAGGER_URL,
    },
    output: {
      mode: "split",
      target: "./src/api/generated",
      schemas: "./src/api/generated/model",
      httpClient: "axios",
      baseUrl: API_URL,
    },
    client: "react-query",
    axios: {
      baseUrl: API_URL,
    },
  },
});
