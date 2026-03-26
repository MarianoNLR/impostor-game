import { GameState, Player } from "@/types/index";

interface FinishedPhaseUIProps {
    players: Player[],
    gameState: GameState
}

export function FinishedPhaseUI({ players, gameState }: FinishedPhaseUIProps) {
    return (
        <div className="mx-auto w-full max-w-4xl text-center">
            <h1 className="text-4xl font-bold mb-4">Game Page</h1>
            <p className="text-2xl">Finished phase - UI</p>
            <p className="text-2xl">Show Results Here!</p>

            {gameState.winner && (
                <>
                    {gameState.winner === "impostors" ? (
                        <p className="text-2xl font-bold text-red-500">¡El equipo impostor ha ganado!</p>
                    ) : (
                        <p className="text-2xl font-bold text-green-500">¡El equipo de neutrales ha ganado!</p>
                    )}
                </>
            )}
        </div>
    )
}