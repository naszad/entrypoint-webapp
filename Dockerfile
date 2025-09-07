# 1. Builder Stage
# We'll use the official Node.js 22 Alpine image as our base.
# Alpine is a lightweight Linux distribution, which helps keep our image size down.
FROM node:22-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install all dependencies, including devDependencies for building
# Using 'ci' is generally faster and more reliable for builds
RUN npm ci

# Copy the rest of the application's source code
COPY . .

# Run the build script defined in package.json
RUN npm run build

# 2. Runner Stage
# This stage will create the final, lightweight image
FROM node:22-alpine AS runner

WORKDIR /app

# The node:22-alpine image includes a non-root 'node' user. We'll use this user to run our application.
# By default, the WORKDIR is created by root. We'll copy our package files, then change the
# ownership of the entire /app directory to the 'node' user.
COPY --from=builder /app/package*.json ./
RUN chown -R node:node /app

# Switch to the 'node' user
USER node

# Now that we're the 'node' user, we can install our production dependencies.
# The 'node' user has write permissions to /app, so it can create the node_modules directory.
RUN npm ci --omit=dev

# Copy the rest of our application assets from the builder stage.
# These files will be owned by the 'node' user because we switched users.
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public


# Expose the port the app will run on
EXPOSE 3000

# Set the command to start the Next.js application
# 'npm start' is the conventional way to run a production Next.js app
CMD ["npm", "start"]
