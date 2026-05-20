import pickle
import os

_model      = None
_vectorizer = None

def _load():
    global _model, _vectorizer
    if _model is None:
        base = os.path.dirname(__file__)
        model_path = os.path.join(base, "model.pkl")
        vec_path = os.path.join(base, "vectorizer.pkl")
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}. Run train.py first!")
        if not os.path.exists(vec_path):
            raise FileNotFoundError(f"Vectorizer file not found at {vec_path}. Run train.py first!")
            
        with open(model_path, "rb") as f:
            _model = pickle.load(f)
        with open(vec_path, "rb") as f:
            _vectorizer = pickle.load(f)
    return _model, _vectorizer

def predict(text: str) -> dict:
    try:
        model, vectorizer = _load()
        text_vec   = vectorizer.transform([text])
        label      = model.predict(text_vec)[0]
        proba      = model.predict_proba(text_vec)[0]
        confidence = round(float(proba[1]), 4)
        msg_type   = "scam" if label == 1 else "ham"
        tags       = _get_tags(text) if label == 1 else []
        return {"type": msg_type, "confidence": confidence, "tags": tags}
    except Exception as e:
        # Fallback safe prediction
        return {"type": "ham", "confidence": 0.0, "tags": [], "error": str(e)}

_TAG_RULES = {
    "phishing":           ["verify", "click", "link", "login", "confirm", "account", "update"],
    "bank-impersonation": ["bdo", "bpi", "metrobank", "landbank", "unionbank", "rcbc", "security bank"],
    "gcash-scam":         ["gcash", "g-cash", "maya", "paymaya", "coins.ph"],
    "lottery-scam":       ["won", "winner", "claim", "prize", "raffle", "congratulations", "lucky"],
    "loan-scam":          ["loan", "lend", "borrow", "collateral", "apply now", "no collateral", "easy money"],
    "advance-fee":        ["processing fee", "send load", "payment first", "send money", "deposit"],
    "gambling-scam":      ["casino", "bet", "jackpot", "sabong", "new player", "bagong site"],
    "fake-delivery":      ["delivery", "parcel", "courier", "shipping", "j&t", "lbc", "2go"],
    "job-scam":           ["work from home", "earn money", "data entry", "part time", "online job"],
}

def _get_tags(text: str) -> list:
    t = text.lower()
    return [tag for tag, kws in _TAG_RULES.items() if any(kw in t for kw in kws)]