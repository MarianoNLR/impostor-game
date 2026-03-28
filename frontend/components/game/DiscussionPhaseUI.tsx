import { PlayerCardGame } from "@/components/game/PlayerCardGame";
import { RoomChat } from "@/components/game/RoomChat";
import { GameState, Player } from "@/types";
import { Socket } from "socket.io-client";

interface DiscussionPhaseUIProps {
    socket: Socket | null;
    roomId: string;
    currentUserId: string;
    role: string;
    players: Player[];
    gameState: GameState;
}

export function DiscussionPhaseUI({socket, roomId, currentUserId, role, players, gameState}: DiscussionPhaseUIProps) {
    return (
        <div className="mx-auto w-full max-w-5xl text-center">
            {role === "impostor" ? (
                <p className="text-2xl">¡Intenta que no te descubran!</p>
            ) : (
                <p className="text-2xl">¡Colabora con los demás jugadores para descubrir al impostor!</p>
            )}

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
                                wordsSubmitted={gameState.wordsSubmitted}
                                isAlive={p.isAlive || false}
                            />
                        ))}
                    </div>
                </div>
            )}

            <aside className="mx-auto mt-4 w-full max-w-3xl text-left">
                <RoomChat
                    socket={socket}
                    roomId={String(roomId)}
                    currentUserId={currentUserId}
                />
            </aside>
        </div>
    )
}