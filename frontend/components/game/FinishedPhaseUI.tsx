import { GameState, Player } from "@/types/index";

interface FinishedPhaseUIProps {
    players: Player[],
    gameState: GameState
}

export function FinishedPhaseUI({ players, gameState }: FinishedPhaseUIProps) {
    return (
        <div>
            <h1 className="text-4xl font-bold mb-4">Game Page</h1>
            <p className="text-2xl">Finished phase - UI</p>
            <p className="text-2xl">Show Results Here!</p>

            {gameState.winner && (
                <h2 className="text-3xl font-bold mt-4">{`Winner: ${gameState.winner}`}</h2>
            )}
        </div>
    )
}