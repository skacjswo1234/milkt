# 밀크T 울산센터 - 무료체험 신청 시스템

## 프로젝트 구조

```
milkt/
├── index.html              # 메인 랜딩 페이지
├── admin.html              # 관리자 페이지
├── schema.sql              # D1 데이터베이스 스키마
├── wrangler.toml           # Cloudflare 설정
├── functions/
│   └── api/
│       └── inquiries.js    # 문의 API 엔드포인트
└── images/                # 이미지 파일들
```

## 설정 방법

### 1. Cloudflare D1 데이터베이스 설정

1. Cloudflare Dashboard에서 D1 데이터베이스 생성
2. 데이터베이스 ID 확인: `698d2092-0c6e-4c23-8944-841b3191ae26`
3. `schema.sql` 파일을 사용하여 테이블 생성:

```bash
npx wrangler d1 execute milkt-db --file=schema.sql
```

### 2. Cloudflare Pages 배포

1. GitHub 저장소에 코드 푸시
2. Cloudflare Dashboard > Pages > Create a project
3. GitHub 저장소 연결
4. Build settings:
   - Build command: (없음)
   - Build output directory: `/`
5. Environment variables:
   - `milkt-db` (D1 데이터베이스 바인딩은 자동으로 설정됨)

### 3. D1 데이터베이스 바인딩

Cloudflare Pages 설정에서:
- D1 Database bindings 추가
- Variable name: `milkt-db`
- D1 Database: `milkt-db` 선택

## API 엔드포인트

### GET /api/inquiries
문의 목록 조회
- Query parameters:
  - `status`: all, pending, contacted, completed, cancelled
  - `page`: 페이지 번호 (기본값: 1)
  - `limit`: 페이지당 항목 수 (기본값: 20)

### GET /api/inquiries/:id
특정 문의 조회

### POST /api/inquiries
새 문의 생성
- Body:
  ```json
  {
    "child_birthday": "2020-01-01",
    "parent_name": "홍길동",
    "phone_number": "010-1234-5678",
    "agree1": true,
    "agree2": true,
    "agree3": false
  }
  ```

### PUT /api/inquiries/:id
문의 수정
- Body:
  ```json
  {
    "status": "contacted",
    "notes": "메모 내용"
  }
  ```

### DELETE /api/inquiries/:id
문의 삭제

### GET /api/stats
통계 정보 조회

## 사용 방법

1. **메인 페이지**: `index.html`
   - 무료체험 신청 폼
   - 카카오톡 오픈채팅 연결

2. **관리자 페이지**: `admin.html`
   - 문의 목록 조회 및 관리
   - 상태 변경 및 메모 작성
   - 통계 확인

## 개발 환경

로컬 개발을 위한 Wrangler CLI 사용:

```bash
# 의존성 설치
npm install -g wrangler

# 로컬 서버 실행
npx wrangler pages dev

# D1 데이터베이스 쿼리 실행
npx wrangler d1 execute milkt-db --file=schema.sql --local
```

## 주의사항

- D1 데이터베이스는 Cloudflare Pages Functions에서만 접근 가능
- 환경 변수 `milkt-db`는 자동으로 D1 데이터베이스 인스턴스에 바인딩됨
- CORS 설정이 포함되어 있어 다른 도메인에서도 API 호출 가능
