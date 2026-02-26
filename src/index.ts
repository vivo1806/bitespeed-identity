import dotenv from "dotenv";
import identityRouter from "./routes/identityRoute";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
dotenv.config();

import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});
app.use("/identify", identityRouter);
app.use(notFound);

app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
