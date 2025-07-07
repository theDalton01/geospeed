# Use a lightweight Node.js image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Build the application for production
RUN npm run build

# Expose the port that the application will run on
EXPOSE 3000

# Command to run the application using 'serve' to serve the built static files
# 'npx serve dist' will serve the contents of the 'dist' directory
# '-l 3000' specifies that it should listen on port 3000
CMD ["npx", "serve", "dist", "-l", "3000"]
