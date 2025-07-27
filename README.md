# NetScope - Location-Based Network Speed Testing Platform

A web-based network speed testing platform designed for mapping ISP performance across specific geographic locations. Currently deployed for beta testing at the Federal University of Technology, Akure (FUTA).

## Project Structure

```
netscope/
├── frontend/           # Vanilla JavaScript frontend with Webpack
│   ├── src/js/         # Core JavaScript modules
│   ├── src/css/        # Styling and UI components
│   └── assets/         # ISP logos and static assets
├── backend/            # Node.js/Express API with PostGIS
│   ├── api/            # API controllers, models, and routes
│   ├── controllers/    # Business logic for speed data and telemetry
│   └── models/         # Database connection and initialization
└── backend/librespeed/ # Librespeed speedtest service
```

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL with PostGIS extension
- Modern web browser with geolocation support

## Environment Setup

### Backend Configuration
```bash
cd backend/api
```

Required environment variables:
```env
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3000
LIBRESPEED_HOST=127.0.0.1
LIBRESPEED_PORT=80
FRONTEND_URL=http://localhost:8080
NODE_ENV=development
```

### Frontend Configuration
```bash
cd frontend
npm install
npm run dev  # Development server
npm run build  # Production build
```

## Beta Deployment (FUTA)

### Supported Locations
- **SEET**: School of Engineering and Engineering Technology
- **SAAT**: School of Agriculture and Agricultural Engineering  
- **SOC**: School of Computing

### Geographic Restrictions
- Telemetry data is only collected within 200 meters of beta locations
- Real-time location validation ensures accurate data attribution
- Privacy-respecting: no data collection outside designated zones

## Key Features

### Core Functionality
- **Real-time Speed Testing**: Download, upload, ping, and jitter measurements
- **Location-Based Data Collection**: PostGIS-powered geographic data storage
- **ISP Performance Mapping**: Average speed calculations by location and provider
- **Privacy Controls**: User consent and location-based data restrictions

### Technical Features
- **PostGIS Integration**: Accurate distance calculations and spatial queries
- **Real-time Location Tracking**: Fresh coordinates for each speed test
- **ISP Detection**: Automatic identification of Nigerian ISPs (MTN, Glo, Airtel, 9mobile)
- **Rate Limiting**: Protection against abuse and excessive usage
- **Responsive Design**: Mobile-first UI with dark theme

## Database Schema

### Core Tables
- `speedtest_records`: Speed test results with PostGIS location data
  - Geographic indexing for efficient spatial queries
  - ISP information and performance metrics
  - Timestamp and user agent tracking

### PostGIS Features
- **Spatial Indexing**: GIST indexes for fast geographic queries
- **Distance Calculations**: 200-meter radius validation
- **Geographic Data Types**: Proper coordinate storage and manipulation

## API Endpoints

### Public Endpoints
- `GET /api/average-speed?latitude={lat}&longitude={lng}` - Get ISP averages for location
- `GET /health` - System health check
- `POST /speedtest/results/telemetry.php` - Speed test data submission

### Proxy Endpoints
- `/speedtest/backend/*` - Librespeed backend proxy for speed testing

## Tech Stack

### Frontend
- **Core**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Build**: Webpack with development and production configurations
- **UI**: Custom components with responsive design
- **Location**: HTML5 Geolocation API with real-time updates

### Backend
- **Runtime**: Node.js with Express framework
- **Database**: PostgreSQL with PostGIS extension
- **Middleware**: CORS, rate limiting, error handling
- **Proxy**: HTTP proxy middleware for Librespeed integration

### Infrastructure
- **Database**: Supabase (PostgreSQL with PostGIS)
- **Deployment**: Railway (backend), static hosting (frontend)
- **Speed Testing**: Librespeed backend service

## Development Workflow

### Local Development
```bash
# Backend
cd backend/api
npm run dev

# Frontend  
cd frontend
npm run dev
```

### Production Deployment
```bash
# Frontend build
cd frontend
npm run build

# Backend deployment
cd backend/api
npm start
```

## Beta Testing Guidelines

### For Testers
1. Visit the application URL
2. Grant location permission when prompted
3. Ensure you're within 200m of a FUTA beta location
4. Run speed tests to contribute to the dataset

### For Developers
- Monitor telemetry data collection in database
- Verify PostGIS location accuracy
- Check ISP detection and classification
- Validate geographic restrictions are working

## Contributing

This project is currently in beta testing phase at FUTA. For issues or contributions, please ensure:
- Location-based features are tested within beta zones
- PostGIS functionality is preserved
- Privacy controls remain intact
- ISP detection accuracy is maintained

## License

[License information to be added]
