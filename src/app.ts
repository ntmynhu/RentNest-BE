import 'reflect-metadata'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import router from './routes'
import { errorHandler, notFoundHandler } from './utils/handler'
import { env } from './config/env'

const app = express()

// Security headers
app.use(helmet())

// CORS — cho phép nhiều origin (local dev + production Vercel)
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // cho phép requests không có origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    // cho phép tất cả subdomain vercel.app (preview deployments)
    if (origin.endsWith('.vercel.app')) return callback(null, true)
    callback(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
}

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api', router)

// 404 + Error handlers
app.use(notFoundHandler)
app.use(errorHandler)

export default app
