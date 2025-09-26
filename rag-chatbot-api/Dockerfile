# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Expose the port the app runs on
EXPOSE 3005

# Set environment variable for port
ENV PORT=3005

# Command to run the application
CMD ["npm", "run", "start:prod"]