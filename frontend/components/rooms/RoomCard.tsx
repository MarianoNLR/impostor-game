'use client';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import { Room } from '@/types';
import { useState } from 'react';

export function RoomCard({room}: {room: Room}) {
    const router = useRouter();
    const socket = useSocket();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    const { label, inGame } = getRoomStatus(room);

    function getRoomStatus(room: Room): { label: string; inGame: boolean } {
        if (!room.game) return { label: 'Esperando', inGame: false };
        if (room.game.phase === 'finished') return { label: 'Esperando', inGame: false };
        return { label: 'Jugando', inGame: true };
    }

    const emitJoin = (pwd?: string) => {
        setIsJoining(true);
        socket?.emit('joinRoom', { roomId: room.id, password: pwd ?? '' });

        socket?.once('joinedRoom', ({ roomId, error }: { roomId: string | null; error?: string }) => {
            setIsJoining(false);
            if (error || !roomId) {
                setPasswordError(error ?? 'No se pudo unir a la sala.');
                return;
            }
            setIsPasswordModalOpen(false);
            setPassword('');
            setPasswordError('');
            router.push(`/rooms/${roomId}`);
        });
    };

    const onClickJoinRoom = () => {
        if (room.isPrivate) {
            setPassword('');
            setPasswordError('');
            setIsPasswordModalOpen(true);
        } else {
            emitJoin();
        }
    };

    const onSubmitPassword = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!password.trim()) {
            setPasswordError('Ingresá la contraseña.');
            return;
        }
        setPasswordError('');
        emitJoin(password);
    };

    return (
        <div className="w-full max-w-md p-4 bg-gray-800 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-white">{room.name}</h2>
                <div className="flex items-center gap-2">
                    {room.isPrivate && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-600 text-white">Privada</span>
                    )}
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        inGame ? 'bg-red-600 text-white' :
                        label === 'Esperando' ? 'bg-gray-600 text-gray-300' :
                        'bg-green-600 text-white'
                    }`}>
                        {label}
                    </span>
                </div>
            </div>
            <p className="text-gray-400 mb-4">Jugadores: {room.players.length}/10</p>
            <button
                className="w-full p-2 bg-blue-500 text-white rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onClickJoinRoom}
                disabled={inGame || isJoining}
            >
                {inGame ? 'Juego en progreso' : isJoining ? 'Uniéndose...' : 'Unirse a la sala'}
            </button>

            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-lg bg-gray-900 p-6 shadow-lg border border-gray-700">
                        <h2 className="text-xl font-bold text-white mb-1">Sala privada</h2>
                        <p className="text-gray-400 text-sm mb-4">Ingresá la contraseña para unirte a <span className="text-white font-medium">{room.name}</span>.</p>

                        <form className="space-y-4" onSubmit={onSubmitPassword}>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Contraseña"
                                autoFocus
                                className="w-full rounded-md border border-gray-600 bg-gray-800 p-2 text-white outline-none focus:border-blue-500"
                            />
                            {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    className="rounded-md bg-gray-700 px-4 py-2 text-white"
                                    onClick={() => {
                                        setIsPasswordModalOpen(false);
                                        setPasswordError('');
                                        setIsJoining(false);
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isJoining}
                                    className="rounded-md bg-blue-500 px-4 py-2 text-white disabled:opacity-60"
                                >
                                    {isJoining ? 'Uniéndose...' : 'Unirse'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}