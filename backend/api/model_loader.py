import joblib
from pathlib import Path

# Resolve the path to the serialized model file relative to the repository root
MODEL_PATH = Path(__file__).resolve().parent.parent / "model" / "model.pkl"

def load_model():
    """Load and return the pre‑trained fraud‑risk classifier.

    Returns:
        sklearn.base.BaseEstimator: The trained model instance.
    """
    return joblib.load(MODEL_PATH)
