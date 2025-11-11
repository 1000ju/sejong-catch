FROM node:18-alpine AS base
WORKDIR /app

# Install build essentials for native modules (optional but safer)
RUN apk add --no-cache python3 make g++

# Copy package metadata and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy project files (source, env, configs)
COPY . .

# Expose application port
EXPOSE 8080

# Default command
CMD ["npm", "run", "start"]
