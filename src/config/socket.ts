import { Server } from 'socket.io'

// Shared Socket.IO instance – initialized in index.ts, accessed by controllers/services
let _io: Server | null = null

export const setIo = (io: Server): void => {
  _io = io
}

export const getIo = (): Server | null => _io
