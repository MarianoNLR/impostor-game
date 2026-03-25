import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import { Room } from '@/types';

export function RoomCard({room}: {room: Room}) {
    const router = useRouter();
    const socket = useSocket();

    const onClickJoinRoom = () => {
        // Join room logic here
        console.log("Joining room:", room.name);
        socket?.emit('joinRoom', { roomId: room.id });

        socket?.once("joinedRoom", ({ roomId }) => {
        console.log(`Joined room with ID: ${roomId}`);
        router.push(`/rooms/${roomId}`);
    });
    }

    return (
        <div className="w-full max-w-md p-4 bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-2 text-white">{room.name}</h2>
            <p className="text-gray-400 mb-4">Players: {room.players.length}/10</p>
            <button className="w-full p-2 bg-blue-500 text-white rounded-sm" onClick={onClickJoinRoom}>Join Room</button>
        </div>
    );
}