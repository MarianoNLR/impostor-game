import { Server, Socket } from "socket.io"
import { GameState, Player, Room } from "../data/store"
import { roomRepository } from '../repositories/roomRepository'

export const registerGameHandlers = (io: Server, socket: Socket) => {
    socket.on("startGame", ({ roomId }) => {
        const room = roomRepository.findById(roomId);
        if (!room) {
            console.log(`Client ${socket.id} attempted to start a game in non-existent room ID ${roomId}.`);
            return socket.emit("gameStarted", { roomId: null, error: "Room does not exist." });
        }
        // if (room.players.length < 3) {
        //     console.log(`Client ${socket.id} attempted to start a game in room ID ${roomId} with insufficient players.`);
        //     return socket.emit("gameStarted", { roomId: null, error: "At least 3 players are required to start the game." });
        // }
        startGame(socket, io, roomId);
        const result = getGameState(roomId);

        io.to(roomId).emit("gameStarted", { room: result });
        console.log(result)
    })

    socket.on("getGameState", ({ roomId }) => {
        const result = getGameState(roomId);
        io.to(socket.id).emit("gameState", { room: result });
    })

    socket.on("submitWord", ({ roomId, word }) => {
        submitWord(socket, io, roomId, word);
        io.to(roomId).emit("gameState", { room: getGameState(roomId) });
    })

    socket.on("submitVote", ({ roomId, votedPlayerId }) => {
        submitVote(socket, io, roomId, votedPlayerId);
        io.to(roomId).emit("gameState", { room: getGameState(roomId) });
    })
}

function startGame(socket: Socket, io: Server, roomId: string) {
    const room = roomRepository.findById(roomId);
        if (!room) {
            console.log(`Room ID ${roomId} does not exist.`);
            return socket.emit("gameStarted", { roomId: null, error: "Room does not exist." });
        }
        
        if (room.host !== socket.id) {
            console.log(`Client ${socket.id} is not the host of room ${roomId}.`);
            return socket.emit("gameStarted", { roomId: null, error: "Only the host can start the game." });
        }
        const gameState : GameState = {
            state: "words",
            word: "Apple",
            category: "Fruits",
            turnOrder: room.players.map(player => player.id),
            currentTurnIndex: 0,
            votes: {},
            impostorIds: [],
            eliminatedIds: [],
        }

        room.game = gameState;
        assignRoles(room);
        room.players.forEach(player => {
            io.to(player.id).emit("roleAssigned", {
                role: player.role,
                word: player.role === "crewmate" ? gameState.word : null,
                category: gameState.category,
                players: player.role === "impostor" ?
                room.players.map(p => ({ id: p.id, nickname: p.nickname, role: p.role, isAlive: p.isAlive }))
                :
                room.players.map(p => ({ id: p.id, nickname: p.nickname, role: "crewmate", isAlive: p.isAlive }))
            });
        })
        console.log(`Starting game for room ID: ${roomId}`);
}

function submitWord(socket: Socket, io: Server, roomId: string, word: string) {
    if (!word || word.trim() === "") {
            console.log(`Received empty word submission from client ${socket.id} in room ${roomId}. Ignoring.`);
            return;
        }

        const room = roomRepository.findById(roomId);
        if (!room) {
            console.log(`Room ID ${roomId} does not exist.`);
            return;
        }
        if (!room.game) {
            console.log(`Game has not started for room ID ${roomId}.`);
            return;
        }

        if (room.game.state !== "words") {
            console.log(`Received word submission from client ${socket.id} in room ${roomId} but game is not in 'words' state. Ignoring.`);
            return;
        }

        console.log(`Received word submission from client ${socket.id} in room ${roomId}: ${word}`);
        const currentTurnPlayerId = room.game.turnOrder[room.game.currentTurnIndex];
        if (socket.id !== currentTurnPlayerId) {
            console.log(`Client ${socket.id} attempted to submit a word out of turn in room ${roomId}. Ignoring.`);
            return;
        }

        room.game.currentTurnIndex = (room.game.currentTurnIndex + 1) % room.game.turnOrder.length;

        if (room.game.currentTurnIndex === 0) {
            room.game.state = "voting";
        }
}

function submitVote(socket: Socket, io: Server, roomId: string, votedPlayerId: string) {
    // Voting logic here
    const room = roomRepository.findById(roomId);
    if (!room) {
        console.log(`Room ID ${roomId} does not exist.`);
        return;
    }

    console.log(`Player with id ${socket.id} has voted to ${votedPlayerId}`);
    if (room.players.every(p => p.id !== socket.id)) {
        console.log("Player does not exist in this room!");
        return;
    }

    if (room.game?.state !== "voting") {
        console.log("Game is not in voting state!");
        return
    }

    if (room.game.votes[socket.id]) {
        console.log("Player has already voted!");
        return;
    }

    room.game.votes[socket.id] = votedPlayerId;
    // if all players have voted count votes per player and eliminate player with most votes. If tie, no one is eliminated. Then move to discussion phase.
    if (Object.keys(room.game.votes).length === room.players.length) {
        countVotesCurrentRound(room)
    }

}

function countVotesCurrentRound(room: Room) {
    if (!room.game) {
        console.log("Game state is not initialized.");
        return;
    }

    const voteCounts: Record<string, number> = {};
    
    Object.values(room.game.votes).forEach(vote => {
        voteCounts[vote] = voteCounts[vote] ? voteCounts[vote] + 1 : 1;
    });
    const mostVoted = Object.entries(voteCounts).sort(([, a], [, b]) => b - a);

    if (mostVoted.filter(([,count]) => count == mostVoted[0][1]).length > 1) {
        console.log("Vote tied, no one is eliminated this round.");
        room.game.state = "words";
    } else {
        const eliminatedPlayerId = mostVoted[0][0];
        room.game.eliminatedIds.push(eliminatedPlayerId);
        const eliminatedPlayer = room.players.find(p => p.id === eliminatedPlayerId);
        if (eliminatedPlayer) {
            eliminatedPlayer.isAlive = false;
        }
        if (room.game.impostorIds.includes(eliminatedPlayerId)) {
            console.log(`Player ${eliminatedPlayerId} was an impostor!`);

            if (room.game && room.game.impostorIds.every(id => room.game!.eliminatedIds.includes(id))) {
                console.log("All impostors have been eliminated! Crewmates win!");
                room.game.state = "lobby";
            }
        }
    }
}

function assignRoles(room: Room) {
    selectImpostors(room);
    selectCrewmates(room);
}

function selectCrewmates(room: Room) {
        const crewmatePlayers : string[] = room.players.filter(player => player.role !== "impostor").map(player => player.id);
        crewmatePlayers.forEach(playerId => {
            const player = room.players.find(p => p.id === playerId);
            if (player) {
                player.role = "crewmate";
            }
        });
}

function selectImpostors(room: Room) {
    const num_impostor : number = 1;
    const impostorPlayers : string[] = [];

    while (impostorPlayers.length < num_impostor) {
        const randomIndex = Math.floor(Math.random() * room.players.length);
        const player : Player = room.players[randomIndex];
        if (!impostorPlayers.includes(player.id)) {
            impostorPlayers.push(player.id);
            room.players[randomIndex].role = "impostor";
        }
    }

    room.game!.impostorIds = impostorPlayers;
}

function getGameState(roomId: string) {
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

    const { impostorIds, word, votes, ...publicGameState } = game;
    return {...rest, players: publicPlayers, game: publicGameState};
}