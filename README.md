# NRBFIT Fitness Studio

NRBFIT is a modern full-stack web application designed for a Nairobi fitness studio. The platform provides an interactive class schedule, coaching roster, membership packages, member authentication with session cookies, class slot reservations, and database-persisted customer enquiries.

---

## Deployment & Hosting

The project is deployed on Namecheap shared hosting running CloudLinux Phusion Passenger (mod_passenger) and connected to a Neon Serverless PostgreSQL database over TLS.

- Production URL: https://nrbfit.cyprian.services
- API Health Check: https://nrbfit.cyprian.services/api/health
- Database Provider: Neon Serverless PostgreSQL

---

## Architecture Overview

```mermaid
graph LR
  Client[Frontend<br/>React 19 + Vite] -->|HTTPS / REST API| Server[Namecheap Backend<br/>Node.js / Express / Passenger]
  Server -->|Pooled SQL over TLS| DB[(Neon Postgres DB<br/>Relational Tables)]
```

---

## How the Web Application Works

1. Single-Entry Server & Hosting Architecture:
   The application is hosted on Namecheap using CloudLinux Phusion Passenger. Passenger boots the Node.js application from app.js based on directives in .htaccess. The Express backend serves both the compiled React 19 single-page application from client/dist and the JSON REST API routes under /api.

2. Frontend Client (React 19 + Tailwind CSS):
   The user interface is built as a pure JavaScript single-page application using React 19, Vite, and Tailwind CSS. The client queries the backend API for classes, coaches, and memberships. If the network or database is temporarily unreachable, the client falls back to bundled studio data so visitors can still browse the schedule and coaches without interruption.

3. Authentication & Secure Sessions:
   Members can sign up or log in through the modal interface. User passwords are encrypted server-side using bcrypt with 12 salt rounds. Upon verification, the server generates a signed JSON Web Token (JWT) and delivers it in an HttpOnly, SameSite=Lax cookie (nrb_session). This cookie authenticates all subsequent booking and profile requests while shielding the token from client-side script access.

4. Class Scheduling & Slot Booking:
   Members can filter classes by workout category (such as Strength, Conditioning, and Pilates) and reserve slots for upcoming sessions. When a member requests a booking, the backend performs transactional checks to confirm:
   - The requested class exists in the database.
   - The user does not already have an active reservation for that class and date.
   - The session has not exceeded its 20-person capacity limit.
   Once validated, the booking is recorded in the bookings table and linked to the user's account.

5. Studio Enquiries:
   Visitors and prospective members can contact the studio through the enquiry form. The submission is validated on the backend and saved directly to the PostgreSQL enquiries table for administrative follow-up.

6. Database Layer:
   Data persistence is handled by Neon Serverless PostgreSQL using normalized relational tables: users, coaches, classes, memberships, bookings, and enquiries. Database migrations are managed via server/scripts/migrate.js to ensure consistent table schemas across environments.

---

## Local Development

Run both the frontend development server and backend API concurrently from the workspace root:

```bash
# 1. Install workspace dependencies
npm install

# 2. Start frontend and backend concurrently
npm run dev
```

- Local Frontend: http://localhost:5173
- Local Backend API: http://localhost:5000/api
- Local Health Check: http://localhost:5000/api/health

---

## Environment Variables

Configure the following variables in .env at the root or within server/.env:

- NODE_ENV: production or development
- PORT: Port or socket path (defaults to 5000 in development, or set by Passenger in production)
- DATABASE_URL: PostgreSQL connection URI (postgresql://user:password@neon-host/neondb?sslmode=require)
- JWT_SECRET: Secure secret string used for signing and verifying session tokens
- CLIENT_URL: Allowed origins for cross-origin requests (e.g. https://nrbfit.cyprian.services)

---

## Key API Endpoints

- GET /api/health — System uptime and status check
- GET /api/classes — List studio classes with optional category filtering
- GET /api/coaches — List coach profiles and specialties
- GET /api/memberships — List membership pricing plans and benefits
- POST /api/auth/signup — Register a new member account
- POST /api/auth/login — Authenticate existing member and issue session cookie
- POST /api/auth/logout — Invalidate member session and clear cookie
- GET /api/auth/me — Retrieve current authenticated member profile
- POST /api/bookings — Reserve a spot in a scheduled class
- GET /api/bookings/my — List the authenticated member's reservations
- POST /api/enquiries — Submit a new studio customer enquiry
