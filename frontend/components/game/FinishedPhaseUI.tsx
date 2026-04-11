import { GameState, Player } from "@/types/index";
import { useEffect, useState } from "react";

interface FinishedPhaseUIProps {
    players: Player[]
    gameState: GameState
}

export function FinishedPhaseUI({ players, gameState }: FinishedPhaseUIProps) {
    const [redirectSeconds, setRedirectSeconds] = useState(5);

    useEffect(() => {
        const interval = setInterval(() => {
            setRedirectSeconds((prev) => prev - 1);
        }, 1000);
    
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="mx-auto w-full max-w-4xl text-center">
            <h1 className="text-4xl font-bold mb-4">Game Page</h1>

            {gameState.winner && (
                <>
                    {gameState.winner === "impostors" ? (
                        <p className="text-2xl font-bold text-red-500">¡El equipo impostor ha ganado!</p>
                    ) : (
                        <p className="text-2xl font-bold text-green-500">¡El equipo de inocentes ha ganado!</p>
                    )}
                </>
            )}
            <p className="mt-4 text-lg text-slate-600">
                Volviendo al lobby en {redirectSeconds}s...
            </p>
        </div>
    )
}