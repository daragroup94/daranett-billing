FROM node:22-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache openssl libc6-compat bash

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .


EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use custom entrypoint script to handle database migration and start
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
