"use client";
import { useSocket } from "@/context/SocketContext";
import { RoomCard } from "@/components/rooms/RoomCard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Room } from "@/types";

type RoomCreatedPayload = {
    roomId: string | null;
    error?: string;
};

export default function Rooms() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
    const router = useRouter();
    const socket = useSocket();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [roomName, setRoomName] = useState("");
    const [isPrivateRoom, setIsPrivateRoom] = useState(false);
    const [roomPassword, setRoomPassword] = useState("");
    const [formError, setFormError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        if (!socket) return;
        getRooms();
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const handleRoomCreated = ({ roomId, error }: RoomCreatedPayload) => {
            setIsSubmitting(false);

            if (error || !roomId) {
                setFormError(error ?? "No se pudo crear la sala.");
                return;
            }

            setFormError("");
            router.push(`/rooms/${roomId}`);
        };

        const handleRoomsUpdated = ({ rooms }: { rooms: Room[] }) => {
            setRooms(rooms);
        };

        socket.on("roomCreated", handleRoomCreated);
        socket.on("roomsUpdated", handleRoomsUpdated);

        return () => {
            socket.off("roomCreated", handleRoomCreated);
            socket.off("roomsUpdated", handleRoomsUpdated);
        };
    }, [socket, router]);

    const getRooms = () => {
        fetch(`${backendUrl}/rooms`)
        .then((res) => res.json())
        .then((data) => setRooms(data.rooms));
    }

    const onClickCreateRoom = () => {
        setFormError("");
        setIsCreateModalOpen(true);
    }

    const onSubmitCreateRoom = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!socket) return;

        const trimmedName = roomName.trim();
        const trimmedPassword = roomPassword.trim();

        if (isPrivateRoom && !trimmedPassword) {
            setFormError("La contraseña es obligatoria para una sala privada.");
            return;
        }

        setFormError("");
        setIsSubmitting(true);
        socket.emit("createRoom", {
            name: trimmedName,
            isPrivate: isPrivateRoom,
            password: isPrivateRoom ? trimmedPassword : "",
        });
    };


    return (
        <main className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-4xl font-bold mb-4">Salas</h1>
            <div className="flex items-center justify-center gap-4 w-full max-w-md mb-8">
                <button className="mt-4 p-2 pr-10 pl-10 bg-green-500 text-white rounded-sm" onClick={onClickCreateRoom}>Crear Sala</button>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 w-full">
                {rooms.map((room, index) => (
                    <RoomCard key={index} room={room} />
                ))}
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-lg bg-gray-900 p-6 shadow-lg border border-gray-700">
                        <h2 className="text-2xl font-bold text-white mb-4">Crear Sala</h2>

                        <form className="space-y-4" onSubmit={onSubmitCreateRoom}>
                            <div>
                                <label htmlFor="room-name" className="mb-1 block text-sm font-medium text-gray-200">
                                    Nombre de la sala
                                </label>
                                <input
                                    id="room-name"
                                    type="text"
                                    value={roomName}
                                    onChange={(event) => setRoomName(event.target.value)}
                                    placeholder="Ej: Sala de Mariano"
                                    maxLength={40}
                                    className="w-full rounded-md border border-gray-600 bg-gray-800 p-2 text-white outline-none focus:border-green-500"
                                />
                            </div>

                            <label className="flex items-center gap-2 text-gray-200">
                                <input
                                    type="checkbox"
                                    checked={isPrivateRoom}
                                    onChange={(event) => {
                                        setIsPrivateRoom(event.target.checked);
                                        if (!event.target.checked) {
                                            setRoomPassword("");
                                        }
                                    }}
                                />
                                Sala Privada
                            </label>

                            {isPrivateRoom && (
                                <div>
                                    <label htmlFor="room-password" className="mb-1 block text-sm font-medium text-gray-200">
                                        Contraseña
                                    </label>
                                    <input
                                        id="room-password"
                                        type="password"
                                        value={roomPassword}
                                        onChange={(event) => setRoomPassword(event.target.value)}
                                        placeholder="Ingresa una contraseña"
                                        className="w-full rounded-md border border-gray-600 bg-gray-800 p-2 text-white outline-none focus:border-green-500"
                                    />
                                </div>
                            )}

                            {formError && <p className="text-sm text-red-400">{formError}</p>}

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    className="rounded-md bg-gray-700 px-4 py-2 text-white"
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setFormError("");
                                        setIsSubmitting(false);
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-md bg-green-500 px-4 py-2 text-white disabled:opacity-60"
                                >
                                    {isSubmitting ? "Creando..." : "Crear sala"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
        </main>
    );
}