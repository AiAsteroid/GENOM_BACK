import "module-alias/register"; // обязательно первой строкой

import app from "./app.js";
import { env } from "./env.js";

const port = env.PORT;

// Запуск сервера
// eslint-disable-next-line node/no-process-env
if (process.env.NODE_ENV !== "test") {
  const server = app.listen(port, () => {
    console.log(`🚀 Voice API server is running on port ${port}`);
    console.log(`📖 Health check: http://localhost:${port}/health`);
    console.log(`🎤 Voices API: http://localhost:${port}/api/voices`);
    console.log(`🎤 TTS API: http://localhost:${port}/api/tts`);
    console.log(`🎤 Swagger API: http://localhost:${port}/api-docs`);
  });

  server.on("error", (err) => {
    if ("code" in err && err.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Please choose another port or stop the process using it.`);
    }
    else {
      console.error("Failed to start server:", err);
    }
    process.exit(1);
  });
}
