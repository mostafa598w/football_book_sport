#!/usr/bin/env python3
"""
Quick-start helper for GoalZone Football Booking System
Run this file instead of app.py for guided setup.
"""
import subprocess, sys, os

def install():
    print("📦 Installing dependencies...")
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt', '-q'])
    print("✅ Dependencies installed.\n")

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    try:
        import flask
        import flask_cors
    except ImportError:
        install()

    print("""
╔══════════════════════════════════════════════════════════════╗
║        ⚽  GOALZONE — Football Field Booking System  ⚽       ║
╠══════════════════════════════════════════════════════════════╣
║  Starting server...                                          ║
║  Open your browser to the URL shown below.                   ║
║  Other devices on your Wi-Fi can use the Network URL.        ║
╚══════════════════════════════════════════════════════════════╝
""")
    os.execv(sys.executable, [sys.executable, 'app.py'])

if __name__ == '__main__':
    main()
