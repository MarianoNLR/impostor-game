export type Player = {
  id: string;
  nickname: string;
  isAlive: boolean;
  role: "impostor" | "crewmate" | "unassigned";
};

export type Room = {
  id: string;
  name: string;
  host: string;
  players: Player[];
  game: GameState | null;
};

export type GameState = {
  state: "lobby" | "voting" | "discussion" | "words";
  word: string;
  category: string;
  turnOrder: string[];
  currentTurnIndex: number;
  impostorIds: string[];
  votes: Record<string, string>;
  eliminatedIds: string[];
  wordsSubmitted?: Record<string, string>;
}

const data: { rooms: Record<string, Room>} = {
  rooms: {},
};

export default data;