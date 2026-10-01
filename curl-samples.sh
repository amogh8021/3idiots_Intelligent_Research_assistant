#!/usr/bin/env bash
# ResearchDesk API cURL Examples (Including Auth & Multi-Doc Synthesis)

BASE_URL="http://localhost:8080"

echo "=== 1. Register a Real Researcher ==="
RAND_SUFFIX=$RANDOM
REG_RES=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Dr. Jane Goodall\", \"email\": \"jane${RAND_SUFFIX}@researchdesk.ai\", \"password\": \"academicPass123\"}")
echo "$REG_RES" | jq .

TOKEN=$(echo "$REG_RES" | jq -r '.token')
echo "JWT Token: ${TOKEN:0:28}..."

echo ""
echo "=== 2. Check /api/auth/me Profile ==="
curl -s -X GET "${BASE_URL}/api/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo "=== 3. 1-Click Seed Curated Academic Papers ==="
SEED_RES=$(curl -s -X POST "${BASE_URL}/api/documents/seed-samples" \
  -H "Authorization: Bearer $TOKEN")
echo "$SEED_RES" | jq .

DOC_ID_1=$(echo "$SEED_RES" | jq -r '.[0].id')
DOC_ID_2=$(echo "$SEED_RES" | jq -r '.[1].id')

echo ""
echo "=== 4. Check Dashboard Stats ==="
curl -s -X GET "${BASE_URL}/api/documents/stats" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo "=== 5. Multi-Document Executive Synthesis ==="
curl -s -X POST "${BASE_URL}/api/research/synthesize" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"documentIds\": [\"${DOC_ID_1}\", \"${DOC_ID_2}\"], \"focus\": \"executive\"}" | jq .

echo ""
echo "=== 6. Ask Question Across Papers ==="
curl -s -X POST "${BASE_URL}/api/research/ask" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"documentIds\": [\"${DOC_ID_1}\"], \"question\": \"What is the primary breakthrough demonstrated in this work?\"}" | jq .

echo ""
echo "=== 7. Retrieve Research History ==="
curl -s -X GET "${BASE_URL}/api/research/history" \
  -H "Authorization: Bearer $TOKEN" | jq .
