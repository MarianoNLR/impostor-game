import { GameState, Player } from "@/types";
import { PlayerCardGame } from "./PlayerCardGame";

interface VotingPhaseUIProps {
    players: Player[],
    gameState: GameState,
    roomId: string,
    playerAlreadyVoted: boolean,
    onVoteClick: (votedPlayerId: string) => void
}

export function VotingPhaseUI({ players, gameState, roomId, playerAlreadyVoted, onVoteClick }: VotingPhaseUIProps) {
    return (
        <div className="mx-auto w-full max-w-5xl text-center">
            <p className="text-2xl">Es momento de votar!</p>
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
                            playerAlreadyVoted={playerAlreadyVoted}
                            onVote={onVoteClick}
                            isAlive={p.isAlive || false}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}