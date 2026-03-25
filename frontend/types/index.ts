export type Player = {
  id: string;
  nickname: string;
  isAlive?: boolean;
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
  state:  "voting" | "discussion" | "words" | "finished";
  word: string;
  category: string;
  turnOrder: string[];
  currentTurnIndex: number;
  votes: Record<string, string>;
  winner: "impostors" | "crewmates" | null;
  wordsSubmitted: Record<string, string[]>;
}

export type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  senderNickname: string;
  message: string;
  createdAt: number;
};