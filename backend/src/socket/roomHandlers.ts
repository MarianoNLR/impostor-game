import { Server, Socket } from "socket.io"
import { roomRepository } from "../repositories/roomRepository"
import { Room } from '../types'
import crypto from "crypto"

export const registerRoomHandlers = (io: Server, socket: Socket) => {
    socket.on("createRoom", () => {
        console.log(`Client ${socket.id} requested to create a room`);
        const roomId = `${crypto.randomUUID()}`;
        const roomExists = roomRepository.findById(roomId) !== null;

        if (roomExists) {
            console.log(`Room ID ${roomId} already exists. Generating a new one.`);
            return socket.emit("roomCreated", { roomId: null, error: "Room ID already exists. Please try again." });
        }

        const roomOwner = socket.data.nickname;
        const newRoom : Room = { id: roomId, name: `${roomOwner}'s Room`, state: "lobby", players: [{ id: socket.id, nickname: roomOwner, role: "unassigned", isAlive: true }], host: socket.id, game: null, chat: { messages: [] } };
        roomRepository.save(newRoom);
        socket.data.roomCode = roomId;
        socket.join(roomId);
        console.log(`Client ${socket.id} created room ${roomId}`);

        socket.emit("roomCreated", { roomId });
        
        io.emit("roomsUpdated", {rooms: roomRepository.findAll().map(room => ({ id: room.id, name: room.name, players: room.players, host: room.host, game: room.game, chat: room.chat }))});
    })

    socket.on("joinRoom", ({ roomId }) => {
        const room = roomRepository.findById(roomId);
        if (!room) {
        console.log(`Room ID ${roomId} does not exist.`);
        return socket.emit("joinedRoom", { roomId: null, error: "Room does not exist." });
        }

        if (room.players.length >= 10) {
        console.log(`Room ID ${roomId} is full.`);
        return socket.emit("joinedRoom", { roomId: null, error: "Room is full." });
        }

        room.players.push({ id: socket.id, nickname: socket.data.nickname, role: "unassigned", isAlive: true });
        roomRepository.save(room);
        socket.data.roomCode = roomId;
        socket.join(roomId);

        socket.emit("joinedRoom", { roomId });
        socket.to(roomId).emit("playerJoined", { id: socket.id, nickname: socket.data.nickname });
        console.log(`Client ${socket.id} joined room ${roomId}`);
    })  
}