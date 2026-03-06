-- --- START OF MILAP'S DATABASE SCHEMA ---
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    target_id INTEGER,
    action_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- --- END OF MILAP'S DATABASE SCHEMA ---