FROM oven/bun:latest AS base
WORKDIR /app

COPY package.json bun.lock* bun.lockb* ./
RUN bun install --frozen-lockfile
COPY . .

EXPOSE 3000
CMD ["bun", "run", "dev"]