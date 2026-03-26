import { PlayerCardLobby } from "@/components/lobby/PlayerCardLobby"
import { Users } from "lucide-react";

export function PlayersListLobby({ players }: { players: { id: string; nickname: string }[] }) {
    return (
        <section className="glass-panel w-full max-w-md rounded-3xl border border-white/10 p-5 shadow-2xl shadow-black/35 sm:p-6">
            <header className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-2xl text-white">Jugadores en sala</h2>
                <span className="inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neon">
                    <Users className="h-3.5 w-3.5" />
                    {players?.length ?? 0}
                </span>
            </header>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {players?.map((player, index) => (
                    <li key={index}>
                        <PlayerCardLobby nickname={player.nickname} />
                    </li>
                ))}
            </ul>
        </section>
    )
}