import { Router } from "express";
import data from "../data/store";
import { Room } from "../types";

const roomRouter = Router();

roomRouter.get("/", (req, res) => {
    console.log("GET /rooms");
    const rooms : Room[] = Object.values(data.rooms)
    return res.json({ rooms: rooms.map(room => ({ 
        id: room.id, 
        name: room.name, 
        players: room.players, 
        host: room.host, 
        game: room.game, 
        chat: room.chat, 
        isPrivate: room.isPrivate })) });
});

roomRouter.get("/:roomId", (req, res) => {
    const { roomId } = req.params;
    console.log(`GET /rooms/${roomId}`);
    const room = data.rooms[roomId];
    if (!room) {
        return res.status(404).json({ room: null, error: "Room not found." });
    }
    return res.json({ room: { 
        id: room.id, 
        name: room.name, 
        players: room.players, 
        host: room.host, 
        game: room.game, 
        chat: room.chat, 
        isPrivate: room.isPrivate } });
});

export default roomRouter;