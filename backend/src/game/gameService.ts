import { Socket, Server } from "socket.io"
import { roomRepository } from "../repositories/roomRepository"
import { GameState, Room } from "../data/store"
import { getGameState } from "./gameUtils"
import { startTimer } from "./timerService"
import { Player } from "../data/store"

export function startGame(socket: Socket, io: Server, roomId: string) {
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
            currentTimer: null,
            wordsSubmitted: {}
        }
        room.state = "in-game";
        room.game = gameState;
        assignRoles(room);

        // Emit role assignment to each player individually so impostors can see who the other impostors but can't see game's word
        // Crewmates will receive the word but won't see who the impostors are.
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
        io.to(roomId).emit("gameStarted", { room: getGameState(roomId) });
        setTimeout(() => {
            startTurn(io, roomId);    
        }, 300)
        
}

export function startTurn(io: Server, roomId: string) {
    const room = roomRepository.findById(roomId);
    console.log(`Starting turn for room ID: ${roomId}`);
    if (!room) {
        console.log(`Room ID ${roomId} does not exist.`);
        return;
    }
    if (!room.game) {
        console.log(`Game has not started for room ID ${roomId}.`);
        return;
    }

    // Clear any existing timer before starting a new one
    if (room.game.currentTimer) {
        clearInterval(room.game.currentTimer);
        room.game.currentTimer = null;
    }

    //const currentTurnPlayerId = room.game.turnOrder[room.game.currentTurnIndex];
    let timeLeft = 5; // 30 seconds for each turn
    room.game.currentTimer = startTimer(
        io, 
        roomId, 
        timeLeft,
        () => {
            console.log(`Turn timer ended for room ID: ${roomId}`);
            room.game!.currentTimer = null;
            nextTurn(io, roomId);
        }
    );
}

export function startDiscussionPhase(io: Server, roomId: string) {
    const room = roomRepository.findById(roomId);
    if (!room) {
        console.log(`Room ID ${roomId} does not exist.`);
        return;
    }

    startTimer(
        io, 
        roomId, 
        5, 
        () => {
            console.log(`Discussion timer ended for room ID: ${roomId}`);
            room.game!.currentTimer = null;
            room.game!.state = "voting";
            startVotingPhase(io, roomId);
            io.to(roomId).emit("gameState", { room: getGameState(roomId) });
        });
}

export function startVotingPhase(io: Server, roomId: string) {
    console.log(`Starting voting phase for room ID: ${roomId}`);
    const room = roomRepository.findById(roomId);
    if (!room) {
        console.log(`Room ID ${roomId} does not exist.`);
        return;
    }

    startTimer(
        io, 
        roomId, 
        5, 
        () => {
            console.log(`Voting timer ended for room ID: ${roomId}`);
            room.game!.currentTimer = null;
            countVotesCurrentRound(room);
            io.to(roomId).emit("gameState", { room: getGameState(roomId) });
            if (room.game!.state === "finished") {
                return;
            }
            startTurn(io, roomId);
        })
}

export function nextTurn(io: Server, roomId: string) {
    console.log(`Moving to next turn for room ID: ${roomId}`);
    const room = roomRepository.findById(roomId);
    if (!room) {
        console.log(`Room ID ${roomId} does not exist.`);
        return;
    }
    if (!room.game) {
        console.log(`Game has not started for room ID ${roomId}.`);
        return;
    }
    const nextIndex = room.game.currentTurnIndex + 1;
    if (nextIndex >= room.game.turnOrder.length) {
        room.game.currentTurnIndex = 0
        room.game.state = "discussion";
        io.to(roomId).emit("gameState", { room: getGameState(roomId) });
        startDiscussionPhase(io, roomId);
        return
    }
    room.game.currentTurnIndex = nextIndex;
    startTurn(io, roomId);
    io.to(roomId).emit("gameState", { room: getGameState(roomId) });
}

export function submitWord(socket: Socket, io: Server, roomId: string, word: string) {
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

        addWordToSubmissions(room, socket.id, word);
        nextTurn(io, roomId);
        console.log(`Current words submitted for room ${roomId}:`, room.game.wordsSubmitted);
}

export function submitVote(socket: Socket, io: Server, roomId: string, votedPlayerId: string) {
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
    // if (Object.keys(room.game.votes).length === room.players.length) {
    //     countVotesCurrentRound(room)
    // }
    // io.to(roomId).emit("gameState", { room: getGameState(roomId) }); 

}

export function assignRoles(room: Room) {
    selectImpostors(room);
    selectCrewmates(room);
}

export function selectCrewmates(room: Room) {
        const crewmatePlayers : string[] = room.players.filter(player => player.role !== "impostor").map(player => player.id);
        crewmatePlayers.forEach(playerId => {
            const player = room.players.find(p => p.id === playerId);
            if (player) {
                player.role = "crewmate";
            }
        });
}

export function selectImpostors(room: Room) {
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

export function addWordToSubmissions(room: Room, playerId: string, word: string) {
    if (!room.game) {
        console.log(`Game has not started for room ID ${room.id}.`);
        return;
    }

    if (room.game.turnOrder[room.game.currentTurnIndex] !== playerId) {
        console.log(`Client ${playerId} attempted to submit a word out of turn in room ${room.id}. Ignoring.`);
        return;
    }

    if (!room.game.wordsSubmitted[playerId]) {
        room.game.wordsSubmitted[playerId] = [];
    }
    room.game.wordsSubmitted[playerId].push(word);

}

export function countVotesCurrentRound(room: Room) {
    if (!room.game) {
        console.log("Game state is not initialized.");
        return;
    }

    const voteCounts: Record<string, number> = {};

    if (!room.game.votes || Object.keys(room.game.votes).length === 0) {
        console.log("No votes submitted for this round.");
        room.game.state = "words";
        return;
    }
    
    Object.values(room.game.votes).forEach(vote => {
        voteCounts[vote] = voteCounts[vote] ? voteCounts[vote] + 1 : 1;
    });
    const mostVoted = Object.entries(voteCounts).sort(([, a], [, b]) => b - a);

    if (mostVoted.filter(([,count]) => count == mostVoted[0][1]).length > 1) {
        console.log("Vote tied, no one is eliminated this round.");
        room.game.state = "words";
        return;
    }
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
            room.game.currentTimer = null;
            room.game.state = "finished";
        }
    }
}