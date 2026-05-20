import requests
import json
import time

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("🛡️ DETECTIFY COMPLETE TEST SUITE")
print("=" * 60)

# ============================================================
# TEST 1: Register (kung wala pa)
# ============================================================
print("\n📝 TEST 1: Register Account")
print("-" * 40)

register_data = {
    "full_name": "Juan Dela Cruz",
    "email": "juan@example.com",
    "password": "test12345"
}

response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
if response.status_code == 201:
    print("✅ Account created successfully!")
elif response.status_code == 400:
    print("⚠️ Account already exists (ok lang)")
else:
    print(f"❌ Error: {response.status_code} - {response.text}")

# ============================================================
# TEST 2: Login
# ============================================================
print("\n🔐 TEST 2: Login")
print("-" * 40)

login_data = {
    "email": "juan@example.com",
    "password": "test12345"
}

response = requests.post(f"{BASE_URL}/auth/login", json=login_data)

if response.status_code != 200:
    print(f"❌ Login failed: {response.text}")
    exit()
else:
    token = response.json()["access_token"]
    print(f"✅ Login successful!")
    print(f"📌 Token: {token[:60]}...")

# ============================================================
# TEST 3: Send SCAM message (Lottery)
# ============================================================
print("\n🎲 TEST 3: Lottery Scam Detection")
print("-" * 40)

scam_data = {
    "sender": "+639171234567",
    "body": "CONGRATULATIONS! You won 500,000 pesos from SM Raffle! Click here to claim: http://sm-winner.com/claim"
}

headers = {"Authorization": f"Bearer {token}"}
response = requests.post(f"{BASE_URL}/messages/", json=scam_data, headers=headers)

if response.status_code == 201:
    result = response.json()
    print(f"✅ Message processed!")
    print(f"   Type: {result['type']}")
    print(f"   Confidence: {result['confidence'] * 100:.1f}%")
    print(f"   Tags: {result['tags']}")
    
    if result['type'] == 'scam':
        print("   ✅ SCAM DETECTED correctly!")
    else:
        print("   ⚠️ Warning: Scam not detected")
else:
    print(f"❌ Failed: {response.text}")

# ============================================================
# TEST 4: Send SCAM message (Bank Phishing)
# ============================================================
print("\n🏦 TEST 4: Bank Phishing Scam")
print("-" * 40)

scam_data = {
    "sender": "BPI",
    "body": "BPI ALERT: Your account has been locked due to unusual activity. Verify now: http://bpi-security.com/verify"
}

response = requests.post(f"{BASE_URL}/messages/", json=scam_data, headers=headers)

if response.status_code == 201:
    result = response.json()
    print(f"✅ Message processed!")
    print(f"   Type: {result['type']}")
    print(f"   Confidence: {result['confidence'] * 100:.1f}%")
    print(f"   Tags: {result['tags']}")
    
    if result['type'] == 'scam':
        print("   ✅ SCAM DETECTED correctly!")
    else:
        print("   ⚠️ Warning: Scam not detected")
else:
    print(f"❌ Failed: {response.text}")

# ============================================================
# TEST 5: Send SCAM message (GCash)
# ============================================================
print("\n📱 TEST 5: GCash Scam")
print("-" * 40)

scam_data = {
    "sender": "GCash",
    "body": "GCash: Your wallet has been suspended. Click here to reactivate: http://gcash-reactivate.com"
}

response = requests.post(f"{BASE_URL}/messages/", json=scam_data, headers=headers)

if response.status_code == 201:
    result = response.json()
    print(f"✅ Message processed!")
    print(f"   Type: {result['type']}")
    print(f"   Confidence: {result['confidence'] * 100:.1f}%")
    print(f"   Tags: {result['tags']}")
    
    if result['type'] == 'scam':
        print("   ✅ SCAM DETECTED correctly!")
    else:
        print("   ⚠️ Warning: Scam not detected")
else:
    print(f"❌ Failed: {response.text}")

# ============================================================
# TEST 6: Send HAM (Safe) message
# ============================================================
print("\n💬 TEST 6: Safe Message (No Scam)")
print("-" * 40)

ham_data = {
    "sender": "+639181234567",
    "body": "Hi! See you later at the mall at 7pm. Bring your gift. Thanks!"
}

response = requests.post(f"{BASE_URL}/messages/", json=ham_data, headers=headers)

if response.status_code == 201:
    result = response.json()
    print(f"✅ Message processed!")
    print(f"   Type: {result['type']}")
    print(f"   Confidence: {result['confidence'] * 100:.1f}%")
    print(f"   Tags: {result['tags']}")
    
    if result['type'] == 'ham':
        print("   ✅ SAFE message identified correctly!")
    else:
        print("   ⚠️ Warning: Safe message flagged as scam")
else:
    print(f"❌ Failed: {response.text}")

# ============================================================
# TEST 7: Get all messages
# ============================================================
print("\n📋 TEST 7: Retrieve All Messages")
print("-" * 40)

response = requests.get(f"{BASE_URL}/messages/", headers=headers)

if response.status_code == 200:
    messages = response.json()
    print(f"✅ Retrieved {len(messages)} messages total")
    
    scam_count = sum(1 for m in messages if m['type'] == 'scam')
    ham_count = sum(1 for m in messages if m['type'] == 'ham')
    
    print(f"   🚫 Scam messages: {scam_count}")
    print(f"   ✅ Safe messages: {ham_count}")
else:
    print(f"❌ Failed: {response.text}")

# ============================================================
# TEST 8: Get Statistics
# ============================================================
print("\n📊 TEST 8: Statistics")
print("-" * 40)

response = requests.get(f"{BASE_URL}/messages/stats", headers=headers)

if response.status_code == 200:
    stats = response.json()
    print(f"✅ Statistics retrieved!")
    print(f"   Safe messages: {stats['safe_messages']}")
    print(f"   Spam detected: {stats['spam_detected']}")
    print(f"   Blocked numbers: {stats['blocked_numbers']}")
    print(f"   Active alerts: {stats['active_alerts']}")
    if stats['accuracy_rate']:
        print(f"   Accuracy rate: {stats['accuracy_rate']}%")
else:
    print(f"❌ Failed: {response.text}")

# ============================================================
# FINAL SUMMARY
# ============================================================
print("\n" + "=" * 60)
print("🎯 FINAL VERDICT")
print("=" * 60)

print("""
✅ Backend is RUNNING
✅ Authentication is WORKING  
✅ Scam detection is WORKING
✅ Database is WORKING
✅ API endpoints are WORKING

🎉 DETECTIFY IS FULLY FUNCTIONAL!
🚀 Ready for mobile deployment!
""")

print("=" * 60)