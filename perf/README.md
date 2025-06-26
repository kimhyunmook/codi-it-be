# 성능 테스트 가이드

## 사전 준비

- 로컬 서버 실행 (예: `npm run start:dev`)
- 테스트 전 DB 초기화 or 테스트용 데이터 삽입

## Artillery 테스트 실행

```bash
artillery run perf/scripts/get-products.yml -o perf/results/get-products.json
```

## results 설명

1. counters — 총합 카운트
   vusers.created: 생성된 가상 유저 총 수 (여기서는 600명)

vusers.failed: 실패한 유저 수 (0 → 실패 없음)

vusers.completed: 테스트 완료한 유저 수 (600명)

http.requests: 총 HTTP 요청 수 (600번 요청)

http.codes.200: 200 OK 응답 수 (600개 모두 성공)

http.responses: 받은 HTTP 응답 수 (600)

http.downloaded_bytes: 다운로드된 총 바이트 수 (4,666,200 바이트)

plugins.metrics-by-endpoint./api/products.codes.200: /api/products 경로에 대한 200 응답 수 (600)

2. rates — 비율 및 요청 속도
   http.request_rate: 초당 요청 수 (10 RPS; 초당 10개의 요청을 보냄)

3. 타임스탬프 관련
   firstCounterAt ~ lastMetricAt: 측정 시작과 끝 시점 (Unix Epoch 밀리초 단위)

period: 전체 테스트 기간 (ms 단위, 약 1749초 = 약 29분)

4. summaries 및 histograms — 응답 시간 통계
   http.response_time: 모든 HTTP 요청의 응답 시간 (ms 단위)

http.response_time.2xx: 2xx 상태코드(성공) 응답의 응답 시간

plugins.metrics-by-endpoint.response_time./api/products: /api/products 엔드포인트 응답 시간

vusers.session_length: 각 가상 유저가 테스트 세션에 머문 시간 (ms)
