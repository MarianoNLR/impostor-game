export function PlayerCardLobby({ nickname }: { nickname: string }) {
    return (
        <div className={`flex flex-col items-center gap-2 p-4 rounded-2xl border w-28 backdrop-blur-sm transition-all
          bg-slate-800/60 border-slate-700/50`}>
            <p className="text-white">{nickname}</p>
        </div>
    );

}