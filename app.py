"""
Football Field Booking System - Main Application
=================================================
Flask backend server with SQLite database.
Supports LAN access via http://SERVER_IP:5000

Architecture:
  Client (Browser) ──HTTP──► Flask Server (Port 5000) ──► SQLite DB
  Multiple devices on same Wi-Fi can access via server's LAN IP.
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
try:
    from flask_cors import CORS
except ImportError:
    CORS = lambda app, **kw: None
import sqlite3
import hashlib
import os
import json
from datetime import datetime, date, timedelta
from functools import wraps
import secrets
import socket

# ── App Setup ──────────────────────────────────────────────────────────────────
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))  # Env var on Render
CORS(app, supports_credentials=True)            # Allow cross-origin for LAN clients

# On Render free tier, use /tmp (ephemeral). For persistent storage upgrade to paid plan.
if os.environ.get('RENDER'):
    DB_PATH = '/tmp/football.db'
else:
    DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'football.db')

# ── No-Cache Headers — أي تغيير في DB يظهر فوراً ─────────────────────────────
@app.after_request
def add_no_cache(response):
    """منع الـ browser من cache الـ API responses عشان التغييرات تظهر فوراً."""
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# ── Database Helpers ───────────────────────────────────────────────────────────
def get_db():
    """Return a database connection with row_factory for dict-like rows."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")    # Enforce FK constraints
    return conn

def query(sql, params=(), one=False, commit=False):
    """Execute SQL and optionally return rows or commit."""
    conn = get_db()
    try:
        cur = conn.execute(sql, params)
        if commit:
            conn.commit()
            return cur.lastrowid
        rows = cur.fetchone() if one else cur.fetchall()
        return [dict(r) for r in rows] if not one else (dict(rows) if rows else None)
    finally:
        conn.close()

def hash_password(pw):
    """SHA-256 password hash with salt prefix."""
    salt = "fb_salt_2025_"
    return hashlib.sha256((salt + pw).encode()).hexdigest()

# ── Auth Decorators ────────────────────────────────────────────────────────────
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('is_admin'):
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated

