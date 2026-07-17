import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { boardConfig, runtimeConfig } from "./config/env.js";
import { KvvEfaDepartureProvider } from "./providers/kvv-efa-departure-provider.js";
import { MockDepartureProvider } from "./providers/mock-departure-provider.js";
import { createApiRouter } from "./routes/api.js";
import { DepartureService } from "./services/departure-service.js";
import { WeatherService } from "./services/weather-service.js";

const app = express();
const liveProvider = new KvvEfaDepartureProvider(boardConfig);
const mockProvider = new MockDepartureProvider();
const departureService = new DepartureService(liveProvider, mockProvider);
const weatherService = new WeatherService();

app.use(cors());
app.use(express.json());
app.use(morgan(runtimeConfig.nodeEnv === "production" ? "combined" : "dev"));
app.use("/api", createApiRouter(departureService, weatherService));

if (runtimeConfig.staticDir) {
  const staticDir = path.resolve(runtimeConfig.staticDir);
  app.use(express.static(staticDir));
  app.get("*", (_request, response) => {
    response.sendFile(path.join(staticDir, "index.html"));
  });
}

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error("[server] unhandled request error", error);
  response.status(500).json({
    error: "Internal server error"
  });
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(runtimeConfig.port, () => {
    console.log(`Departure board backend listening on http://localhost:${runtimeConfig.port}`);
  });
}

export { app };

