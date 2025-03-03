# AEROPATH

## 📌 Overview

The AeroPathis a backend API that calculates the shortest flight route between two airports, considering a maximum of four flight legs and using real-world geographical distances. The project is built with Node.js, Express, and TypeScript, leveraging OpenFlights data as the source for airport and route details.

Additionally, it supports an optional ground hop feature, allowing travelers to change airports within 100 km during layovers. The API is designed for scalability, modularity, and efficient shortest path calculations.

## 🚀 Features

- Shortest Flight Route Calculation with a maximum of four legs
- Dijkstra's Algorithm for optimal path selection
- Haversine Formula for accurate distance calculation
- Support for Ground Hops, allowing airport changes within 100 km
- Efficient Graph-Based Search for route computation
- Redis Caching for Optimized Performance
- API Error Handling and Validation
- Docker Support for easy deployment
- Jest-Based Unit Tests

## 📂 Project Structure

```
src/
├── api/
│   ├── controllers/
│   │   └── routeController.ts
│   ├── middlewares/
│   │   ├── errorHandler.ts
│   │   └── requestTracker.ts
├── config/
│   ├── config.ts
│   ├── dependencyContainer.ts
│   ├── environment.ts
│   └── RouteConfig.ts
├── data/
│   ├── airports.dat
│   ├── routes.dat
│   └── index.ts
├── domain/
│   ├── errors/
│   │   ├── BaseError.ts
│   │   ├── DistanceErrors.ts
│   │   └── RouteErrors.ts
│   ├── interfaces/
│   │   ├── IAirport.ts
│   │   ├── IRoute.ts
│   │   ├── repositories/
│   │   │   ├── IAirportRepository.ts
│   │   │   └── IRouteRepository.ts
│   │   └── services/
│   │       ├── IDistanceService.ts
│   │       ├── ILoggerService.ts
│   │       ├── IRouteCache.ts
│   │       └── IRouteService.ts
│   └── models/
│       ├── Airport.ts
│       ├── Connection.ts
│       └── Route.ts
├── infrastructure/
│   └── repositories/
│       └── airportRepository.ts
├── services/
│   ├── distanceService.ts
│   ├── graphService.ts
│   ├── healthService.ts
│   ├── loggerService.ts
│   └── routeService.ts
├── types/
│   └── RequestContext.ts
├── utils/
│   └── PriorityQueue.ts
├── app.ts
└── index.ts
```

## ⚙️ Installation & Setup

### Prerequisites

- Docker and Docker Compose

1. Clone the repository and navigate to the project directory

```sh
git clone <repository-url>
cd aeropath
```

2. Start the application

```sh
docker-compose up -d
```

3. Verify the installation

```sh
curl http://localhost:3000/health
```

### Managing the Application

Stop the application:

```sh
docker-compose down
```

View logs:

```sh
docker-compose logs -f service
```

Rebuild and restart:

```sh
docker-compose up -d --build
```

Run tests:

```sh
docker-compose up test
```

## 🛠 API Endpoints

### Find Shortest Flight Route

**Endpoint:** `GET /routes/:from/:to`

**Example:** `GET /routes/JFK/LAX`

**Response:**

```json
{
  "source": "JFK",
  "destination": "LAX",
  "distance": 3200,
  "hops": ["JFK", "ORD", "LAX"]
}
```

### Find Route with Ground Hops

**Endpoint:** `GET /routes/:from/:to?with-ground-hops=true`

**Example:** `GET /routes/JFK/LAX?with-ground-hops=true`

**Response:**

```json
{
  "source": "JFK",
  "destination": "LAX",
  "distance": 3250,
  "hops": ["JFK", "EWR", "ORD", "LAX"]
}
```

### Health Check

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "UP",
  "redis": "UP",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Error Handling

- 400 Bad Request for invalid airport codes
- 404 Not Found if no route is available
- 500 Internal Server Error for unexpected failures

## 🤔 Why These Choices?

### Dijkstra's Algorithm Over BFS

Dijkstra's Algorithm is used instead of BFS because it finds the shortest weighted path efficiently. BFS is best for unweighted graphs, but flights have distances, making Dijkstra the optimal choice.

### Haversine Formula for Distance Calculation

The Haversine formula is used to compute accurate great-circle distances between airport locations. This ensures correctness in selecting the shortest possible route.

### Graph-Based Data Structure for Route Computation

Airports and routes are stored as a graph, allowing efficient traversal. This reduces lookup time compared to a flat data structure.

### Ground Hop Logic

Ground hops are optional and activated via `with-ground-hops=true`. The system prevents consecutive ground hops to maintain flight-based integrity.

### Redis for Route Caching

Without caching, every API call recomputes the shortest route, impacting performance. Redis stores computed routes temporarily, reducing redundant calculations and improving response time for frequently requested routes.

## 🛠 Built With

- Node.js 18+
- TypeScript
- Express.js
- Jest for Testing
- Redis for Caching
- Docker for Deployment
