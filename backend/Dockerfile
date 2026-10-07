FROM oven/bun:latest AS base
WORKDIR /app

COPY package*.json ./
RUN bun install
COPY . .

EXPOSE 8080
CMD ["bun", "run", "dev"]
