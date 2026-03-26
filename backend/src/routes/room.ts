import { Router } from "express";
import data from "../data/store";
import { Room } from "../types";

const roomRouter = Router();

roomRouter.get("/", (req, res) => {
    console.log("GET /rooms");
    const rooms : Room[] = Object.values(data.rooms)
    return res.json({ rooms });
});

roomRouter.get("/:roomId", (req, res) => {
    const { roomId } = req.params;
    console.log(`GET /rooms/${roomId}`);
    const room : Room = data.rooms[roomId];
    return res.json({ room });
});

export default roomRouter;