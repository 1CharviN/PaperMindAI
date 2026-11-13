import express, { type NextFunction, type Request, type Response } from "express";
import { registerRoutes } from "./routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let initialization: Promise<void> | undefined;

function initialize() {
  initialization ??= registerRoutes(app).then(() => {
    app.use(
      (error: any, _req: Request, res: Response, _next: NextFunction) => {
        console.error("API error:", error);
        if (!res.headersSent) {
          res.status(error.status || error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
          });
        }
      },
    );
  });

  return initialization;
}

export default async function handler(req: Request, res: Response) {
  try {
    await initialize();

    if (req.url && !req.url.startsWith("/api")) {
      req.url = `/api${req.url}`;
    }

    app(req, res);
  } catch (error) {
    console.error("Failed to initialize API routes:", error);
    res.status(500).json({ error: "API initialization failed" });
  }
}
