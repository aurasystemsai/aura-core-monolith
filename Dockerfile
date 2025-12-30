# Dockerfile for Aura Core Monolith (backend)
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy source code
COPY src ./src
COPY .env* ./

# Expose port (default 10000)
EXPOSE 10000

# Start the server
CMD ["npm", "start"]
