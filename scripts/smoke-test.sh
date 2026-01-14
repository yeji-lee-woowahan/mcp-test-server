#!/bin/bash
# HTTP 모드 스모크 테스트 스크립트
# 사용법: ./scripts/smoke-test.sh [포트번호]
#
# 사전 조건: npm run start:http 로 서버 실행 중이어야 함
# 
# 응답이 SSE 형식이므로 data: 라인에서 JSON만 추출합니다.

PORT=${1:-3333}
BASE_URL="http://127.0.0.1:$PORT"

# SSE 응답에서 JSON 추출하는 함수
parse_sse() {
  grep '^data: ' | sed 's/^data: //'
}

echo "=== MCPHUB Test Server Smoke Test ==="
echo "Target: $BASE_URL"
echo ""

# 1. Health check
echo "[1] Health Check..."
curl -s "$BASE_URL/health" | jq .
echo ""

# 2. tools/list
echo "[2] tools/list..."
curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' | parse_sse | jq '.result.tools | map(.name)'
echo ""

# 3. prompts/list
echo "[3] prompts/list..."
curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"prompts/list","params":{},"id":2}' | parse_sse | jq '.result.prompts | map(.name)'
echo ""

# 4. get_my_info - 헤더 전달 검증
echo "[4] get_my_info (헤더 전달 검증)..."
curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-user-id: test-user-123" \
  -H "x-user-role: DEVELOPER" \
  -H "Authorization: Bearer test-token" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_my_info","arguments":{}},"id":3}' | parse_sse | jq '.result.content[0].text' -r | jq .
echo ""

# 5. external_api_call - Personal Key 검증 (키 없음 → 에러)
echo "[5] external_api_call (Personal Key 없음 → 에러 기대)..."
curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"external_api_call","arguments":{"service":"jira"}},"id":4}' | parse_sse | jq '.result | {isError, content: .content[0].text}'
echo ""

# 6. external_api_call - Personal Key 검증 (키 있음 → 성공)
echo "[6] external_api_call (Personal Key 있음 → 성공 기대)..."
curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-personal-jira-key: JIRA-SECRET-KEY-12345" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"external_api_call","arguments":{"service":"jira"}},"id":5}' | parse_sse | jq '.result.content[0].text'
echo ""

# 7. provision_cloud_resource - JSON Schema 검증
echo "[7] provision_cloud_resource..."
curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"provision_cloud_resource","arguments":{"provider":"aws","resourceType":"vm","tags":["production","api"],"options":{"region":"ap-northeast-2","autoScaling":true}}},"id":6}' | parse_sse | jq '.result.content[0].text' -r | jq .
echo ""

# 8. get_salary_info - 권한 검증 (권한 없음)
echo "[8] get_salary_info (권한 없음 → 에러 기대)..."
curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-user-role: DEVELOPER" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_salary_info","arguments":{"employeeId":"EMP001"}},"id":7}' | parse_sse | jq '.result | {isError, content: .content[0].text}'
echo ""

# 9. get_salary_info - 권한 검증 (HR_MANAGER)
echo "[9] get_salary_info (HR_MANAGER → 성공 기대)..."
curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-user-role: HR_MANAGER" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_salary_info","arguments":{"employeeId":"EMP001"}},"id":8}' | parse_sse | jq '.result.content[0].text'
echo ""

# 10. simulate_api_error - soft_fail
echo "[10] simulate_api_error (soft_fail)..."
curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"simulate_api_error","arguments":{"type":"soft_fail"}},"id":9}' | parse_sse | jq '.result'
echo ""

# 11. simulate_api_error - hard_500
echo "[11] simulate_api_error (hard_500 → 에러 기대)..."
curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"simulate_api_error","arguments":{"type":"hard_500"}},"id":10}' | parse_sse | jq '.result | {isError, content: .content[0].text}'
echo ""

echo "=== Smoke Test Complete ==="
