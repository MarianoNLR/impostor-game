import { Server, Socket } from 'socket.io'
import { roomRepository } from '../repositories/roomRepository'
import { addWordToSubmissions } from './gameService'
import { getGameState } from './gameUtils'
import { nextTurn } from './gameService'

export function startTimer(io: Server,
roomId: string, 
duration: number = 30, 
onEnd : () => void) 
{
    console.log(`Starting timer for room ID: ${roomId}`);
    const room = roomRepository.findById(roomId);
    if (!room) {
        console.log(`Room ID ${roomId} does not exist.`);
        return null;
    }
    const game = room.game;
    if (!game) {
        console.log(`Game has not started for room ID ${roomId}.`);
        return null;
    }

    if (game.currentTimer) {
        clearInterval(game.currentTimer);
        game.currentTimer = null;
    }

    let secondsLeft = duration;
    const playerId = game.turnOrder[game.currentTurnIndex];
    const interval = setInterval(() => {
        secondsLeft--;
        io.to(roomId).emit("timerUpdate", { timeLeft: secondsLeft });

        if (secondsLeft <= 0) {
            clearInterval(interval);
            //addWordToSubmissions(room, playerId, "No hint"); // Submit empty word if player didn't submit in time
            //nextTurn(io, roomId);
            onEnd();
        }
    }, 1000);

    return interval;
}
