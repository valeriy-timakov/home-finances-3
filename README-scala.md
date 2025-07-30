# Home Accounting - Scala Edition

A modern home accounting application built with Scala, featuring:

## Architecture

- **Backend**: Akka HTTP server with RESTful API
- **Frontend**: ScalaJS with ScalaJS-React for reactive UI components
- **Build Tool**: SBT with multi-module project structure

## Modules

### Backend (`scala-backend`)
- Akka HTTP for REST API
- Akka Streams for reactive data processing
- Spray JSON for JSON serialization
- Logback for logging

### Frontend (`scala-frontend`)
- ScalaJS for client-side Scala compilation
- ScalaJS-React for React component integration
- Modern responsive UI with CSS3

## Getting Started

### Prerequisites
- Java 11 or higher
- SBT 1.9.6 or higher

### Running the Application

1. **Compile both modules:**
   ```bash
   sbt compile
   ```

2. **Run the backend server:**
   ```bash
   sbt "backend/run"
   ```
   The server will start on `http://localhost:8080`

3. **Compile the frontend (in another terminal):**
   ```bash
   sbt "frontend/fastOptJS"
   ```

4. **For development with auto-recompilation:**
   ```bash
   sbt "~frontend/fastOptJS"
   ```

### API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/hello` - Simple greeting endpoint
- `GET /` - Serves the main application page

### Development

The frontend JavaScript files are automatically served by the backend server from the `/static` path. The development workflow is:

1. Start the backend server
2. Run frontend compilation in watch mode
3. Open `http://localhost:8080` in your browser
4. Make changes to Scala files and they will be automatically recompiled

### Project Structure

```
├── build.sbt                 # Root SBT build configuration
├── project/
│   ├── build.properties      # SBT version
│   └── plugins.sbt          # SBT plugins
├── scala-backend/           # Backend module
│   └── src/main/
│       ├── scala/           # Backend Scala sources
│       └── resources/       # Static resources (HTML, etc.)
└── scala-frontend/          # Frontend module
    └── src/main/
        └── scala/           # Frontend Scala sources
```

## Features

- ✅ Type-safe full-stack development
- ✅ Reactive UI components
- ✅ Modern responsive design
- ✅ Hot reload development workflow
- ✅ RESTful API architecture
- ✅ Comprehensive logging
