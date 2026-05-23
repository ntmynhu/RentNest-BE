FROM node:20-alpine

# Prisma cần OpenSSL để chạy trên Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Cài tất cả dependencies (kể cả devDeps để build TS)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./

# Generate Prisma client + build TypeScript → tạo ra /dist
RUN npx prisma generate
RUN npm run build

# Xóa devDependencies sau khi build xong
RUN npm prune --production

EXPOSE 3000

CMD ["npm", "start"]
