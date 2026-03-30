import "./env.js";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./env.js";
import { apiRouter } from "./routes/api.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use("/api", apiRouter);

const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));
app.get("/", (_req, res) => res.sendFile(path.join(publicDir, "run.html")));
app.get("/results", (_req, res) => res.sendFile(path.join(publicDir, "results.html")));

app.listen(env.port, () => {
  console.log(`Server listening on http://localhost:${env.port}`);
});
