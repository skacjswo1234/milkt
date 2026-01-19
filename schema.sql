-- 밀크T 무료체험 문의 테이블
CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_birthday TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    agree1 INTEGER DEFAULT 0,
    agree2 INTEGER DEFAULT 0,
    agree3 INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', 
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_created_at ON inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_phone_number ON inquiries(phone_number);

-- 관리자 테이블
CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY,
    password TEXT NOT NULL
);
