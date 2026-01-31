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


-- =====================================================
-- Indexes: organizations
-- Allowed: identity lookup & future joins only
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_organizations_name
ON organizations (name);

CREATE INDEX IF NOT EXISTS idx_organizations_code
ON organizations (code);


-- =====================================================
-- Table: organizations
-- Purpose: Standalone organization / institute entity
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
    organization_id BIGSERIAL PRIMARY KEY,

    name             VARCHAR(255) NOT NULL,
    code             VARCHAR(50)  NOT NULL,
    type             VARCHAR(50)  NOT NULL,
    status           VARCHAR(50)  NOT NULL,

    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ NULL,

    CONSTRAINT uq_organizations_name UNIQUE (name),
    CONSTRAINT uq_organizations_code UNIQUE (code)
);


-- =====================================================
-- Trigger: auto-update updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION set_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;

CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION set_organizations_updated_at();

-- =====================================================
-- Table: permissions
-- =====================================================

CREATE TABLE IF NOT EXISTS permissions (
    permission_id   BIGSERIAL PRIMARY KEY,
    permission_key  VARCHAR(100) NOT NULL,

    CONSTRAINT uq_permissions_permission_key UNIQUE (permission_key)
);

-- =====================================================
-- Indexes: RBAC (strictly allowed)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
ON user_roles (user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_role_id
ON user_roles (role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id
ON role_permissions (role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id
ON role_permissions (permission_id);

-- =====================================================
-- Table: role_permissions (junction)
-- =====================================================

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,

    CONSTRAINT pk_role_permissions PRIMARY KEY (role_id, permission_id),

    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id)
        REFERENCES permissions(permission_id)
        ON DELETE RESTRICT
);

-- =====================================================
-- Table: roles
-- =====================================================

CREATE TABLE IF NOT EXISTS roles (
    role_id    BIGSERIAL PRIMARY KEY,
    role_name  VARCHAR(50) NOT NULL,

    CONSTRAINT uq_roles_role_name UNIQUE (role_name)
);

-- =====================================================
-- Indexes: user_profiles
-- Allowed: user_id lookup + joins only
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id
ON user_profiles (user_id);

-- =====================================================
-- Trigger: auto-update updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION set_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;

CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION set_user_profiles_updated_at();

-- =====================================================
-- Table: user_roles (junction)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,

    CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_id),

    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
        ON DELETE RESTRICT
);
