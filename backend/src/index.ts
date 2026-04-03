import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import data from "./data/store";
import { registerSocketHandlers } from "./socket";
import roomRouter from "./routes/room";
import categoriesRouter from "./routes/categories";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use("/rooms", roomRouter);
app.use("/categories", categoriesRouter);

registerSocketHandlers(io);

app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the game server!" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = parseInt(process.env.PORT ?? "3001", 10);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Client URL: http://localhost:3001`);
});
