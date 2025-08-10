# Zombify Perception Service

Python FastAPI service that extracts pixel-grounded facts using Google Vision OCR and OpenCV.

## Endpoints
- GET /health → { ok, version, config? }
- POST /analyze → request/response per contract

## Environment
- GCP_PROJECT_ID
- GCP_CLIENT_EMAIL
- GCP_PRIVATE_KEY (use literal \n or escaped, both supported)
- PERCEPTION_MAX_WIDTH (optional, default 1440)
- OCR_BACKEND=gcv|paddle (default gcv)
- CACHE_DIR=./.perception_cache (optional; enables content-addressable cache)

## Local (Python)
```
cd perception
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn perception.main:app --host 0.0.0.0 --port 8080 --reload
```

## Docker
```
docker build -t zombify-perception:dev ./perception
# supply envs via --env-file or -e
docker run --rm -p 8080:8080 \
  -e GCP_PROJECT_ID -e GCP_CLIENT_EMAIL -e GCP_PRIVATE_KEY \
  -e OCR_BACKEND=gcv -e CACHE_DIR=/.cache \
  zombify-perception:dev
```

## Smoke
```
curl -s http://localhost:8080/health | jq
curl -s -X POST http://localhost:8080/analyze \
 -H "Content-Type: application/json" \
 -d '{"image_url":"<SIGNED-URL>","target_width":1440,"modes":["ocr","geometry","contrast","palette"]}' | jq
```

## Test helper
```
python -m perception.tests.test_local "https://signed-url.example.com/image.png"
```

## Sample response (truncated)
```json
{
  "version": "perception-2025-08-10",
  "image": { "w": 1440, "h": 900, "hash": "sha256-..." },
  "texts": [{ "id": "texts.t0", "text": "Start free trial", "bbox": [100,200,240,60], "conf": 0.98, "approxSizePx": 42 }],
  "contrast": [{ "id": "contrast.c0", "textId": "texts.t0", "ratio": 3.2, "wcag": "FAIL" }],
  "blocks": [{ "id": "blocks.b0", "bbox": [0,0,1440,420], "kind": "section" }],
  "grid": { "cols": 3, "gutterPx": 30, "confidence": 0.82 },
  "buttons": [{ "id": "buttons.btn0", "bbox": [110,210,220,52], "cornerRadius": 12, "hasCenterText": true, "textId": "texts.t0" }],
  "palette": { "dominant": ["#0F1012","#F5F2EC","#10B981","#6B7280","#EF4444"], "mode": "dark" },
  "metrics": { "medianVSpace": 22, "leftEdgeVariancePx": 1.6 },
  "source": { "ocr": "gcv-3.x", "cv": "opencv-4.x" }
}
```

## Troubleshooting
- If `OCR_BACKEND=paddle` and you did not install PaddleOCR, the service responds with `source.ocr="error:not installed"` while still returning geometry results.
- Ensure `GCP_*` envs are set for Google Vision.
