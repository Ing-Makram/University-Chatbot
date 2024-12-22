# Stage 0: Base - Download Hexabot API
FROM hexastack/hexabot-base:latest AS base

WORKDIR /app

# Stage 1: Builder - Download and merge Hexabot API with new project dependencies
FROM node:18-alpine AS builder

WORKDIR /app

# Step 1: Copy Hexabot API folder
COPY --from=base /app ./

# Step 2: Copy the new project dependencies (generated by Hexabot CLI)
COPY package.json ./package.extra.json

# Step 3: Install dependencies for both Hexabot API and new project
RUN npm ci

# Step 4: Copy extra source files
COPY ./modules ./src/extra
COPY ./extensions ./src/.hexabot/custom/extensions

# Step 5: Build the application
RUN npm run build

# Stage 2: Development environment
FROM node:18-alpine AS development

WORKDIR /app

# Step 1: Copy only necessary files from the base stage
COPY --from=base /app ./
COPY package.json ./package.extra.json

# Step 2: Add extra dependencies
RUN node add-extra-deps.js

# Step 3: Install all dependencies
RUN npm install

# Step 4: Copy all source files
COPY ./modules ./src/extra
COPY ./extensions ./src/.hexabot/custom/extensions

# Set environment for development
ENV NODE_ENV=development

EXPOSE 3000

CMD ["npm", "run", "start:debug"]

# Stage 3: Production environment
FROM node:18-alpine AS production

WORKDIR /app

# Step 8: Copy necessary files from builder stage for production
COPY package.json ./package.extra.json

RUN node add-extra-deps.js

COPY --from=builder /app/patches ./patches

# Step 9: Install only production dependencies
RUN npm ci --only=production

# Step 10: Copy the built application from builder
COPY --from=builder /app/dist ./dist

# Set environment for production
ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start:prod"]