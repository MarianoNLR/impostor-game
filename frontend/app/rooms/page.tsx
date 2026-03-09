"use client";
import { useSocket } from "@/context/SocketContext";
import { RoomCard } from "@/components/rooms/RoomCard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Rooms() {
    const router = useRouter();
    const socket = useSocket();
    const [rooms, setRooms] = useState<{ name: string; players: string[] }[]>([]);

    useEffect(() => {
        if (!socket) return;
        getRooms();
    }, [socket]);

    const getRooms = () => {
        // Fetch rooms logic here
        fetch(`http://localhost:3001/rooms`)
        .then((res) => res.json())
        .then((data) => setRooms(data.rooms));
    }

    const onClickCreateRoom = () => {
        // Create room logic here
        socket?.emit('createRoom');
    }

    socket?.on("roomCreated", ({ roomId }) => {
        if (!roomId) {
            socket?.emit('createRoom')
        }
        console.log(`Room created with ID: ${roomId}`);
        router.push(`/rooms/${roomId}`);
    });

    socket?.on("roomsUpdated", ({ rooms }) => {
        console.log("Rooms updated:", rooms);
        setRooms(rooms);
    });

    

    return (
        <main className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-4xl font-bold mb-4">Rooms</h1>
            <div className="flex items-center justify-center gap-4 w-full max-w-md mb-8">
                <button className="mt-4 p-2 pr-10 pl-10 bg-green-500 text-white rounded-sm" onClick={onClickCreateRoom}>Create Room</button>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 w-full">
                {rooms.map((room, index) => (
                    <RoomCard key={index} room={room} />
                ))}
            </div>
            
        </main>
    );
}