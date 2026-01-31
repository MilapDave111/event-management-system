-- ===============================
-- USERS TABLE (SOEMS)
-- ===============================

-- 1. Create ENUM for user roles
CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'ORG_ADMIN',
  'EVENT_MANAGER',
  'EVENT_STAFF',
  'USER'
);

-- 2. Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,

  full_name VARCHAR(100) NOT NULL,

  email VARCHAR(150) UNIQUE NOT NULL,

  password_hash TEXT NOT NULL,

  -- Role-based access
  role user_role NOT NULL DEFAULT 'USER',

  -- Organization mapping (future use)
  organization_id INTEGER,

  -- Email verification & account status
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  verification_token TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(organization_id);
