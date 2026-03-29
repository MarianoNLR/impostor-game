import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import { Room } from '@/types';

export function RoomCard({room}: {room: Room}) {
    const router = useRouter();
    const socket = useSocket();

    const { label, inGame } = getRoomStatus(room);

    function getRoomStatus(room: Room): { label: string; inGame: boolean } {
        if (!room.game) return { label: 'Esperando', inGame: false };
        if (room.game.phase === 'finished') return { label: 'Esperando', inGame: false };
        return { label: 'Jugando', inGame: true };
    }

    const onClickJoinRoom = () => {
        console.log("Joining room:", room.name);
        socket?.emit('joinRoom', { roomId: room.id });

        socket?.once("joinedRoom", ({ roomId }) => {
            console.log(`Joined room with ID: ${roomId}`);
            router.push(`/rooms/${roomId}`);
        });
    }

    return (
        <div className="w-full max-w-md p-4 bg-gray-800 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-white">{room.name}</h2>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    inGame ? 'bg-red-600 text-white' :
                    label === 'Esperando' ? 'bg-gray-600 text-gray-300' :
                    'bg-green-600 text-white'
                }`}>
                    {label}
                </span>
            </div>
            <p className="text-gray-400 mb-4">Jugadores: {room.players.length}/10</p>
            <button
                className="w-full p-2 bg-blue-500 text-white rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onClickJoinRoom}
                disabled={inGame}
            >
                {inGame ? 'Juego en progreso' : 'Unirse a la sala'}
            </button>
        </div>
    );
}