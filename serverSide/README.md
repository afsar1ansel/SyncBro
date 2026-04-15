# Node.js Server Template

A clean, structured, and production-ready Node.js backend template using Express.js and ES Modules.

## Getting Started

### Prerequisites
- Node.js (v14+)
- npm

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables:
   - Create a `.env` file (one has been provided as a sample).
   - Configure your `PORT` and other secrets.

### Scripts
- `npm start`: Runs the server using standard `node`.
- `npm run dev`: Runs the server with `nodemon` for auto-reloading during development.
- `npm test`: Placeholder for running tests.

## Project Structure
```text
src/
├── config/       # Configuration (centralized environment variables)
├── controllers/  # Request handlers (business logic)
├── middlewares/  # Custom Express middlewares
├── models/       # Database models/schemas
├── routes/       # API route definitions
├── utils/        # Utility/Helper functions
├── app.js        # Express application setup
└── index.js      # Server entry point
```

## Features
- **ES Modules**: Modern JavaScript syntax.
- **Error Handling**: Global error and 404 middleware.
- **Environment Management**: Centralized configuration using `dotenv`.
- **Security**: Basic CORS setup.
- **Logging**: Morgan for HTTP request logging.

## API Endpoints
- **GET** `/api/health`: Health check endpoint.
