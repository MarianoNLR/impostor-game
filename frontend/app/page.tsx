'use client';

import { useSocket } from '@/context/SocketContext';
import { useState } from "react";
import { useRouter } from "next/navigation"

export default function Home() {
  const socket = useSocket();
  const router = useRouter()
  const [nickname, setNickname] = useState("");

  const onPlayButtonClick = () => {
    socket?.emit("set_nickname", { nickname });
  }

  socket?.on("set_nickname", ({ ok }) => {
    console.log("Nickname set:", ok);
    if (ok) {
      // Redirect to lobbies page
      router.push("/rooms")
    }
  })

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Impostor Game</h1>
      <input
        className="p-2 border-2 border-gray-600 rounded-sm"
        type="text"
        placeholder="Enter your nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <button className="mt-4 p-2 pr-10 pl-10 bg-blue-500 text-white rounded-sm" onClick={onPlayButtonClick}>Play</button>
    </main>
  );
}
