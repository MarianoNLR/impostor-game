import data from "../data/store"
import { Room } from "../types"

export const roomRepository = {
  findById: (roomId: string): Room | null => {
    return data.rooms[roomId] ?? null
  },

  findAll: (): Room[] => {
    return Object.values(data.rooms)
  },

  save: (room: Room): void => {
    data.rooms[room.id] = room
  },

  delete: (roomId: string): void => {
    delete data.rooms[roomId]
  }
}