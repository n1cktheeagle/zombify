from __future__ import annotations

import json
import os
import sys
from typing import Any

import requests


BASE = os.getenv("PERCEPTION_BASE", "http://localhost:8080")


EXPECTED_KEYS = {"version", "image", "texts", "contrast", "blocks", "grid", "buttons", "palette", "metrics", "source"}


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m perception.tests.test_local <image_url>")
        sys.exit(1)
    url = sys.argv[1]
    payload = {
        "image_url": url,
        "target_width": int(os.getenv("PERCEPTION_MAX_WIDTH", "1440")),
        "modes": ["ocr", "geometry", "contrast", "palette"],
    }
    r = requests.post(f"{BASE}/analyze", json=payload, timeout=180)
    print("Status:", r.status_code)
    perf = {k: v for k, v in r.headers.items() if k.lower().startswith("x-perf") or k.lower()=="x-cache"}
    print("Perf:", perf)
    data: Any = r.json()
    missing = EXPECTED_KEYS - set(data.keys())
    if missing:
        print("Missing keys:", missing)
        sys.exit(2)
    print(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()