# ── Database Initialisation ────────────────────────────────────────────────────
def init_db():
    """Create all tables and seed sample data if DB is empty."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db()
    c = conn.cursor()

    # ── Users ──────────────────────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            email       TEXT    UNIQUE NOT NULL,
            password    TEXT    NOT NULL,
            phone       TEXT,
            created_at  TEXT    DEFAULT (datetime('now'))
        )
    """)

    # ── Admins ─────────────────────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            username    TEXT    UNIQUE NOT NULL,
            password    TEXT    NOT NULL,
            created_at  TEXT    DEFAULT (datetime('now'))
        )
    """)

    # ── Football Fields ────────────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS fields (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            name         TEXT    NOT NULL,
            location     TEXT    NOT NULL,
            description  TEXT,
            price_per_hour REAL  NOT NULL,
            capacity     INTEGER DEFAULT 22,
            surface      TEXT    DEFAULT 'Natural Grass',
            amenities    TEXT,           -- JSON array of strings
            image_url    TEXT,
            is_active    INTEGER DEFAULT 1,
            created_at   TEXT    DEFAULT (datetime('now'))
        )
    """)

    # ── Bookings ───────────────────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id      INTEGER NOT NULL REFERENCES users(id),
            field_id     INTEGER NOT NULL REFERENCES fields(id),
            booking_date TEXT    NOT NULL,
            start_time   TEXT    NOT NULL,
            end_time     TEXT    NOT NULL,
            duration_hrs REAL    NOT NULL,
            total_price  REAL    NOT NULL,
            status       TEXT    DEFAULT 'confirmed',   -- confirmed|cancelled|completed
            notes        TEXT,
            created_at   TEXT    DEFAULT (datetime('now')),
            UNIQUE (field_id, booking_date, start_time)  -- Prevent double-booking
        )
    """)

    # ── Payments ───────────────────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id     INTEGER UNIQUE NOT NULL REFERENCES bookings(id),
            amount         REAL    NOT NULL,
            method         TEXT    DEFAULT 'cash',      -- cash|card|online
            status         TEXT    DEFAULT 'pending',   -- pending|paid|refunded
            transaction_id TEXT,
            paid_at        TEXT,
            created_at     TEXT    DEFAULT (datetime('now'))
        )
    """)

    # ── Reviews ────────────────────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL REFERENCES users(id),
            field_id   INTEGER NOT NULL REFERENCES fields(id),
            rating     INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
            comment    TEXT,
            created_at TEXT    DEFAULT (datetime('now')),
            UNIQUE (user_id, field_id)     -- One review per user per field
        )
    """)

    conn.commit()

    # ── Seed data only if tables are empty ─────────────────────────────────────
    if not c.execute("SELECT 1 FROM admins LIMIT 1").fetchone():
        # Default admin: admin / admin123
        c.execute("INSERT INTO admins (username, password) VALUES (?, ?)",
                  ('admin', hash_password('admin123')))

    if not c.execute("SELECT 1 FROM users LIMIT 1").fetchone():
        sample_users = [
            ('Ahmed Hassan',   'ahmed@email.com',  hash_password('pass123'), '0501234567'),
            ('Sara Mohamed',   'sara@email.com',   hash_password('pass123'), '0507654321'),
            ('Omar Khalil',    'omar@email.com',   hash_password('pass123'), '0509876543'),
        ]
        c.executemany("INSERT INTO users (name, email, password, phone) VALUES (?,?,?,?)", sample_users)

    if not c.execute("SELECT 1 FROM fields LIMIT 1").fetchone():
        fields = [
            ('Al-Ahly Arena',      'Nasr City, Cairo',         'Premium 11-a-side with floodlights and VIP lounge.',
             300, 22, 'Natural Grass',   '["Floodlights","Changing Rooms","Parking","Café","First Aid"]',
             'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800'),
            ('Zamalek Sports Hub', 'Zamalek, Cairo',            'Indoor 5-a-side turf ideal for quick games.',
             180, 10, 'Artificial Turf', '["Indoor","Air Conditioning","Showers","Equipment Rental"]',
             'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'),
            ('Cairo Stadium Pro',  'Heliopolis, Cairo',         'Full-size pitch used by local leagues.',
             400, 22, 'Hybrid Grass',   '["Floodlights","Scoreboard","Seating","Parking","Security"]',
             'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800'),
            ('Giza Green Park',    'Dokki, Giza',               'Budget-friendly outdoor pitch with great views.',
             120, 14, 'Natural Grass',  '["Parking","Basic Changing Room"]',
             'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800'),
            ('New Cairo Elite',    'New Cairo',                 'State-of-the-art facility with smart booking.',
             500, 22, 'Artificial Turf','["Floodlights","Smart Lockers","Restaurant","VIP Suite","Parking"]',
             'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800'),
            ('Maadi Sports Club',  'Maadi, Cairo',              'Family-friendly venue with kids area.',
             200, 14, 'Natural Grass',  '["Floodlights","Kids Area","Café","Changing Rooms"]',
             'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800'),
        ]
        c.executemany(
            "INSERT INTO fields (name, location, description, price_per_hour, capacity, surface, amenities, image_url) "
            "VALUES (?,?,?,?,?,?,?,?)", fields)

    if not c.execute("SELECT 1 FROM bookings LIMIT 1").fetchone():
        today = date.today().isoformat()
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        bookings = [
            (1, 1, today,     '10:00', '12:00', 2, 600,  'confirmed'),
            (2, 2, today,     '14:00', '15:00', 1, 180,  'confirmed'),
            (3, 3, tomorrow,  '18:00', '20:00', 2, 800,  'confirmed'),
            (1, 4, tomorrow,  '09:00', '10:00', 1, 120,  'confirmed'),
        ]
        c.executemany(
            "INSERT OR IGNORE INTO bookings (user_id, field_id, booking_date, start_time, end_time, duration_hrs, total_price, status) "
            "VALUES (?,?,?,?,?,?,?,?)", bookings)
        # Seed payments for the bookings
        c.executemany(
            "INSERT OR IGNORE INTO payments (booking_id, amount, method, status) VALUES (?,?,?,?)",
            [(1, 600, 'cash', 'paid'), (2, 180, 'card', 'paid'),
             (3, 800, 'online', 'pending'), (4, 120, 'cash', 'pending')])

    if not c.execute("SELECT 1 FROM reviews LIMIT 1").fetchone():
        reviews = [
            (1, 1, 5, 'Excellent facility! Loved the floodlights.'),
            (2, 1, 4, 'Great pitch, a bit pricey but worth it.'),
            (3, 2, 5, 'Best indoor turf in Cairo!'),
            (1, 3, 4, 'Professional setup, ideal for league games.'),
            (2, 4, 3, 'Basic but clean. Good for casual games.'),
        ]
        c.executemany(
            "INSERT OR IGNORE INTO reviews (user_id, field_id, rating, comment) VALUES (?,?,?,?)", reviews)

    conn.commit()
    conn.close()
    print("✅ Database initialised successfully.")

# ══════════════════════════════════════════════════════════════════════════════
# AUTH ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/register', methods=['POST'])
def register():
    d = request.json
    if not all([d.get('name'), d.get('email'), d.get('password')]):
        return jsonify({'error': 'Name, email and password are required'}), 400
    if query("SELECT id FROM users WHERE email=?", (d['email'],), one=True):
        return jsonify({'error': 'Email already registered'}), 409
    uid = query(
        "INSERT INTO users (name, email, password, phone) VALUES (?,?,?,?)",
        (d['name'], d['email'], hash_password(d['password']), d.get('phone', '')),
        commit=True)
    session['user_id'] = uid
    session['user_name'] = d['name']
    session['is_admin'] = False
    return jsonify({'message': 'Registered successfully', 'user_id': uid, 'name': d['name']})

@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    user = query("SELECT * FROM users WHERE email=? AND password=?",
                 (d['email'], hash_password(d['password'])), one=True)
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    session['user_id'] = user['id']
    session['user_name'] = user['name']
    session['is_admin'] = False
    return jsonify({'message': 'Login successful', 'user': {'id': user['id'], 'name': user['name'], 'email': user['email']}})

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    d = request.json
    admin = query("SELECT * FROM admins WHERE username=? AND password=?",
                  (d['username'], hash_password(d['password'])), one=True)
    if not admin:
        return jsonify({'error': 'Invalid admin credentials'}), 401
    session['user_id'] = admin['id']
    session['user_name'] = admin['username']
    session['is_admin'] = True
    return jsonify({'message': 'Admin login successful', 'username': admin['username']})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'})

@app.route('/api/me')
def me():
    if 'user_id' not in session:
        return jsonify({'authenticated': False})
    return jsonify({'authenticated': True, 'user_id': session['user_id'],
                    'name': session['user_name'], 'is_admin': session.get('is_admin', False)})

# ══════════════════════════════════════════════════════════════════════════════
# FIELDS ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/fields')
def get_fields():
    """Return all active fields with avg rating; supports search & price filter."""
    location = request.args.get('location', '')
    min_price = request.args.get('min_price', 0, type=float)
    max_price = request.args.get('max_price', 99999, type=float)
    surface   = request.args.get('surface', '')

    sql = """
        SELECT f.*,
               ROUND(AVG(r.rating), 1) AS avg_rating,
               COUNT(r.id)             AS review_count
        FROM fields f
        LEFT JOIN reviews r ON r.field_id = f.id
        WHERE f.is_active = 1
          AND f.price_per_hour BETWEEN ? AND ?
    """
    params = [min_price, max_price]
    if location:
        sql += " AND LOWER(f.location) LIKE ?"
        params.append(f'%{location.lower()}%')
    if surface:
        sql += " AND f.surface = ?"
        params.append(surface)
    sql += " GROUP BY f.id ORDER BY avg_rating DESC"

    fields = query(sql, params)
    for f in fields:
        try: f['amenities'] = json.loads(f['amenities'] or '[]')
        except: f['amenities'] = []
    return jsonify(fields)

@app.route('/api/fields/<int:fid>')
def get_field(fid):
    field = query("""
        SELECT f.*,
               ROUND(AVG(r.rating),1) AS avg_rating,
               COUNT(r.id)            AS review_count
        FROM fields f
        LEFT JOIN reviews r ON r.field_id = f.id
        WHERE f.id = ?
        GROUP BY f.id
    """, (fid,), one=True)
    if not field:
        return jsonify({'error': 'Field not found'}), 404
    try: field['amenities'] = json.loads(field['amenities'] or '[]')
    except: field['amenities'] = []
    # Attach reviews
    field['reviews'] = query("""
        SELECT r.*, u.name AS user_name
        FROM reviews r JOIN users u ON u.id = r.user_id
        WHERE r.field_id = ? ORDER BY r.created_at DESC
    """, (fid,))
    return jsonify(field)

@app.route('/api/fields/<int:fid>/availability')
def field_availability(fid):
    """Return booked slots for a given date so the UI can grey them out."""
    date_str = request.args.get('date', date.today().isoformat())
    booked = query("""
        SELECT start_time, end_time FROM bookings
        WHERE field_id=? AND booking_date=? AND status != 'cancelled'
    """, (fid, date_str))
    return jsonify(booked)

# ══════════════════════════════════════════════════════════════════════════════
# BOOKING ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/bookings', methods=['POST'])
@login_required
def create_booking():
    d = request.json
    required = ['field_id', 'booking_date', 'start_time', 'end_time']
    if not all(d.get(k) for k in required):
        return jsonify({'error': 'Missing required fields'}), 400

    # Conflict check ── the UNIQUE constraint also catches this at DB level
    conflict = query("""
        SELECT id FROM bookings
        WHERE field_id=? AND booking_date=? AND status != 'cancelled'
          AND NOT (end_time <= ? OR start_time >= ?)
    """, (d['field_id'], d['booking_date'], d['start_time'], d['end_time']), one=True)
    if conflict:
        return jsonify({'error': 'This slot is already booked. Please choose another time.'}), 409

    field = query("SELECT price_per_hour FROM fields WHERE id=?", (d['field_id'],), one=True)
    if not field:
        return jsonify({'error': 'Field not found'}), 404

    # Calculate duration and price
    fmt = '%H:%M'
    start = datetime.strptime(d['start_time'], fmt)
    end   = datetime.strptime(d['end_time'],   fmt)
    if end <= start:
        return jsonify({'error': 'End time must be after start time'}), 400
    duration = (end - start).seconds / 3600
    total    = round(duration * field['price_per_hour'], 2)

    bid = query("""
        INSERT INTO bookings (user_id, field_id, booking_date, start_time, end_time,
                              duration_hrs, total_price, status, notes)
        VALUES (?,?,?,?,?,?,?,'confirmed',?)
    """, (session['user_id'], d['field_id'], d['booking_date'],
          d['start_time'], d['end_time'], duration, total, d.get('notes', '')),
         commit=True)

    # Auto-create a pending payment record
    query("INSERT INTO payments (booking_id, amount, method) VALUES (?,?,?)",
          (bid, total, d.get('payment_method', 'cash')), commit=True)

    return jsonify({'message': 'Booking confirmed!', 'booking_id': bid, 'total_price': total}), 201

@app.route('/api/bookings')
@login_required
def get_bookings():
    """Return bookings for the logged-in user (or all bookings for admin)."""
    if session.get('is_admin'):
        rows = query("""
            SELECT b.*, u.name AS user_name, f.name AS field_name,
                   p.status AS payment_status, p.method AS payment_method
            FROM bookings b
            JOIN users u ON u.id = b.user_id
            JOIN fields f ON f.id = b.field_id
            LEFT JOIN payments p ON p.booking_id = b.id
            ORDER BY b.created_at DESC
        """)
    else:
        rows = query("""
            SELECT b.*, f.name AS field_name, f.location AS field_location,
                   p.status AS payment_status, p.method AS payment_method
            FROM bookings b
            JOIN fields f ON f.id = b.field_id
            LEFT JOIN payments p ON p.booking_id = b.id
            WHERE b.user_id = ?
            ORDER BY b.booking_date DESC, b.start_time DESC
        """, (session['user_id'],))
    return jsonify(rows)

@app.route('/api/bookings/<int:bid>/cancel', methods=['PUT'])
@login_required
def cancel_booking(bid):
    booking = query("SELECT * FROM bookings WHERE id=?", (bid,), one=True)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    if not session.get('is_admin') and booking['user_id'] != session['user_id']:
        return jsonify({'error': 'Unauthorised'}), 403
    query("UPDATE bookings SET status='cancelled' WHERE id=?", (bid,), commit=True)
    query("UPDATE payments SET status='refunded' WHERE booking_id=?", (bid,), commit=True)
    return jsonify({'message': 'Booking cancelled and payment refunded.'})

# ══════════════════════════════════════════════════════════════════════════════
# PAYMENT ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/payments/<int:bid>/pay', methods=['PUT'])
@login_required
def mark_paid(bid):
    d = request.json or {}
    txn = f"TXN-{secrets.token_hex(6).upper()}"
    query("""
        UPDATE payments
        SET status='paid', method=?, transaction_id=?, paid_at=datetime('now')
        WHERE booking_id=?
    """, (d.get('method', 'cash'), txn, bid), commit=True)
    return jsonify({'message': 'Payment recorded', 'transaction_id': txn})

# ══════════════════════════════════════════════════════════════════════════════
# REVIEWS ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/reviews', methods=['POST'])
@login_required
def add_review():
    d = request.json
    if not all([d.get('field_id'), d.get('rating')]):
        return jsonify({'error': 'field_id and rating required'}), 400
    if not (1 <= int(d['rating']) <= 5):
        return jsonify({'error': 'Rating must be 1-5'}), 400
    try:
        query("INSERT OR REPLACE INTO reviews (user_id, field_id, rating, comment) VALUES (?,?,?,?)",
              (session['user_id'], d['field_id'], d['rating'], d.get('comment', '')), commit=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    return jsonify({'message': 'Review submitted!'})

# ══════════════════════════════════════════════════════════════════════════════
# ADMIN ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/admin/stats')
@admin_required
def admin_stats():
    stats = {
        'total_users':    query("SELECT COUNT(*) AS c FROM users",    one=True)['c'],
        'total_fields':   query("SELECT COUNT(*) AS c FROM fields",   one=True)['c'],
        'total_bookings': query("SELECT COUNT(*) AS c FROM bookings", one=True)['c'],
        'total_revenue':  query("SELECT COALESCE(SUM(amount),0) AS c FROM payments WHERE status='paid'", one=True)['c'],
        'today_bookings': query("SELECT COUNT(*) AS c FROM bookings WHERE booking_date=date('now')", one=True)['c'],
        'pending_payments': query("SELECT COUNT(*) AS c FROM payments WHERE status='pending'", one=True)['c'],
    }
    # Revenue by field
    stats['revenue_by_field'] = query("""
        SELECT f.name, COALESCE(SUM(p.amount),0) AS revenue
        FROM fields f
        LEFT JOIN bookings b ON b.field_id = f.id
        LEFT JOIN payments p ON p.booking_id = b.id AND p.status='paid'
        GROUP BY f.id ORDER BY revenue DESC
    """)
    # Recent 5 bookings
    stats['recent_bookings'] = query("""
        SELECT b.id, u.name AS user, f.name AS field, b.booking_date,
               b.start_time, b.end_time, b.total_price, b.status
        FROM bookings b JOIN users u ON u.id=b.user_id JOIN fields f ON f.id=b.field_id
        ORDER BY b.created_at DESC LIMIT 5
    """)
    return jsonify(stats)

@app.route('/api/admin/fields', methods=['POST'])
@admin_required
def add_field():
    d = request.json
    required = ['name', 'location', 'price_per_hour']
    if not all(d.get(k) for k in required):
        return jsonify({'error': 'name, location and price_per_hour required'}), 400
    fid = query("""
        INSERT INTO fields (name, location, description, price_per_hour, capacity, surface, amenities, image_url)
        VALUES (?,?,?,?,?,?,?,?)
    """, (d['name'], d['location'], d.get('description',''), d['price_per_hour'],
          d.get('capacity', 22), d.get('surface','Natural Grass'),
          json.dumps(d.get('amenities',[])), d.get('image_url','')), commit=True)
    return jsonify({'message': 'Field added', 'id': fid}), 201

@app.route('/api/admin/fields/<int:fid>', methods=['PUT', 'DELETE'])
@admin_required
def manage_field(fid):
    if request.method == 'DELETE':
        # حذف نهائي — بيمسح البيانات المرتبطة الأول ثم الملعب
        query("DELETE FROM reviews  WHERE field_id=?", (fid,), commit=True)
        query("DELETE FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE field_id=?)", (fid,), commit=True)
        query("DELETE FROM bookings WHERE field_id=?", (fid,), commit=True)
        query("DELETE FROM fields   WHERE id=?",       (fid,), commit=True)
        return jsonify({'message': 'Field deleted permanently'})
    d = request.json
    query("""
        UPDATE fields SET name=?, location=?, description=?, price_per_hour=?,
               capacity=?, surface=?, amenities=?, image_url=?
        WHERE id=?
    """, (d['name'], d['location'], d.get('description',''), d['price_per_hour'],
          d.get('capacity',22), d.get('surface','Natural Grass'),
          json.dumps(d.get('amenities',[])), d.get('image_url',''), fid), commit=True)
    return jsonify({'message': 'Field updated'})

@app.route('/api/admin/users')
@admin_required
def admin_users():
    users = query("""
        SELECT u.*, COUNT(b.id) AS booking_count
        FROM users u
        LEFT JOIN bookings b ON b.user_id = u.id
        GROUP BY u.id ORDER BY u.created_at DESC
    """)
    return jsonify(users)

# ══════════════════════════════════════════════════════════════════════════════
# AI RECOMMENDATION (Bonus)
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/recommend')
def recommend():
    """
    Simple rule-based AI recommendation:
    Score = (avg_rating * 20) - (booking_frequency * 5) + (price_score)
    Returns top 3 fields for a given date and budget.
    """
    target_date = request.args.get('date', date.today().isoformat())
    budget      = request.args.get('budget', 9999, type=float)

    fields = query("""
        SELECT f.*,
               ROUND(AVG(r.rating),1) AS avg_rating,
               COUNT(DISTINCT b.id)   AS bookings_today
        FROM fields f
        LEFT JOIN reviews  r ON r.field_id = f.id
        LEFT JOIN bookings b ON b.field_id = f.id AND b.booking_date=? AND b.status!='cancelled'
        WHERE f.is_active=1 AND f.price_per_hour <= ?
        GROUP BY f.id
    """, (target_date, budget))

    for f in fields:
        rating   = f['avg_rating'] or 3
        busy     = f['bookings_today'] or 0
        price_s  = max(0, 10 - f['price_per_hour'] / 50)  # cheaper = higher score
        f['score'] = round(rating * 20 - busy * 5 + price_s, 2)
        try: f['amenities'] = json.loads(f['amenities'] or '[]')
        except: f['amenities'] = []

    top3 = sorted(fields, key=lambda x: x['score'], reverse=True)[:3]
    return jsonify(top3)


# ══════════════════════════════════════════════════════════════════════════════
# DATABASE VIEWER ROUTES (Admin only)
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/db/tables')
@admin_required
def db_tables():
    conn = get_db()
    tables = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).fetchall()
    result = []
    for t in tables:
        name  = t['name']
        count = conn.execute(f"SELECT COUNT(*) AS c FROM {name}").fetchone()['c']
        cols  = conn.execute(f"PRAGMA table_info({name})").fetchall()
        result.append({
            'name': name, 'rows': count,
            'columns': [{'name': c['name'], 'type': c['type'], 'pk': c['pk'], 'notnull': c['notnull']} for c in cols]
        })
    conn.close()
    return jsonify(result)

@app.route('/api/db/table/<string:table_name>')
@admin_required
def db_table_data(table_name):
    allowed = {'users','admins','fields','bookings','payments','reviews'}
    if table_name not in allowed:
        return jsonify({'error': 'Table not allowed'}), 403
    page   = request.args.get('page', 1, type=int)
    limit  = 20
    offset = (page - 1) * limit
    rows   = query(f"SELECT * FROM {table_name} LIMIT ? OFFSET ?", (limit, offset))
    total  = query(f"SELECT COUNT(*) AS c FROM {table_name}", one=True)['c']
    for r in rows:
        if 'password' in r:
            r['password'] = '••••••••'
    return jsonify({'rows': rows, 'total': total, 'page': page,
                    'pages': (total + limit - 1) // limit})

@app.route('/api/db/schema')
@admin_required
def db_schema():
    conn = get_db()
    rows = conn.execute(
        "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).fetchall()
    conn.close()
    return jsonify([{'name': r['name'], 'sql': r['sql']} for r in rows if r['sql']])

@app.route('/api/fields/<int:fid>/slots')
def field_slots(fid):
    """All hourly slots for a date with booked status and AM/PM labels."""
    date_str = request.args.get('date', date.today().isoformat())
    booked = query("""
        SELECT start_time, end_time FROM bookings
        WHERE field_id=? AND booking_date=? AND status != 'cancelled'
    """, (fid, date_str))

    def fmt_ampm(h):
        if h == 0:  return "12:00 AM"
        if h == 12: return "12:00 PM"
        if h < 12:  return f"{h}:00 AM"
        return f"{h-12}:00 PM"

    slots = []
    for hour in range(6, 24):
        start_24 = f"{hour:02d}:00"
        end_24   = f"{hour+1:02d}:00" if hour < 23 else "23:59"
        is_booked = any(
            not (end_24 <= b['start_time'] or start_24 >= b['end_time'])
            for b in booked
        )
        slots.append({
            'start_24': start_24, 'end_24': end_24,
            'start_ampm': fmt_ampm(hour),
            'end_ampm':   fmt_ampm(hour + 1) if hour < 23 else "11:59 PM",
            'is_booked': is_booked,
        })
    return jsonify(slots)


# ══════════════════════════════════════════════════════════════════════════════
# LIVE CRUD — أي تغيير في DB Browser يظهر فوراً
# ══════════════════════════════════════════════════════════════════════════════

# ── Users ──────────────────────────────────────────────────────────────────────
@app.route('/api/users/<int:uid>', methods=['GET','PUT','DELETE'])
@admin_required
def manage_user(uid):
    if request.method == 'GET':
        user = query("SELECT id,name,email,phone,created_at FROM users WHERE id=?", (uid,), one=True)
        if not user: return jsonify({'error':'User not found'}), 404
        return jsonify(user)

    if request.method == 'PUT':
        d = request.json
        query("""UPDATE users SET name=?, email=?, phone=? WHERE id=?""",
              (d.get('name'), d.get('email'), d.get('phone',''), uid), commit=True)
        return jsonify({'message': 'User updated'})

    if request.method == 'DELETE':
        query("DELETE FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE user_id=?)", (uid,), commit=True)
        query("DELETE FROM bookings WHERE user_id=?", (uid,), commit=True)
        query("DELETE FROM reviews  WHERE user_id=?", (uid,), commit=True)
        query("DELETE FROM users    WHERE id=?",      (uid,), commit=True)
        return jsonify({'message': 'User deleted permanently'})

# ── Bookings ───────────────────────────────────────────────────────────────────
@app.route('/api/bookings/<int:bid>', methods=['GET','PUT','DELETE'])
@admin_required
def manage_booking(bid):
    if request.method == 'GET':
        b = query("""
            SELECT b.*, u.name AS user_name, f.name AS field_name,
                   p.status AS payment_status, p.method AS payment_method, p.amount
            FROM bookings b
            JOIN users u ON u.id=b.user_id
            JOIN fields f ON f.id=b.field_id
            LEFT JOIN payments p ON p.booking_id=b.id
            WHERE b.id=?""", (bid,), one=True)
        if not b: return jsonify({'error':'Booking not found'}), 404
        return jsonify(b)

    if request.method == 'PUT':
        d = request.json
        query("""UPDATE bookings SET status=?, booking_date=?, start_time=?, end_time=?, notes=?
                 WHERE id=?""",
              (d.get('status','confirmed'), d.get('booking_date'), d.get('start_time'),
               d.get('end_time'), d.get('notes',''), bid), commit=True)
        return jsonify({'message': 'Booking updated'})

    if request.method == 'DELETE':
        query("DELETE FROM payments WHERE booking_id=?", (bid,), commit=True)
        query("DELETE FROM bookings WHERE id=?",         (bid,), commit=True)
        return jsonify({'message': 'Booking deleted permanently'})

# ── Payments ───────────────────────────────────────────────────────────────────
@app.route('/api/payments/all')
@admin_required
def get_all_payments():
    """جيب كل الـ payments live من قاعدة البيانات."""
    payments = query("""
        SELECT p.*, b.booking_date, b.total_price AS booking_price,
               u.name AS user_name, f.name AS field_name
        FROM payments p
        JOIN bookings b ON b.id=p.booking_id
        JOIN users u ON u.id=b.user_id
        JOIN fields f ON f.id=b.field_id
        ORDER BY p.created_at DESC
    """)
    return jsonify(payments)

@app.route('/api/payments/<int:pid>', methods=['PUT','DELETE'])
@admin_required
def manage_payment(pid):
    if request.method == 'PUT':
        d = request.json
        query("UPDATE payments SET status=?, method=? WHERE id=?",
              (d.get('status','pending'), d.get('method','cash'), pid), commit=True)
        return jsonify({'message': 'Payment updated'})

    if request.method == 'DELETE':
        query("DELETE FROM payments WHERE id=?", (pid,), commit=True)
        return jsonify({'message': 'Payment deleted'})

# ── Reviews ────────────────────────────────────────────────────────────────────
@app.route('/api/reviews/all')
@admin_required
def get_all_reviews():
    """جيب كل الـ reviews live."""
    reviews = query("""
        SELECT r.*, u.name AS user_name, f.name AS field_name
        FROM reviews r
        JOIN users u ON u.id=r.user_id
        JOIN fields f ON f.id=r.field_id
        ORDER BY r.created_at DESC
    """)
    return jsonify(reviews)

@app.route('/api/reviews/<int:rid>', methods=['DELETE'])
@admin_required
def delete_review(rid):
    query("DELETE FROM reviews WHERE id=?", (rid,), commit=True)
    return jsonify({'message': 'Review deleted'})

# ── Live Stats — بتتحسب من الـ DB في real-time ────────────────────────────────
@app.route('/api/live/stats')
def live_stats():
    """Real-time stats من الـ DB — بتتغير فوراً مع أي تعديل."""
    stats = {
        'fields':   query("SELECT COUNT(*) AS c FROM fields WHERE is_active=1", one=True)['c'],
        'users':    query("SELECT COUNT(*) AS c FROM users", one=True)['c'],
        'bookings': query("SELECT COUNT(*) AS c FROM bookings WHERE status='confirmed'", one=True)['c'],
        'avg_rating': query("SELECT ROUND(AVG(rating),1) AS c FROM reviews", one=True)['c'] or 0,
    }
    return jsonify(stats)

# Initialize DB at module load time — runs under both flask dev server and gunicorn
init_db()

# ══════════════════════════════════════════════════════════════════════════════
# SERVE SPA
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/')
@app.route('/<path:path>')
def index(path=''):
    return render_template('index.html')

# ══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

def get_local_ip():
    """Detect LAN IP for display on startup."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return '127.0.0.1'

if __name__ == '__main__':
    init_db()
    lan_ip = get_local_ip()
    print(f"""
╔══════════════════════════════════════════════════════════╗
║         ⚽  FOOTBALL FIELD BOOKING SYSTEM  ⚽            ║
╠══════════════════════════════════════════════════════════╣
║  Local:   http://127.0.0.1:5000                         ║
║  Network: http://{lan_ip}:5000{'':>{20-len(lan_ip)}}║
║                                                          ║
║  Admin:   username=admin  password=admin123              ║
║  Users:   ahmed@email.com / pass123                      ║
╚══════════════════════════════════════════════════════════╝
    """)
    # host='0.0.0.0' makes the server reachable on LAN
    port = int(os.environ.get('PORT', 5000))
    debug = not os.environ.get('RENDER')   # disable debug on production
    app.run(host='0.0.0.0', port=port, debug=debug)
