import { User } from "lucide-react";

export function PlayerCardLobby({ nickname }: { nickname: string }) {
    return (
        <div className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-4 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-neon/45 hover:bg-slate-800/75">
            <User className="h-4 w-4 text-neon/80" />
            <p className="max-w-full truncate text-sm font-semibold text-slate-100">{nickname}</p>
        </div>
    );

}