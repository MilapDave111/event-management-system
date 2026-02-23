<<<<<<< HEAD
-- 1. Setup Extensions & Functions for Auto-Timestamps
CREATE OR REPLACE FUNCTION update_timestamp()

RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

<<<<<<< HEAD
-- 2. Organizations Table (PDF Feature 1.2)
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'MIT001'
    type VARCHAR(50) NOT NULL,        -- e.g., 'College', 'Institute'
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users Table (Integrated with your existing Auth Logic)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'EVENT_MANAGER', 'EVENT_STAFF', 'USER');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'USER',
    organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL, -- Multi-tenancy link
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    verification_token TEXT,
    verification_token_expiry TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Triggers for Automatic Time Tracking
DROP TRIGGER IF EXISTS trg_update_org_time ON organizations;
CREATE TRIGGER trg_update_org_time BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_user_time ON users;
CREATE TRIGGER trg_update_user_time BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();

