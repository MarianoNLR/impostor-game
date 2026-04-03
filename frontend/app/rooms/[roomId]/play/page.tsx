"use client";

import { useParams } from "next/navigation"
import { useEffect, useState } from "react";
import { Player, Room, GameState } from '@/types/index';
import { useSocket } from '@/context/SocketContext';
import { Timer } from '@/components/lobby/Timer'
import { VotingPhaseUI } from "@/components/game/VotingPhaseUI";
import { DiscussionPhaseUI } from "@/components/game/DiscussionPhaseUI";
import { FinishedPhaseUI } from "@/components/game/FinishedPhaseUI";
import { WordsPhaseUI } from "@/components/game/WordsPhaseUI";
import { CategoryPhaseUI } from "@/components/game/CategoryPhaseUI";
import { useRouter } from "next/navigation";

type PlayerInfo = {
    role: string;
    word: string | null;
    category: string | null;
    players: Player[];
}

export default function PlayPage() {
    const params = useParams();
    const socket = useSocket();
    const router = useRouter();
    const { roomId } = params;
    const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerAlreadyVoted, setPlayerAlreadyVoted] = useState(false)
    const [turnTimer, setTurnTimer] = useState<{ timeLeft: number; duration: number }>({ timeLeft: 30, duration: 30 });
    const [currentUserId, setCurrentUserId] = useState("");
    const [roomHost, setRoomHost] = useState("");

    const gamePhasesMap : { [key: string]: string } = {
        "category": "Categoria",
        "words": "Palabras",
        "voting": "Votación",
        "discussion": "Discusión",
        "finished": "Finalizado"
    }

    const roleMap : { [key: string]: string } = {
        "impostor": "Impostor",
        "crewmate": "Neutral"
    }

    useEffect(() => {
        if (!socket) {
            return;
        }

        const setSocketId = () => {
            setCurrentUserId(socket.id ?? "");
        };

        setSocketId();
        socket.on("connect", setSocketId);

        return () => {
            socket.off("connect", setSocketId);
        };
    }, [socket]);

    useEffect(() => {
        socket?.emit("getMyRole", { roomId })

        const handleRoleAssigned = ({ role, word, category, players }: { role: string; word: string | null; category: string | null; players: Player[] }) => {
            console.log(`Received role assignment: ${role}`);
            setPlayerInfo({ role, word, category, players });
        }
        socket?.on("roleAssigned", handleRoleAssigned);

        return () => {
            socket?.off("roleAssigned", handleRoleAssigned);
        }
    }, [socket, roomId])

    useEffect(() => {
        if (gameState?.phase === "words") {
            socket?.emit("getMyRole", { roomId });
        }
    }, [socket, roomId, gameState?.phase])

    useEffect(() => {
        socket?.emit("getGameState", { roomId })
        const handleGameState = ({ room }: { room: Room | null }) => {
            if (!room) {
                return
            
            }

            if (!room.game) {
                 return 
            }
            setGameState(room.game)
            setRoomHost(room.host)
        }

        socket?.on("gameState", handleGameState)

        return() => {
            socket?.off("gameState", handleGameState)
        }
    }, [socket, roomId])


    useEffect(() => {
        const handleTimerUpdate = ({ timeLeft, duration }: { timeLeft: number; duration: number }) => {
            setTurnTimer({ timeLeft, duration });
        }

        socket?.on("timerUpdate", handleTimerUpdate)

        return () => {
            socket?.off("timerUpdate", handleTimerUpdate)
        }
    }, [socket])

    if (!gameState) {
        return (
            <main>
                <h1 className="text-4xl font-bold mb-4">Game Page</h1>
                <p className="text-2xl">Loading game state...</p>
            </main>
        );
    }

    const onVoteClick = (votedPlayerId : string) => {
        socket?.emit("submitVote", { roomId, votedPlayerId })
        setPlayerAlreadyVoted(true)
    }

    const onSelectCategory = (category: string) => {
        socket?.emit("selectCategory", { roomId, category });
    }

    if (gameState.phase === "finished") {
        setTimeout(() => {
            router.push(`/rooms/${roomId}`);
        }, 5000)
    }
    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-6">
            <section className="mx-auto w-full max-w-5xl text-center flex flex-col items-center gap-6">
            <h1 className="text-4xl">{gameState ? `Fase: ${gamePhasesMap[gameState.phase]}` : "Cargando..."}</h1>
            <h2 className="text-2xl">Tu rol es: {playerInfo ? roleMap[playerInfo.role] : "Cargando..."}</h2>
            {gameState.phase === "category" && (
                <CategoryPhaseUI
                    isHost={roomHost === currentUserId}
                    onSelectCategory={onSelectCategory}
                />
            )}
            { gameState.phase === "words" && (
                <WordsPhaseUI 
                    players={playerInfo?.players || []}
                    gameState={gameState}
                    roomId={String(roomId)}
                    word={playerInfo?.word ?? null}
                />
            )}
            
            {/* TODO: voting and discussion UI */}
            {gameState.phase === "voting" && (
                <VotingPhaseUI 
                    players={playerInfo?.players || []}
                    gameState={gameState}
                    roomId={String(roomId)}
                    playerAlreadyVoted={playerAlreadyVoted}
                    onVoteClick={onVoteClick}
                />
            )}
            {gameState.phase === "discussion" && (
                <DiscussionPhaseUI 
                    socket={socket}
                    roomId={String(roomId)}
                    currentUserId={currentUserId}
                    role={playerInfo?.role || "unassigned"}
                    players={playerInfo?.players || []}
                    gameState={gameState}
                />
            )}

            {/* Handle Game State finished UI */}
            {gameState.phase === "finished" && (
                <FinishedPhaseUI 
                players={playerInfo?.players || []} 
                gameState={gameState} 
                />
            )}
            {/* Timer */}
            {gameState.phase !== "finished" && gameState.phase !== "category" && (
                <Timer timeLeft={turnTimer.timeLeft} duration={turnTimer.duration}/>
            )}
            </section>
           
        </main>
    )
}