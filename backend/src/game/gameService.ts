import { Socket, Server } from "socket.io"
import { roomRepository } from "../repositories/roomRepository"
import { GameState, Room, Player } from "../types"
import { getGameState } from "./gameUtils"
import { startTimer } from "./timerService"
import { clearRoomMessages, getRoomChat } from "./chatService"

export function initializeGameData(room: Room) {
    if (room.game) {
        clearInterval(room.game.currentTimer!);
    }
    const gameState : GameState = {
        phase: "words",
        word: "Apple",
        category: "Fruits",
        turnOrder: room.players.map(player => player.id),
        currentTurnIndex: 0,
        votes: {},
        impostorIds: [],
        eliminatedIds: [],
        currentTimer: null,
        wordsSubmitted: {},
        winner: null
    }
    room.game = gameState;

    room.players.forEach(player => {
        player.isAlive = true;
        player.role = "unassigned";
    });
    clearRoomMessages(room.id);
}

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
        
        initializeGameData(room);
        room.state = "in-game";
        clearRoomMessages(roomId);
        io.to(roomId).emit("chatHistory", { roomId, messages: getRoomChat(roomId) });
        
        assignRoles(room);

        console.log(`Game started in room ${roomId}. Initial game state:`, room.players);
        io.to(roomId).emit("gameStarted", { room: getGameState(roomId) });
        setTimeout(() => {
            startTurn(io, roomId);    
        }, 300)
}

export function getMyRole(socket: Socket, io: Server, roomId: string) {
    const room = roomRepository.findById(roomId);
    if (!room) {
        console.log(`Room ID ${roomId} does not exist.`);
        return;
    }

    if (!room?.game) {
        console.log(`Game has not started for room ID ${roomId}.`);
        return;
    }

    const player = room.players.find((p: Player) => p.id === socket.id);
    if (!player) {
        console.log(`Player with id ${socket.id} not found in room ${roomId}.`);
        return;
    }

    socket.emit("roleAssigned", {
         role: player.role,
        word: player.role === "crewmate" ? room.game.word : null,
        category: room.game.category,
        players: player.role === "impostor" ?
        room.players.map((p: Player) => ({ id: p.id, nickname: p.nickname, role: p.role, isAlive: p.isAlive }))
        :
        room.players.map((p: Player) => ({ id: p.id, nickname: p.nickname, role: "crewmate", isAlive: p.isAlive }))
    })
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
    let timeLeft = 30; // 30 seconds for each turn
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
            endDiscussionPhase(io, room);
        });
}

function endDiscussionPhase(io: Server, room: Room) {
    console.log(`Discussion timer ended for room ID: ${room.id}`);
    room.game!.currentTimer = null;
    room.game!.phase = "voting";
    startVotingPhase(io, room.id);
    io.to(room.id).emit("gameState", { room: getGameState(room.id) });
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
        15, 
        () => {
            endVotingPhase(io, room);
        })
}

function endVotingPhase(io: Server, room: Room) {
    console.log(`Voting timer ended for room ID: ${room.id}`);
    room.game!.currentTimer = null;
    countVotesCurrentRound(room);
    io.to(room.id).emit("gameState", { room: getGameState(room.id) });
    if (room.game!.phase === "finished") {
        return;
    }
    startTurn(io, room.id);
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
        room.game.phase = "discussion";
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

        if (room.game.phase !== "words") {
            console.log(`Received word submission from client ${socket.id} in room ${roomId} but game is not in 'words' phase. Ignoring.`);
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
    if (room.players.every((p: Player) => p.id !== socket.id)) {
        console.log("Player does not exist in this room!");
        return;
    }

    if (room.game?.phase !== "voting") {
        console.log("Game is not in voting phase!");
        return
    }

    if (room.game.votes[socket.id]) {
        console.log("Player has already voted!");
        return;
    }

    room.game.votes[socket.id] = votedPlayerId;

    if (Object.keys(room.game.votes).length === room.players.length) {
        endVotingPhase(io, room);
    }
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
        const crewmatePlayers : string[] = room.players.filter((player : Player) => player.role !== "impostor").map(player => player.id);
        crewmatePlayers.forEach(playerId => {
            const player = room.players.find((p : Player) => p.id === playerId);
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
        room.game.phase = "words";
        return;
    }
    
    Object.values(room.game.votes).forEach(vote => {
        voteCounts[vote] = voteCounts[vote] ? voteCounts[vote] + 1 : 1;
    });
    const mostVoted = Object.entries(voteCounts).sort(([, a], [, b]) => b - a);

    // If there's a tie for the most votes, no one is eliminated
    if (mostVoted.filter(([,count]) => count == mostVoted[0][1]).length > 1) {
        console.log("Vote tied, no one is eliminated this round.");
        room.game.phase = "words";
        return;
    }

    // Eliminate the player with the most votes
    eliminatePlayer(room, mostVoted[0][0]);
}

export function eliminatePlayer(room: Room, playerId: string) {
    const player = room.players.find(p => p.id === playerId);
    if (player) {
        player.isAlive = false;
        room.game?.eliminatedIds.push(playerId);
    }

    // After eliminating a player, check if the game has been won by either side
    checkWinCondition(room);
}

export function checkWinCondition(room: Room) {
    if (!room.game) {
        console.log("Game state is not initialized.");
        return;
    }

    const aliveImpostors = room.players.filter(p => p.role === "impostor" && p.isAlive);
    const aliveCrewmates = room.players.filter(p => p.role === "crewmate" && p.isAlive);
    if (aliveImpostors.length === 0) {
        console.log("All impostors have been eliminated! Crewmates win!");
        room.game.currentTimer = null;
        room.game.phase = "finished";
        room.game.winner = "crewmates";
    } else if (aliveImpostors.length >= aliveCrewmates.length) {
        console.log("Impostors have reached parity with crewmates! Impostors win!");
        room.game.currentTimer = null;
        room.game.phase = "finished";
        room.game.winner = "impostors";
    }

    if (room.game.phase === "finished") {
        console.log(`Game finished in room ${room.id}. Winner: ${room.game.winner}`);
        room.game.currentTimer = setTimeout(() => {
        initializeGameData(room);
        }, 5000);
    }

    return;
}