import json
import pickle
from pathlib import Path

import numpy as np
import pandas as pd

try:
    from sklearn.ensemble import IsolationForest
except Exception:  # pragma: no cover - environment may block the sklearn runtime
    IsolationForest = None

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
TRAINING_PATH = BASE_DIR / "training" / "synthetic_telemetry.csv"
MODEL_PATH = BASE_DIR / "models" / "isolation_forest.pkl"
METADATA_PATH = BASE_DIR / "models" / "isolation_forest_metadata.json"


def generate_synthetic_dataset() -> pd.DataFrame:
    rng = np.random.default_rng(42)
    rows = []

    for _ in range(600):
        rows.append(
            {
                "network_frequency": int(rng.integers(5, 45)),
                "failed_connections": int(rng.integers(0, 6)),
                "suspicious_requests": int(rng.integers(0, 4)),
                "dns_requests": int(rng.integers(2, 18)),
                "unique_destinations": int(rng.integers(1, 9)),
                "periodic_connections": int(rng.integers(0, 8)),
                "upload_bytes": int(rng.integers(200_000, 2_500_000)),
                "download_bytes": int(rng.integers(100_000, 3_000_000)),
            }
        )

    for _ in range(180):
        rows.append(
            {
                "network_frequency": int(rng.integers(90, 220)),
                "failed_connections": int(rng.integers(12, 48)),
                "suspicious_requests": int(rng.integers(10, 45)),
                "dns_requests": int(rng.integers(25, 120)),
                "unique_destinations": int(rng.integers(15, 45)),
                "periodic_connections": int(rng.integers(15, 80)),
                "upload_bytes": int(rng.integers(8_000_000, 40_000_000)),
                "download_bytes": int(rng.integers(3_000_000, 20_000_000)),
            }
        )

    df = pd.DataFrame(rows, columns=FEATURE_COLUMNS)
    TRAINING_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(TRAINING_PATH, index=False)
    return df


def train_model() -> dict:
    if not TRAINING_PATH.exists():
        data = generate_synthetic_dataset()
    else:
        data = pd.read_csv(TRAINING_PATH)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

    if IsolationForest is not None:
        model = IsolationForest(
            contamination=0.12,
            n_estimators=250,
            random_state=42,
        )
        model.fit(data[FEATURE_COLUMNS])

        with MODEL_PATH.open("wb") as model_file:
            pickle.dump(model, model_file)

        train_scores = -model.score_samples(data[FEATURE_COLUMNS])
        metadata = {
            "features": FEATURE_COLUMNS,
            "min_score": float(train_scores.min()),
            "max_score": float(train_scores.max()),
            "model": "IsolationForest",
            "method": "isolation_forest",
            "training_rows": int(len(data)),
        }
    else:
        median = data[FEATURE_COLUMNS].median()
        mad = (data[FEATURE_COLUMNS] - median).abs().median().replace(0, 1e-6)
        metadata = {
            "features": FEATURE_COLUMNS,
            "median": median.to_dict(),
            "mad": mad.to_dict(),
            "model": "IsolationForest",
            "method": "robust_zscore",
            "training_rows": int(len(data)),
        }
        with MODEL_PATH.open("wb") as model_file:
            pickle.dump(metadata, model_file)

    with METADATA_PATH.open("w", encoding="utf-8") as metadata_file:
        json.dump(metadata, metadata_file, indent=2)

    return metadata


if __name__ == "__main__":
    print(json.dumps(train_model(), indent=2))
