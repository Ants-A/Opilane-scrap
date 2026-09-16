FROM oven/bun:latest AS base
WORKDIR /app

COPY . .
RUN bun install

EXPOSE 8080
CMD ["bun", "run", "dev"]