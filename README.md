# ⚽ GoalZone — Football Field Booking System

A full-stack, LAN-ready web application for booking football fields.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  CLIENT LAYER (Browser)                  │
│  HTML + CSS + Vanilla JS  —  SPA, no page reloads       │
│  Fetches data via REST API calls to the Flask server     │
└───────────────────────────┬─────────────────────────────┘
                            │  HTTP (port 5000)
                            │  LAN: http://SERVER_IP:5000
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 SERVER LAYER (Flask / Python)            │
│  Routes:  /api/fields  /api/bookings  /api/admin/…      │
│  Auth:    Session cookies (secure, HTTP-only)            │
│  CORS:    Enabled for same-LAN origins                   │
└───────────────────────────┬─────────────────────────────┘
                            │  SQLite3 (file-based)
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  DATA LAYER (SQLite DB)                  │
│  Tables: users, admins, fields, bookings, payments,      │
│          reviews                                         │
│  Location: instance/football.db                          │
└─────────────────────────────────────────────────────────┘
```

### LAN Multi-User Access
- Server binds to `0.0.0.0:5000` (all interfaces)
- Clients on the same Wi-Fi open `http://<SERVER_LAN_IP>:5000`
- Flask session cookies include the server's IP so all devices share auth state independently

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install flask flask-cors

# 2. Start the server
python app.py

# 3. Open browser
#    Local:   http://127.0.0.1:5000
#    Network: http://<YOUR_LAN_IP>:5000
```

Or use the guided starter:
```bash
python start.py
```

---

## 🔑 Default Credentials

| Role  | Username/Email     | Password  |
|-------|--------------------|-----------|
| Admin | admin              | admin123  |
| User  | ahmed@email.com    | pass123   |
| User  | sara@email.com     | pass123   |

---

## 📋 Features

| Feature                    | Implemented |
|----------------------------|:-----------:|
| User Registration & Login  | ✅ |
| View Available Fields      | ✅ |
| Book Fields (date & time)  | ✅ |
| Double-Booking Prevention  | ✅ |
| Payment Management         | ✅ |
| Admin Dashboard            | ✅ |
| Booking History            | ✅ |
| Field Reviews & Ratings    | ✅ |
| Search & Filter            | ✅ |
| Responsive Modern UI       | ✅ |
| AI Field Recommendation    | ✅ |
| Booking Notifications      | ✅ |
| Real-time Availability     | ✅ |

---

## 🗄️ Database Tables

- **users** — registered players
- **admins** — system administrators
- **fields** — football pitches with pricing & amenities
- **bookings** — reservations with time slots (UNIQUE constraint prevents double-booking)
- **payments** — payment records linked 1:1 to bookings
- **reviews** — star ratings + comments (one per user per field)

---

## 🔒 Security

- Passwords hashed with SHA-256 + salt
- Server-side session management (Flask sessions)
- Admin and user routes protected by decorators
- Foreign key constraints enforced (SQLite PRAGMA)
- UNIQUE DB constraint as second line of defence against double-booking

---

## 📡 API Endpoints

| Method | Endpoint                     | Description             |
|--------|------------------------------|-------------------------|
| POST   | /api/register                | Register new user       |
| POST   | /api/login                   | User login              |
| POST   | /api/admin/login             | Admin login             |
| POST   | /api/logout                  | Logout                  |
| GET    | /api/fields                  | List fields (+ filters) |
| GET    | /api/fields/:id              | Field detail + reviews  |
| GET    | /api/fields/:id/availability | Booked slots for date   |
| POST   | /api/bookings                | Create booking          |
| GET    | /api/bookings                | User's booking history  |
| PUT    | /api/bookings/:id/cancel     | Cancel booking          |
| PUT    | /api/payments/:id/pay        | Mark payment paid       |
| POST   | /api/reviews                 | Submit review           |
| GET    | /api/recommend               | AI recommendations      |
| GET    | /api/admin/stats             | Dashboard stats         |
| POST   | /api/admin/fields            | Add field               |
| PUT    | /api/admin/fields/:id        | Update field            |
| DELETE | /api/admin/fields/:id        | Deactivate field        |
| GET    | /api/admin/users             | List all users          |
