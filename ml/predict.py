import json
import pickle
import sys
from pathlib import Path

import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "network_frequency",
    "failed_connections",
    "suspicious_requests",
    "dns_requests",
    "unique_destinations",
    "periodic_connections",
    "upload_bytes",
    "download_bytes",
]

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "isolation_forest.pkl"
METADATA_PATH = BASE_DIR / "models" / "isolation_forest_metadata.json"
TRAIN_SCRIPT_PATH = BASE_DIR / "train_model.py"


def load_or_train_model():
    if not MODEL_PATH.exists() or not METADATA_PATH.exists():
        import subprocess

        subprocess.run([sys.executable, str(TRAIN_SCRIPT_PATH)], check=True)

    with METADATA_PATH.open("r", encoding="utf-8") as metadata_file:
        metadata = json.load(metadata_file)

    if metadata.get("method") == "isolation_forest" and MODEL_PATH.exists():
        with MODEL_PATH.open("rb") as model_file:
            model = pickle.load(model_file)
        return model, metadata

    return metadata, metadata


def parse_input_payload():
    raw_input = sys.stdin.read().strip()

    if not raw_input:
        return {}

    try:
        return json.loads(raw_input)
    except json.JSONDecodeError:
        return {}


def normalize_score(raw_score: float, metadata: dict) -> float:
    min_score = float(metadata.get("min_score", 0.0))
    max_score = float(metadata.get("max_score", 1.0))
    score_range = max_score - min_score

    if score_range <= 0:
        return 0.5

    normalized = (raw_score - min_score) / score_range
    return float(np.clip(normalized, 0.0, 1.0))


def robust_zscore_predict(raw_telemetry: dict, metadata: dict) -> float:
    median = metadata.get("median", {})
    mad = metadata.get("mad", {})
    score_values = []

    for feature in FEATURE_COLUMNS:
        value = float(raw_telemetry.get(feature, 0) or 0)
        median_value = float(median.get(feature, value or 0.0))
        mad_value = float(mad.get(feature, 1.0))
        normalized = abs(value - median_value) / mad_value if mad_value else 0.0
        score_values.append(normalized)

    base_score = float(np.mean(score_values))
    return float(np.clip(base_score / 8.0, 0.0, 1.0))


def build_payload(raw_telemetry: dict) -> dict:
    payload = {feature: 0 for feature in FEATURE_COLUMNS}

    for feature in FEATURE_COLUMNS:
        value = raw_telemetry.get(feature, 0)
        payload[feature] = float(value) if isinstance(value, (int, float)) else 0.0

    return payload


def predict(features):
    model, metadata = load_or_train_model()
    payload = build_payload(features)

    if metadata.get("method") == "isolation_forest":
        frame = pd.DataFrame([payload], columns=FEATURE_COLUMNS)
        decision_scores = -model.score_samples(frame[FEATURE_COLUMNS])
        raw_score = float(decision_scores[0])
        anomaly_score = normalize_score(raw_score, metadata)
    else:
        anomaly_score = robust_zscore_predict(payload, metadata)

    threshold = 0.55
    anomaly = bool(anomaly_score >= threshold)
    confidence = float(np.clip(0.6 + anomaly_score * 0.35, 0.6, 0.98))

    return {
        "anomaly": anomaly,
        "anomaly_score": round(anomaly_score, 4),
        "confidence": round(confidence, 4),
        "model": metadata.get("model", "IsolationForest"),
        "threshold": threshold,
        "feature_count": len(FEATURE_COLUMNS),
    }


if __name__ == "__main__":
    telemetry = parse_input_payload()
    result = predict(telemetry)
    print(json.dumps(result, separators=(",", ":")))
