import { Server, Socket } from "socket.io"
import { roomRepository } from "../repositories/roomRepository"
import { Room } from '../types'
import crypto from "crypto"

type CreateRoomPayload = {
    name?: string;
    isPrivate?: boolean;
    password?: string;
}

export const registerRoomHandlers = (io: Server, socket: Socket) => {
    socket.on("createRoom", (payload: CreateRoomPayload = {}) => {
        console.log(`Client ${socket.id} requested to create a room`);
        const roomId = `${crypto.randomUUID()}`;
        const roomExists = roomRepository.findById(roomId) !== null;

        if (roomExists) {
            console.log(`Room ID ${roomId} already exists. Generating a new one.`);
            return socket.emit("roomCreated", { roomId: null, error: "Room ID already exists. Please try again." });
        }

        const roomOwner = socket.data.nickname;
        const requestedName = typeof payload.name === "string" ? payload.name.trim() : "";
        const roomName = requestedName.length > 0 ? requestedName.slice(0, 40) : `${roomOwner}'s Room`;
        const isPrivateRoom = Boolean(payload.isPrivate);
        const requestedPassword = typeof payload.password === "string" ? payload.password.trim() : "";

        if (isPrivateRoom && requestedPassword.length === 0) {
            return socket.emit("roomCreated", { roomId: null, error: "Password is required for private rooms." });
        }

        const passwordHash = isPrivateRoom
            ? crypto.createHash("sha256").update(requestedPassword).digest("hex")
            : null;

        const newRoom : Room = { 
            id: roomId, 
            name: roomName, state: "lobby", 
            players: [], 
            host: socket.id, 
            game: null, 
            chat: { messages: [] }, 
            isPrivate: isPrivateRoom, 
            passwordHash };
        newRoom.players.push({ id: socket.id, nickname: roomOwner, role: "unassigned", isAlive: true });
        roomRepository.save(newRoom);
        socket.data.roomCode = roomId;
        socket.join(roomId);
        console.log(`Client ${socket.id} created room ${roomId}`);

        socket.emit("roomCreated", { roomId });
        
        io.emit("roomsUpdated", {rooms: roomRepository.findAll().map(room => ({ id: room.id, name: room.name, players: room.players, host: room.host, game: room.game, chat: room.chat }))});
    })

    socket.on("joinRoom", ({ roomId, password }: { roomId: string; password?: string }) => {
        const room = roomRepository.findById(roomId);
        if (!room) {
        console.log(`Room ID ${roomId} does not exist.`);
        return socket.emit("joinedRoom", { roomId: null, error: "Room does not exist." });
        }

        if (room.state !== "lobby") {
            console.log(`Room ID ${roomId} is not in lobby state.`);
            return socket.emit("joinedRoom", { roomId: null, error: "Room is not open for joining." });
        }

        if (room.players.length >= 10) {
        console.log(`Room ID ${roomId} is full.`);
        return socket.emit("joinedRoom", { roomId: null, error: "Room is full." });
        }

        if (room.isPrivate) {
            const incoming = typeof password === "string" ? password.trim() : "";
            const incomingHash = crypto.createHash("sha256").update(incoming).digest("hex");
            if (incomingHash !== room.passwordHash) {
                console.log(`Client ${socket.id} provided wrong password for room ${roomId}.`);
                return socket.emit("joinedRoom", { roomId: null, error: "Contraseña incorrecta." });
            }
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