import { Room, Player } from '../data/store'
import { roomRepository } from '../repositories/roomRepository'

export function getGameState(roomId: string) {
    const room : Room | null = roomRepository.findById(roomId);
    if (!room) {
        console.log(`Room ID ${roomId} does not exist.`);
        return null;
    }
    const { game, ...rest } = room;
    if (!game) {
        console.log(`Game has not started for room ID ${roomId}.`);
        return null;
    }
    const publicPlayers = room.players.map(({ id, nickname }) => ({ id, nickname }))

    const { impostorIds, word, votes, currentTimer,...publicGameState } = game;
    return {...rest, players: publicPlayers, game: publicGameState};
}