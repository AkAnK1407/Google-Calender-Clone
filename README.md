# Google Calendar Clone

Pixel-perfect Google Calendar experience built with React (JavaScript), Tailwind CSS, Node.js/Express, and MongoDB. The project is structured for a full-stack deployment on Vercel (frontend) plus Vercel Serverless / alternative hosting for the backend.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Backend API](#backend-api)
- [State Management](#state-management)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Deployment Guide](#deployment-guide)
- [Future Enhancements](#future-enhancements)

## Features
- Authentic Google Calendar-inspired UI with Google Sans type, Material colors, and subtle depth.
- Month, week, and day views with animated transitions and draggable event cards.
- Event creation modal supporting reminders, attendees, recurrence patterns, and color coding.
- Real-time conflict detection powered by the backend.
- Calendar sidebar with mini-month picker, calendar visibility toggles, and search (debounced).
- Zustand-powered optimistic updates for a responsive UX, paired with toast notifications.
- Double-click anywhere in a view to open a pre-filled event modal that respects the clicked day/time slot, or drag-and-drop events across days and times.
- Demo data (calendars + recurring events) is auto-seeded for the `demo-user` so the interface loads with realistic content immediately.

> **Note**: This repository reflects ongoing work. Certain advanced behaviours (mobile optimisations, full recurrence editing UI, production deployment automation) are in progress.

## Tech Stack
- **Frontend**: Create React App (JavaScript), Tailwind CSS, Framer Motion, react-beautiful-dnd, date-fns, Zustand, react-hot-toast, Headless UI.
- **Backend**: Node.js, Express 5, MongoDB (Mongoose), express-validator, express-rate-limit, Helmet, CORS, bcryptjs, jsonwebtoken, rrule.
- **Tooling**: ESLint (CRA defaults), Nodemon for backend dev, npm scripts.

## Project Structure
```
/workspace
??? README.md
??? google-calendar-clone/      # React frontend
?   ??? src/
?   ?   ??? components/
?   ?   ?   ??? Calendar/...
?   ?   ??? store/
?   ?   ??? services/
?   ?   ??? utils/
?   ??? tailwind.config.js
??? server/                     # Express backend
    ??? src/
    ?   ??? controllers/
    ?   ??? middleware/
    ?   ??? models/
    ?   ??? routes/
    ?   ??? utils/
    ??? .env.example
```

## Local Development

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB instance (local or Atlas)

### Frontend
```bash
cd google-calendar-clone
npm install
npm start
```

The app runs at `http://localhost:3000`. Update `REACT_APP_API_BASE_URL` in a `.env` file to point to your backend (default fallback is `http://localhost:5000/api`).

### Backend
```bash
cd server
npm install
cp .env.example .env              # Update values accordingly
npm run dev
```

The API listens on `http://localhost:5000`. Ensure MongoDB credentials are configured in `.env`. The first call to `/api/calendars?userId=demo-user` seeds sample calendars and recurring events for a fast visual check.

## Environment Variables

### Frontend (`google-calendar-clone/.env`)
```
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_DEFAULT_USER_ID=demo-user
```

### Backend (`server/.env`)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=<mongo-connection-string>
CLIENT_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
MONGO_MAX_POOL_SIZE=10
JWT_SECRET=<random-string>
```

## Demo Data

- The backend automatically seeds demo calendars and events the first time `/api/calendars?userId=demo-user` is called.
- Seeded calendars mirror Google defaults (`My Calendar`, `Team Sync`, `Reminders`) with distinct colors and visibility flags.
- Sample events showcase daily, weekly, bi-weekly, and all-day recurrence rules so the UI renders realistic schedules immediately.
- Seeding is idempotent: if documents already exist for the user, no additional records are created. Delete the `calendars` or `events` collections to regenerate.

## Backend API

| Method | Endpoint              | Description |
|--------|-----------------------|-------------|
| GET    | `/api/events`         | Fetch events with optional `start`, `end`, `calendarIds`, `search`, `includeRecurring` filters. |
| POST   | `/api/events`         | Create a new event with validation and conflict detection. |
| PUT    | `/api/events/:id`     | Update event details (time, recurrence, attendees, etc.). |
| DELETE | `/api/events/:id`     | Remove an event (confirms primary instances). |
| POST   | `/api/events/conflicts` | Inspect potential time conflicts before committing changes. |
| GET    | `/api/calendars`      | List calendars for a user (supports visibility filters). |
| POST   | `/api/calendars`      | Create a calendar (enforces unique names per user). |
| PUT    | `/api/calendars/:id`  | Update calendar metadata (color, primary flag, visibility). |
| DELETE | `/api/calendars/:id`  | Delete non-primary calendars. |

All event endpoints require `userId` association (authentication scaffolding planned).

## State Management
- The frontend leverages a centralized Zustand store (`src/store/calendarStore.js`).
- Events are normalised into Date objects on load for consistent rendering.
- Optimistic updates mirror backend mutations, with rollback handled by toasts and re-fetch.
- Debounced search calls ensure network efficiency when filtering events.

## Business Logic & Edge Cases
- Recurring events are expanded on the server (via `rrule`) so month/week/day queries return concrete instances for drag-and-drop and rendering.
- Conflict detection evaluates both persisted events and expanded recurrences while excluding the record being edited.
- Backend validators enforce ISO date inputs, per-user calendar ownership, and guard against invalid recurrence payloads.
- Event updates merge payloads with existing documents to preserve untouched properties (attendees, reminders, metadata).

## UI Interactions & Animations
- Framer Motion animates view switches with a subtle horizontal slide to mimic Google Calendar's visual rhythm.
- `react-beautiful-dnd` enables drag-and-drop of timed and all-day events in every view; drop targets snap to the correct day/time bucket.
- Double-click any day cell or time slot to open the event modal pre-filled with that context, mirroring Google's quick-create behaviour.
- Toasts, hover shadows, and focus states match Google's design language while remaining fully keyboard accessible.

## Keyboard Shortcuts
- `C` - open the create event modal
- `T` - jump to today
- `M` / `W` / `D` - switch to Month, Week, or Day view
- `ArrowLeft` / `ArrowRight` - navigate backward / forward based on the active view

## Deployment Guide

1. **Frontend (Vercel)**
   - Connect the repository and select `google-calendar-clone` as the root.
   - Build command: `npm run build`; Output directory: `build`.
   - Configure environment variables (`REACT_APP_API_BASE_URL`, `REACT_APP_DEFAULT_USER_ID`).

2. **Backend (Vercel Serverless or alternative)**
   - Adapt Express routes into Vercel serverless handlers or deploy to a service like Railway / Render.
   - Ensure CORS is configured with the deployed frontend domain.
   - Set environment variables (`MONGODB_URI`, `CLIENT_ORIGIN`, `JWT_SECRET`, rate limit values).

3. **Database (MongoDB Atlas)**
   - Create a cluster and allow IP access.
   - Store the connection URI in both local and production environment configs.

4. **Observability & Hardening**
   - Configure logging (morgan combined in production, structured logs for serverless).
   - Monitor rate limits and CPU usage; adjust TTL indexes for recurring expansions as data grows.

## Future Enhancements
- Mobile-first responsive layouts with gesture support.
- Advanced recurrence editor (weekly rules, weekday toggles, exceptions). 
- Offline caching plus optimistic syncing for network resilience.
- Rich attendee management (status, invitation emails) and notification channels.
- Snapshot testing and Cypress end-to-end flows.
- One-click deploy scripts for automated environment provisioning.

---

> Contributions, bug reports, and feature requests are welcome. Open an issue describing the enhancement or attach reproduction steps for bugs.