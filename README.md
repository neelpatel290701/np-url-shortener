# Scalable URL Shortener Service

A high-performance, lightweight URL shortener built with Node.js, Express, MongoDB, and Redis. Designed for scalability and speed.

## 🚀 Architecture Overview

The system is designed to handle high read traffic (redirects) with low latency using a **Isolating read/write paths** approach.

```mermaid
graph TD
    User([User])
    LB[Load Balancer]
    API[Node.js API Instances]
    Redis[(Redis Cache)]
    Mongo[(MongoDB Primary)]

    User -->|HTTP Requests| LB
    LB -->|Round Robin| API
    
    subgraph "Write Path (Shorten)"
    API -->|1. Generate ID| API
    API -->|2. Check Collision| Mongo
    API -->|3. Save Mapping| Mongo
    end

    subgraph "Read Path (Redirect)"
    API -->|1. Check Cache| Redis
    Redis -- Miss -->|2. Query DB| Mongo
    Mongo -->|3. Return Data| API
    API -->|4. Populate Cache| Redis
    end
```

### Components

1.  **Node.js API (Stateless)**: The core service runs on Express.js. It is stateless, meaning you can spin up multiple instances behind a load balancer to handle increased traffic effortlessly.
2.  **Redis (Caching Layer)**: Acts as a high-speed buffer for redirects.
    -   **Cache-Aside Pattern**: When a short URL is requested, the system first checks Redis. If found, it redirects immediately (O(1) time). If not, it fetches from DB and caches it for subsequent requests.
    -   **TTL**: Keys expire after 24 hours to keep memory usage efficient for active links.
3.  **MongoDB (Persistence Layer)**: Stores the permanent mapping of `shortCode` to `longUrl` and usage statistics.
    -   **Schema**: Optimized with indices on `shortCode` for fast lookups.
4.  **NanoID**: Uses `nanoid` (with custom alphabet) to generate cryptographically secure, URL-friendly random IDs (e.g., `abc123`).

## 🛠 Tech Stack

-   **Runtime**: Node.js v16+ (Native ES Modules)
-   **Framework**: Express.js
-   **Database**: MongoDB (Mongoose)
-   **Cache**: Redis
-   **Containerization**: Docker & Docker Compose
-   **Testing**: Jest & Supertest

## 📦 Installation & Setup

### Prerequisites
-   Docker and Docker Compose installed.
-   Node.js (optional, for local dev without Docker).

### Quick Start (Recommended)
Spin up the entire stack with one command:

```bash
# 1. Clone the repository
git clone <repo-url>
cd url-shortener

# 2. Start services (Mongo, Redis)
docker-compose up -d

# 3. Install dependencies and start server
npm install
npm start
```

The server will start on `http://localhost:5001`.

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27018/urlshortener
REDIS_URL=redis://localhost:6380
```
*(Note: Default docker-compose maps Mongo to 27018 and Redis to 6380 to avoid conflicts)*

## 📡 API Documentation

### 1. Shorten URL
Values `longUrl` and returns a shortened version.

-   **Endpoint**: `POST /api/shorten`
-   **Body**:
    ```json
    {
      "longUrl": "https://www.google.com/search?q=nodejs"
    }
    ```
-   **Response**:
    ```json
    {
      "shortCode": "Ab3dE",
      "shortUrl": "http://localhost:5001/Ab3dE",
      "originalUrl": "https://www.google.com/search?q=nodejs"
    }
    ```

### 2. Redirect
Redirects the user to the original URL.

-   **Endpoint**: `GET /:code`
-   **Behavior**: 
    -   302 Redirect to original URL.
    -   404 if code not found.

### 3. Get Stats
Retrieve click counts and metadata.

-   **Endpoint**: `GET /api/info/:code`
-   **Response**:
    ```json
    {
      "_id": "65cd...",
      "shortCode": "Ab3dE",
      "longUrl": "https://...",
      "clicks": 42,
      "createdAt": "2024-02-14T10:00:00.000Z"
    }
    ```

## 🧪 Testing

Run integration tests using Jest:

```bash
npm test
```
*Ensure Docker containers are running before testing.*

## 📈 Scalability Considerations

-   **Horizontal Scaling**: Add more Node.js instances.
-   **Database Sharding**: MongoDB can be sharded based on `shortCode` hash for massive scale.
-   **Redis Cluster**: Use Redis Cluster for distributed caching if memory limit is reached.
