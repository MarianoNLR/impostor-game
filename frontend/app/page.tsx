'use client';

import { useNicknameState, useSocket } from '@/context/SocketContext';
import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"

export default function Home() {
  const socket = useSocket();
  const router = useRouter()
  const { setHasNickname } = useNicknameState();
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onPlayButtonClick = () => {
    const normalizedNickname = nickname.trim();
    if (!socket || !normalizedNickname) {
      return;
    }

    setIsSubmitting(true);
    socket.emit("set_nickname", { nickname: normalizedNickname });
  }

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleSetNickname = ({ ok }: { ok: boolean }) => {
      setIsSubmitting(false);
      if (ok) {
        setHasNickname(true);
        router.push("/rooms");
      }
    };

    socket.on("set_nickname", handleSetNickname);
    return () => {
      socket.off("set_nickname", handleSetNickname);
    };
  }, [socket, router, setHasNickname]);

  const isDisabled = !nickname.trim() || isSubmitting;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div className="pointer-events-none absolute left-0 top-0 h-44 w-44 -translate-x-1/2 -translate-y-1/3 rounded-full bg-neon/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 translate-x-1/4 translate-y-1/4 rounded-full bg-ember/25 blur-3xl" />

      <section className="glass-panel relative z-10 w-full max-w-lg rounded-3xl border border-white/10 p-8 shadow-2xl shadow-black/40 sm:p-10">

        <h1 className="font-display text-4xl leading-tight text-white sm:text-4xl text-center">
          Juego del Impostor.
        </h1>

        <p className="mt-3 text-lg text-slate-300 text-center">
          ¿Podrás descubrir quién miente?
        </p>

        <div className="mt-8 space-y-4">
          <label htmlFor="nickname" className="block text-sm font-medium text-slate-200">
            Nombre de jugador
          </label>
          <div className="group flex items-center rounded-2xl border border-white/15 bg-slate-900/70 px-4 transition focus-within:border-neon/60 focus-within:shadow-[0_0_0_3px_hsl(var(--neon)/0.2)]">
            <User className="h-4 w-4 text-neon/80" />
            <input
              id="nickname"
              className="w-full bg-transparent px-3 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none"
              type="text"
              placeholder="Ej: DetectiveLuna"
              value={nickname}
              maxLength={20}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <button
            className="w-full rounded-2xl bg-gradient-to-r from-neon to-emerald-300 px-5 py-3 font-semibold text-ink transition hover:scale-[1.01] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
            onClick={onPlayButtonClick}
            disabled={isDisabled}
          >
            {isSubmitting ? "Entrando..." : "Continuar"}
          </button>
        </div>

        <p className="mt-6 text-sm text-slate-400 text-center">
          Prepárate para jugar y descubrir al impostor
        </p>
      </section>
    </main>
  );
}
