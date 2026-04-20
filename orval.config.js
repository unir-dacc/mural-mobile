import { defineConfig } from "orval";
import "dotenv/config";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default defineConfig({
  api: {
    mock: false,
    input: {
      target: "./swagger.json",
    },
    output: {
      mode: "split",
      target: "./src/api/generated",
      schemas: "./src/api/generated/model",
      httpClient: "axios",
      baseUrl: API_URL,
      override: {
        mutator: {
          path: "./src/api/axios.ts",
          name: "api",
        },
      },
    },
    client: "react-query",
  },
});
