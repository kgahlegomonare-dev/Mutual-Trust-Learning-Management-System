# Use an official Node.js runtime as the base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package configuration files first to optimize layer caching
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Expose the Vite development server port (Vite typically defaults to 5173)
EXPOSE 5173

# Vite requires host binding (0.0.0.0) to be accessible outside the container
# If your package.json script is just "vite", you can append -- --host or configure it here
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]