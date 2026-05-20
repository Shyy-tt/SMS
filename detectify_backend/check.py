import sqlite3
import os

# I-check kung naa sa tamang directory
DB_PATH = "detectify.db"

print("=" * 50)
print("DATABASE CHECKER")
print("=" * 50)

# 1. I-check kung naa ang file
if os.path.exists(DB_PATH):
    print(f"✅ Database file found: {DB_PATH}")
    print(f"📏 File size: {os.path.getsize(DB_PATH)} bytes")
else:
    print(f"❌ Database file NOT found at {DB_PATH}")
    print(f"📁 Current directory: {os.getcwd()}")
    exit()

# 2. I-connect sa database
try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    print("✅ Successfully connected to database")
except Exception as e:
    print(f"❌ Cannot connect: {e}")
    exit()

# 3. I-check ang mga tables
print("\n📋 TABLES:")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

if tables:
    for table in tables:
        print(f"   - {table[0]}")
else:
    print("   No tables found!")

# 4. I-check ang USERS
print("\n👤 USERS:")
cursor.execute("SELECT COUNT(*) FROM users")
count = cursor.fetchone()[0]
print(f"   Total users: {count}")

if count > 0:
    cursor.execute("SELECT full_name, email, created_at FROM users")
    for row in cursor.fetchall():
        print(f"   → {row[0]} ({row[1]}) - Created: {row[2]}")

# 5. I-check ang MESSAGES
print("\n📨 MESSAGES:")
cursor.execute("SELECT COUNT(*) FROM messages")
count = cursor.fetchone()[0]
print(f"   Total messages: {count}")

if count > 0:
    cursor.execute("SELECT sender, type, confidence, body, received_at FROM messages ORDER BY received_at DESC LIMIT 5")
    for row in cursor.fetchall():
        print(f"   → From: {row[0]}")
        print(f"     Type: {row[1]}")
        print(f"     Confidence: {row[2] * 100:.1f}%")
        print(f"     Body: {row[3][:50]}...")
        print(f"     When: {row[4]}")
        print(f"     ---")

# 6. I-check ang BLOCKED
print("\n🚫 BLOCKED NUMBERS:")
cursor.execute("SELECT COUNT(*) FROM blocked")
count = cursor.fetchone()[0]
print(f"   Total blocked: {count}")

if count > 0:
    cursor.execute("SELECT sender, reason FROM blocked")
    for row in cursor.fetchall():
        print(f"   → {row[0]} - {row[1]}")

conn.close()
print("\n✅ Database check complete!")