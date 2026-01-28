-- 기존 DB에 소스(선생님 고유번호) 컬럼 추가
-- 실행: wrangler d1 execute milkt-db --remote --file=./migrations/001_add_source.sql
ALTER TABLE inquiries ADD COLUMN source TEXT;
CREATE INDEX IF NOT EXISTS idx_source ON inquiries(source);
