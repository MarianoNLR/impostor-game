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
        <div>
            <h1 className="text-4xl font-bold mb-4">Game Page</h1>
            <p className="text-2xl">Voting phase - UI</p>
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