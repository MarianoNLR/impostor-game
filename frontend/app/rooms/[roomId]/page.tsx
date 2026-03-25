'use client';

import { useParams } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import { useEffect, useState } from 'react';
import { PlayersListLobby } from '@/components/lobby/PlayersListLobby';
import { Player, Room } from '@/types/index';
import { useRouter } from 'next/navigation';
export default function RoomPage() {
    const router = useRouter();
    const params = useParams();
    const { roomId } = params;
    const socket = useSocket();
    const [roomData, setRoomData] = useState<Room | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);

    useEffect(() => {
        const handlePlayerJoined = (player: Player) => {
            console.log(`Player joined: ${player.nickname} (ID: ${player.id})`);
            setPlayers((prevPlayers) => [...prevPlayers, { id: player.id, nickname: player.nickname, role: player.role }]);
        }

        const handlePlayerLeft = (player: Player) => {
            console.log(`Player left: ID ${player.id}`);
            setPlayers((prevPlayers) => prevPlayers.filter(p => p.id !== player.id));
        }

        socket?.on("playerJoined", handlePlayerJoined)
        socket?.on("playerLeft", handlePlayerLeft)

        const fetchRoomDetails = () => {
            // Fetch room details logic here
            fetch(`http://localhost:3001/rooms/${roomId}`)
            .then((res) => res.json())
            .then((data) => {
                console.log("Room details:", data);
                setRoomData(data.room);
                setPlayers(data.room.players);
            });
            console.log(`Fetching details for room ID: ${roomId}`);
        }
        fetchRoomDetails();

        return () => {
            socket?.off("playerJoined", handlePlayerJoined);
            socket?.off("playerLeft", handlePlayerLeft);
        };
    }, [socket, roomId]);

    // Game
    useEffect(() => {
        const handleGameStarted = ({ room, error }: { room: Room; error?: string }) => {
            if (error) {
                console.log("Error starting game:", error);
                return;
            }
            console.log("Game started successfully for room ID:", room.id);
            setRoomData(room);
            router.push(`/rooms/${room.id}/play`);
        }

        socket?.on("gameStarted", handleGameStarted);

        return () => {
            socket?.off("gameStarted", handleGameStarted);
        }
    }, [socket, router])

    const onClickStartGame = () => {
        // Start game logic here
        console.log("Starting game for room ID:", roomId);
        socket?.emit('startGame', { roomId });
    }

    return (
        <main className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-4xl font-bold mb-4">Room</h1>
            <h2>Room ID: {roomId}</h2>
            {roomData && <PlayersListLobby players={players} />}
            {roomData?.host == socket?.id && 
                <button className="mt-4 p-2 pr-10 pl-10 bg-green-500 text-white rounded-sm" 
                onClick={onClickStartGame}>Start Game
                </button>
            }
        </main>
    );
}