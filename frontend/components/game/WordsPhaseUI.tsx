import { PlayerCardGame } from "@/components/game/PlayerCardGame";
import { GameState, Player } from "@/types";
import { useSocket } from "@/context/SocketContext";
import { useState } from "react";

interface WordsPhaseUIProps {
    players: Player[];
    gameState: GameState;
    roomId: string;
}

export function WordsPhaseUI({ players, gameState, roomId }: WordsPhaseUIProps) {
    const socket = useSocket();
    const [wordInput, setWordInput] = useState("");

    const onClickSubmitWord = () => {
        console.log("Enviar palabra al servidor");
        socket?.emit("submitWord", { roomId, word: wordInput });
        setWordInput("");
    }

    return (
        <div>
            <h1 className="text-4xl font-bold mb-4">Game Page</h1>
            <p className="text-2xl">Words phase - UI</p>
            {players.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mt-4">Players:</h3>
                    <div className="flex flex-wrap gap-4 mt-2">
                        {players.map((p) => (
                            <PlayerCardGame 
                            key={p.id}
                            id={p.id}
                            nickname={p.nickname} 
                            role={p.role}
                            showRole={true}
                            phase={gameState.state}
                            roomId={String(roomId)}
                            isAlive={p.isAlive || false}
                            />
                        ))}
                    </div>
                </div>
            )}
            {players[gameState.currentTurnIndex]?.id === socket?.id && gameState.state === "words" && (
                <>
                    <p className="text-2xl">{gameState ? `Current Turn: ${players[gameState.currentTurnIndex]?.nickname}` : "Loading..."}</p>
                    <input className="border-2 px-4 py-2 mr-2" 
                    placeholder="Ingresa una palabra" 
                    type="text" 
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value)} />
                    <p className="text-red-500">¡Es tu turno de escribir una palabra!</p>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={onClickSubmitWord}>Enviar</button>      
                </>
            )}
        </div>
    )
}