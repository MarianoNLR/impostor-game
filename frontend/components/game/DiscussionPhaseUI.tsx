import { RoomChat } from "@/components/game/RoomChat";
import { Socket } from "socket.io-client";

export function DiscussionPhaseUI({socket, roomId, currentUserId, role}: {socket: Socket | null; roomId: string; currentUserId: string; role: string}) {
    return (
        <div className="mx-auto w-full max-w-5xl text-center">
            {role === "impostor" ? (
                <p className="text-2xl">¡Intenta que no te descubran!</p>
            ) : (
                <p className="text-2xl">¡Colabora con los demás jugadores para descubrir al impostor!</p>
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