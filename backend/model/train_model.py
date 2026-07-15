import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
import joblib
from pathlib import Path

# Generate synthetic data for fraud detection
np.random.seed(42)
# Features: length (0-1000), keyword_count (0-10)
length = np.random.randint(0, 1000, size=1000)
keyword_count = np.random.randint(0, 11, size=1000)
X = np.column_stack((length, keyword_count))
# Simple rule: high length & many keywords => fraud
y = ((length > 500) & (keyword_count > 3)).astype(int)

model = LogisticRegression()
model.fit(X, y)

# Save the model
model_path = Path(__file__).resolve().parent / "model.pkl"
joblib.dump(model, model_path)
print(f"Model saved to {model_path}")
