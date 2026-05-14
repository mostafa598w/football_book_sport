-- ═══════════════════════════════════════════════════════════════════════════
-- GOALZONE — Football Field Booking System
-- SQL Schema (SQLite compatible)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ERD DESCRIPTION ─────────────────────────────────────────────────────────
--
--  ┌─────────────┐       ┌──────────────────┐       ┌──────────────────┐
--  │   USERS     │──1:N──│    BOOKINGS      │──N:1──│  FOOTBALL_FIELDS │
--  ├─────────────┤       ├──────────────────┤       ├──────────────────┤
--  │ id (PK)     │       │ id (PK)          │       │ id (PK)          │
--  │ name        │       │ user_id (FK)     │       │ name             │
--  │ email       │       │ field_id (FK)    │       │ location         │
--  │ password    │       │ booking_date     │       │ description      │
--  │ phone       │       │ start_time       │       │ price_per_hour   │
--  │ created_at  │       │ end_time         │       │ capacity         │
--  └─────────────┘       │ duration_hrs     │       │ surface          │
--         │              │ total_price      │       │ amenities        │
--         │1             │ status           │       │ image_url        │
--         │              │ notes            │       │ is_active        │
--         │              │ created_at       │       │ created_at       │
--         │N             └──────────────────┘       └──────────────────┘
--  ┌─────────────┐              │1                         │1
--  │   REVIEWS   │              │                          │N
--  ├─────────────┤              │1                   ┌─────┴──────┐
--  │ id (PK)     │       ┌──────┴───────┐            │  REVIEWS   │
--  │ user_id(FK) │       │   PAYMENTS   │            └────────────┘
--  │ field_id(FK)│       ├─────────────-┤
--  │ rating      │       │ id (PK)      │
--  │ comment     │       │ booking_id(FK│
--  │ created_at  │       │ amount       │
--  └─────────────┘       │ method       │
--                         │ status       │
--  ┌─────────────┐        │ transaction_id│
--  │   ADMINS    │        │ paid_at      │
--  ├─────────────┤        │ created_at   │
--  │ id (PK)     │        └──────────────┘
--  │ username    │
--  │ password    │
--  │ created_at  │
--  └─────────────┘
--
-- RELATIONSHIPS:
--   Users     1──N  Bookings      (one user → many bookings)
--   Fields    1──N  Bookings      (one field → many bookings)
--   Bookings  1──1  Payments      (each booking → one payment)
--   Users     N──N  Fields        (via Reviews; one user reviews a field once)
--   UNIQUE (field_id, booking_date, start_time) prevents double-booking
-- ────────────────────────────────────────────────────────────────────────────

PRAGMA foreign_keys = ON;

-- ── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    UNIQUE NOT NULL,
    password    TEXT    NOT NULL,            -- SHA-256 hashed
    phone       TEXT,
    created_at  TEXT    DEFAULT (datetime('now'))
);

-- ── ADMINS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    UNIQUE NOT NULL,
    password    TEXT    NOT NULL,            -- SHA-256 hashed
    created_at  TEXT    DEFAULT (datetime('now'))
);

-- ── FOOTBALL FIELDS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fields (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT    NOT NULL,
    location       TEXT    NOT NULL,
    description    TEXT,
    price_per_hour REAL    NOT NULL CHECK(price_per_hour > 0),
    capacity       INTEGER DEFAULT 22 CHECK(capacity > 0),
    surface        TEXT    DEFAULT 'Natural Grass',  -- Natural Grass | Artificial Turf | Hybrid
    amenities      TEXT,                             -- JSON: ["Floodlights","Parking",…]
    image_url      TEXT,
    is_active      INTEGER DEFAULT 1,
    created_at     TEXT    DEFAULT (datetime('now'))
);

-- ── BOOKINGS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    field_id     INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    booking_date TEXT    NOT NULL,                      -- ISO date: 2025-06-01
    start_time   TEXT    NOT NULL,                      -- HH:MM
    end_time     TEXT    NOT NULL,                      -- HH:MM
    duration_hrs REAL    NOT NULL CHECK(duration_hrs > 0),
    total_price  REAL    NOT NULL CHECK(total_price >= 0),
    status       TEXT    DEFAULT 'confirmed'             -- confirmed|cancelled|completed
                         CHECK(status IN ('confirmed','cancelled','completed')),
    notes        TEXT,
    created_at   TEXT    DEFAULT (datetime('now')),
    UNIQUE (field_id, booking_date, start_time)         -- ← PREVENTS DOUBLE BOOKING
);

-- ── PAYMENTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id     INTEGER UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount         REAL    NOT NULL CHECK(amount >= 0),
    method         TEXT    DEFAULT 'cash'               -- cash|card|online
                           CHECK(method IN ('cash','card','online')),
    status         TEXT    DEFAULT 'pending'             -- pending|paid|refunded
                           CHECK(status IN ('pending','paid','refunded')),
    transaction_id TEXT,
    paid_at        TEXT,
    created_at     TEXT    DEFAULT (datetime('now'))
);

-- ── REVIEWS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    field_id   INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    rating     INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TEXT    DEFAULT (datetime('now')),
    UNIQUE (user_id, field_id)                          -- One review per user per field
);

-- ── INDEXES for performance ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_field_date ON bookings(field_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user       ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_field       ON reviews(field_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking    ON payments(booking_id);

-- ── SAMPLE DATA ───────────────────────────────────────────────────────────────
-- Default admin (password: admin123)
INSERT OR IGNORE INTO admins (username, password)
VALUES ('admin', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8');

-- Sample users (password: pass123 for all)
INSERT OR IGNORE INTO users (name, email, password, phone) VALUES
    ('Ahmed Hassan',  'ahmed@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '0501234567'),
    ('Sara Mohamed',  'sara@email.com',  'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '0507654321'),
    ('Omar Khalil',   'omar@email.com',  'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '0509876543');

-- Sample fields
INSERT OR IGNORE INTO fields (name, location, description, price_per_hour, capacity, surface, amenities, image_url) VALUES
    ('Al-Ahly Arena',      'Nasr City, Cairo',    'Premium 11-a-side with floodlights.', 300, 22, 'Natural Grass',
     '["Floodlights","Changing Rooms","Parking","Café","First Aid"]',
     'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800'),
    ('Zamalek Sports Hub', 'Zamalek, Cairo',       'Indoor 5-a-side turf.',              180, 10, 'Artificial Turf',
     '["Indoor","Air Conditioning","Showers","Equipment Rental"]',
     'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'),
    ('Cairo Stadium Pro',  'Heliopolis, Cairo',    'Full-size pitch for local leagues.', 400, 22, 'Hybrid Grass',
     '["Floodlights","Scoreboard","Seating","Parking","Security"]',
     'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800');
