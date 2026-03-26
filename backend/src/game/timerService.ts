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
    io.to(roomId).emit("timerUpdate", { timeLeft: secondsLeft, duration });

    const interval = setInterval(() => {
        secondsLeft--;
        io.to(roomId).emit("timerUpdate", { timeLeft: secondsLeft, duration });

        if (secondsLeft <= 0) {
            clearInterval(interval);
            game.currentTimer = null;
            onEnd();
        }
    }, 1000);

    game.currentTimer = interval;
    return interval;
}
