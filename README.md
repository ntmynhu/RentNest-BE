# RentNest Backend

Backend API cho nền tảng cho thuê phòng trọ RentNest.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js v5
- **ORM**: Prisma v5
- **Database**: PostgreSQL
- **Auth**: JWT (Access + Refresh Token)
- **Real-time**: Socket.IO (WebSocket)
- **Upload**: Cloudinary
- **Email**: Nodemailer
- **Cron**: node-cron

## Architecture

```
src/
├── config/          # Env, DB, Cloudinary, Email config
├── controllers/     # Request handlers (thin layer)
├── services/        # Business logic
├── routes/          # Express routers
├── middlewares/     # Auth, DTO validation
├── dtos/            # Data Transfer Objects (class-validator)
├── enums/           # TypeScript enums
├── core/            # Error/Success response classes
├── utils/           # JWT, handler, helpers
└── seeds/           # Database seed data
```

**Design Pattern**: Layered Architecture (Controller → Service → Prisma)

## Use Cases Implemented

| UC | Tên | Actor |
|----|-----|-------|
| UC1 | Sign Up (với email verification) | Unauthenticated |
| UC2 | Sign In (JWT) | Registered User |
| UC3 | Forgot Password (email reset) | User |
| UC4 | Search & Filter Rooms | Any |
| UC5 | Get Recommendations (Hybrid Algorithm) | Authenticated |
| UC6 | Contact Landlord (WebSocket) | Tenant |
| UC7 | Post Room Listing | Landlord |
| UC8 | Manage Tenants | Landlord |
| UC9 | Manage Contracts | Landlord |
| UC10 | Track Payment (Auto overdue cron) | Tenant / Landlord |
| UC11 | Review & Rating | Tenant |
| UC12 | Report Listing/User | Any Authenticated |
| UC13 | Approve/Reject Listing (+ email) | Admin |
| UC14 | Contact Tenant (WebSocket) | Landlord |
| UC15 | Ban/Warn Account | Admin |

## Quality Attributes

- **Security**: Helmet, CORS, JWT, bcrypt, role-based access control
- **Performance**: Pagination trên tất cả list endpoints, DB indexes
- **Availability**: Health check endpoint, graceful shutdown
- **Maintainability**: Layered architecture, DTOs, centralized error handling
- **Scalability**: Prisma connection pooling, WebSocket với Socket.IO

## Setup

```bash
# 1. Cài dependencies
npm install

# 2. Copy env
cp .env.example .env
# Điền DATABASE_URL, JWT secrets, Email, Cloudinary

# 3. Chạy database
docker-compose up postgres -d

# 4. Migrate + seed
npm run db:migrate
npm run db:seed

# 5. Chạy dev
npm run dev
```

## API Endpoints

### Auth
```
POST   /api/auth/register
GET    /api/auth/verify-email?token=...
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
```

### Listings
```
GET    /api/listings                    # Search & Filter
GET    /api/listings/recommendations    # Personalized recommendations
GET    /api/listings/my/listings        # Landlord's listings
GET    /api/listings/:id
POST   /api/listings                    # [LANDLORD] Create listing
PUT    /api/listings/:id                # [LANDLORD] Update
DELETE /api/listings/:id                # [LANDLORD] Delete
GET    /api/listings/admin/pending      # [ADMIN] Pending queue
PATCH  /api/listings/:id/approve        # [ADMIN] Approve
PATCH  /api/listings/:id/reject         # [ADMIN] Reject
```

### Tenant Management (Landlord only)
```
GET    /api/tenants
POST   /api/tenants
GET    /api/tenants/:id
PUT    /api/tenants/:id
DELETE /api/tenants/:id
```

### Contract Management (Landlord only)
```
GET    /api/contracts
POST   /api/contracts
GET    /api/contracts/:id
PUT    /api/contracts/:id
PATCH  /api/contracts/:id/archive
```

### Payment Tracking
```
GET    /api/payments                    # [TENANT or LANDLORD]
POST   /api/payments                    # [LANDLORD]
PATCH  /api/payments/:id/paid           # [LANDLORD]
```

### Reviews
```
GET    /api/reviews/listing/:listingId
POST   /api/reviews/listing/:listingId  # [TENANT]
```

### Messaging (Real-time via WebSocket)
```
GET    /api/messages/conversations
GET    /api/messages/conversations/:id
POST   /api/messages/landlord/:landlordId  # [TENANT → LANDLORD]
POST   /api/messages/tenant/:tenantId      # [LANDLORD → TENANT]
```

### Reports
```
POST   /api/reports
GET    /api/reports    # [ADMIN]
PATCH  /api/reports/:id  # [ADMIN]
```

### Users (Admin only)
```
GET    /api/users
GET    /api/users/:id
POST   /api/users/:id/warn
POST   /api/users/:id/ban
```

## WebSocket Events (Socket.IO)

```javascript
// Client connects with userId
const socket = io('http://localhost:3000', { query: { userId: 123 } })

// Join a conversation room
socket.emit('join_conversation', conversationId)

// Send message
socket.emit('send_message', { conversationId, toUserId, message })

// Listen for new messages
socket.on('new_message', (message) => { ... })

// Listen for notifications
socket.on('notification', ({ type, conversationId, message }) => { ... })
```

## Recommendation Algorithm (UC5)

Hybrid model với weighted scoring:

```
FinalScore = α(ContentScore) + β(CollaborativeScore) + γ(PopularityScore)
           = 0.4(Content) + 0.3(Collaborative) + 0.3(Popularity)
```

- **Content-Based**: Match theo room type, city, price range từ lịch sử xem
- **Collaborative**: Gợi ý từ users có behavior tương đồng
- **Popularity**: Weighted bởi rating trung bình + view count

## Default Accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@rentnest.com | Admin@123 |
| Landlord | landlord@rentnest.com | Admin@123 |
| Tenant | tenant@rentnest.com | Admin@123 |
