import { PlayerCardLobby } from "@/components/lobby/PlayerCardLobby"

export function PlayersListLobby({ players }: { players: { id: string; nickname: string }[] }) {
    return (
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-4">
            <h2 className="text-2xl font-bold mb-4">Players in Room</h2>
            <ul>
                {players?.map((player, index) => (
                    <li key={index} className="mb-2">
                        <PlayerCardLobby nickname={player.nickname} />
                    </li>
                ))}
            </ul>
        </div>
    )
}