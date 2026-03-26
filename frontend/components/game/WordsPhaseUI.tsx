import { PlayerCardGame } from "@/components/game/PlayerCardGame";
import { GameState, Player } from "@/types";
import { useSocket } from "@/context/SocketContext";
import { useState } from "react";

interface WordsPhaseUIProps {
    players: Player[];
    gameState: GameState;
    roomId: string;
    word: string | null;
}

export function WordsPhaseUI({ players, gameState, roomId, word }: WordsPhaseUIProps) {
    const socket = useSocket();
    const [wordInput, setWordInput] = useState("");

    const onClickSubmitWord = () => {
        console.log("Enviar palabra al servidor");
        socket?.emit("submitWord", { roomId, word: wordInput });
        setWordInput("");
    }

    return (
        <div className="mx-auto w-full max-w-5xl text-center">
            <p className="text-xl">Los jugadores deben escribir una palabra relacionada a la palabra <span className="font-bold">{word ?? "Secreta"}</span></p>
            {players.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mt-4">Jugadores:</h3>
                    <div className="mt-2 flex flex-wrap justify-center gap-4">
                        {players.map((p) => (
                            <PlayerCardGame 
                            key={p.id}
                            id={p.id}
                            nickname={p.nickname} 
                            role={p.role}
                            showRole={true}
                            phase={gameState.phase}
                            roomId={String(roomId)}
                            isAlive={p.isAlive || false}
                            />
                        ))}
                    </div>
                </div>
            )}
            <p className="text-xl font-semibold text-cyan-100">
                        {gameState ? `Turno actual: ${players[gameState.currentTurnIndex]?.nickname}` : "Cargando..."}
            </p>
            {players[gameState.currentTurnIndex]?.id === socket?.id && gameState.phase === "words" && (
                <div className="mx-auto mt-6 w-full max-w-2xl rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-5 text-left shadow-lg backdrop-blur-sm">
                    <p className="text-xl text-center font-semibold text-cyan-100">
                        {gameState ? `Es tu turno de escribir una palabra!` : "Cargando..."}
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input
                            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 sm:flex-1"
                            placeholder="Ingresa una palabra"
                            type="text"
                            value={wordInput}
                            maxLength={40}
                            onChange={(e) => setWordInput(e.target.value)}
                        />
                        <button
                            className="rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-3 font-semibold text-slate-950 shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-500 disabled:text-slate-300"
                            onClick={onClickSubmitWord}
                            disabled={!wordInput.trim()}
                        >
                            Enviar
                        </button>
                    </div>
                    <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200 text-center">
                        ¡Es tu turno de escribir una palabra!
                    </p>
                </div>
            )}
        </div>
    )
}