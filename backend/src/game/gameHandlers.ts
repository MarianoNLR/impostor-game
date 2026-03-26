import { Server, Socket } from "socket.io"
import { startGame, submitWord, submitVote, getMyRole } from './gameService'
import { getGameState } from "./gameUtils"

export const registerGameHandlers = (io: Server, socket: Socket) => {
    socket.on("startGame", ({ roomId }) => startGame(socket, io, roomId))
    socket.on("submitWord", ({ roomId, word }) => submitWord(socket, io, roomId, word))
    socket.on("submitVote", ({ roomId, votedPlayerId }) => submitVote(socket, io, roomId, votedPlayerId))
    socket.on("getGameState", ({ roomId }) => {
        console.log(`Received request for game state from client ${socket.id} for room ${roomId}`);
        socket.emit("gameState", { room: getGameState(roomId) });
    })
    socket.on("getMyRole", ({ roomId }) => getMyRole(socket, io, roomId))
}
