-- 랜딩 구분: root(5~6세) / milkt-ver2(아이·초등·중고)
-- 실행: wrangler d1 execute milkt-db --remote --file=./migrations/002_add_landing.sql
ALTER TABLE inquiries ADD COLUMN landing TEXT DEFAULT 'milkt-56';
CREATE INDEX IF NOT EXISTS idx_landing ON inquiries(landing);
