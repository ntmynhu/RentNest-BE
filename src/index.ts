import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import app from './app'
import { env } from './config/env'
import { prisma } from './config/database'
import { cronService } from './services/cron.service'

const httpServer = createServer(app)

// WebSocket for real-time messaging (UC6, UC14)
const io = new SocketServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (!origin || origin === env.FRONTEND_URL || origin === 'http://localhost:5173') return callback(null, true)
      if (origin.endsWith('.vercel.app')) return callback(null, true)
      callback(new Error(`CORS blocked: ${origin}`))
    },
    credentials: true,
    methods: ['GET', 'POST'],
  },
})

// Track online users: userId → socketId
const onlineUsers = new Map<number, string>()

io.on('connection', (socket) => {
  const userId = parseInt(socket.handshake.query.userId as string)
  if (userId) onlineUsers.set(userId, socket.id)

  socket.on('join_conversation', (conversationId: number) => {
    socket.join(`conversation_${conversationId}`)
  })

  socket.on('send_message', (data: { conversationId: number; toUserId: number; message: any }) => {
    // Emit to conversation room
    io.to(`conversation_${data.conversationId}`).emit('new_message', data.message)

    // Send notification to recipient if online
    const recipientSocketId = onlineUsers.get(data.toUserId)
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('notification', {
        type: 'NEW_MESSAGE',
        conversationId: data.conversationId,
        message: data.message,
      })
    }
  })

  socket.on('disconnect', () => {
    onlineUsers.delete(userId)
  })
})

const startServer = async () => {
  try {
    await prisma.$connect()
    console.log('✅ Database connected')

    cronService.init()

    httpServer.listen(env.PORT, () => {
      console.log(`🚀 RentNest server running on port ${env.PORT}`)
      console.log(`📡 WebSocket ready`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  await prisma.$disconnect()
  process.exit(0)
})

startServer()
