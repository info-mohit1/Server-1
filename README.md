# StudyNook Server

Node.js + Express API server for the StudyNook Library Study Room Booking platform.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Start production server
npm start
```

## Environment Variables

Create a `.env` file in the root with:

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
CLERK_SECRET_KEY=sk_test_your_key_here
CLIENT_URL=http://localhost:3000
PORT=5000
```

## API Endpoints

### Rooms
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/rooms` | Public | Get all rooms (search/filter) |
| GET | `/api/rooms/latest` | Public | Get latest 6 rooms |
| GET | `/api/rooms/:id` | Public | Get single room |
| POST | `/api/rooms` | Private | Create room |
| PUT | `/api/rooms/:id` | Owner | Update room |
| DELETE | `/api/rooms/:id` | Owner | Delete room |
| GET | `/api/rooms/user/my-listings` | Private | Get owner's rooms |

### Bookings
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/bookings` | Private | Create booking |
| GET | `/api/bookings/my-bookings` | Private | Get user's bookings |
| PATCH | `/api/bookings/:id/cancel` | Private | Cancel booking |

## Tech Stack

- **Express.js** — HTTP server and routing
- **PostgreSQL + pg** — Database with raw SQL queries
- **@clerk/backend** — JWT token verification
- **cors** — Cross-origin resource sharing
- **dotenv** — Environment variable management
