import pickle
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import os

BASE = os.path.dirname(__file__)

# ── Load dataset ──────────────────────────────────────────────
# Columns: Message, Label (ham / scam)
df = pd.read_csv(os.path.join(BASE, "sms_data.csv"), encoding="latin-1")

df["Label"]   = df["Label"].map({"ham": 0, "scam": 1})
df["Message"] = df["Message"].astype(str)
df            = df.dropna(subset=["Label"])

X = df["Message"]
y = df["Label"]

# ── TF-IDF vectorizer ─────────────────────────────────────────
vectorizer = TfidfVectorizer()
X_vec      = vectorizer.fit_transform(X)

# ── Train / test split ────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(X_vec, y, test_size=0.2)

# ── Logistic Regression ───────────────────────────────────────
model = LogisticRegression()
model.fit(X_train, y_train)

# ── Evaluate ──────────────────────────────────────────────────
y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred, target_names=["ham", "scam"]))

# ── Save model and vectorizer ─────────────────────────────────
with open(os.path.join(BASE, "model.pkl"), "wb") as f:
    pickle.dump(model, f)

with open(os.path.join(BASE, "vectorizer.pkl"), "wb") as f:
    pickle.dump(vectorizer, f)

print("Saved: ml/model.pkl and ml/vectorizer.pkl")