# NetScope - Network Speed Testing Platform

A web-based network speed testing platform using Librespeed backend and a custom frontend with Alpine.js for state management.

## Project Structure

```
netscope/
├── frontend/           # Alpine.js frontend application
├── backend/            # Node.js/Express API
├── librespeed/        # Librespeed speedtest service
├── docker-compose.yml  # Local development setup
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Docker and Docker Compose

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Create environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start development server:
   ```bash
   docker-compose up
   ```

## Features

- Network speed testing using Librespeed
- Speed test history tracking
- Average speed calculations
- User-friendly interface with Alpine.js

## Tech Stack

- Frontend: HTML, CSS, JavaScript, Alpine.js
- Backend: Node.js, Express
- Database: PostgreSQL
- Speed Test: Librespeed
- Deployment: Railway
