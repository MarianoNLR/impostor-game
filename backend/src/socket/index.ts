import { Server, Socket } from "socket.io"
import { registerRoomHandlers } from "../room/roomHandlers"
import { Room } from "../types";
import { registerGameHandlers } from "../game/gameHandlers";
import { roomRepository } from "../repositories/roomRepository";
import registerChatHandlers from "../game/chatHandlers";

export const registerSocketHandlers = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    socket.on("set_nickname", ({ nickname }) => {
      socket.data.nickname = nickname;
      console.log(`Client ${socket.id} set nickname to: ${nickname}`);
      socket.emit("set_nickname", { ok: true });
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomCode;
      if (!roomId) {
        console.log(`Client ${socket.id} disconnected (no room)`);
        return;
      }
      const room : Room | null = roomRepository.findById(roomId);
      if (!room) {
        console.log(`Client ${socket.id} disconnected (room not found)`);
        return;
      }
      room.players = room.players.filter((player) => player.id !== socket.id);
      socket.to(roomId).emit("playerLeft", { playerId: socket.id, nickname: socket.data.nickname });
      console.log(`Client ${socket.id} left room ${roomId}`);
        if (room.players.length === 0) {
          roomRepository.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
          io.emit("roomsUpdated", {rooms: roomRepository.findAll().map(room => ({ 
            id: room.id, 
            name: room.name, 
            players: room.players, 
            host: room.host, 
            game: room.game, 
            chat: room.chat, 
            isPrivate: room.isPrivate }))});
        }
    })

    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerChatHandlers(io, socket);
  });
}