-- 1. Create the event_team table to track which staff members belong to which manager
CREATE TABLE IF NOT EXISTS event_team (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    managed_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, managed_by) 
);

-- 2. Create the tasks table for the Kanban board and Task Assignment Hub
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo', -- 'todo', 'in-progress', 'done'
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

 1. Search Normal Users (To promote to Staff)
-- Used in: searchUsers function
SELECT id, full_name, email 
FROM users 
WHERE role = 'USER' 
  AND full_name ILIKE $1 
LIMIT 5;

-- 2. Assign User as Event Staff (Promote Role)
-- Used in: assignStaff function
UPDATE users 
SET role = 'EVENT_STAFF' 
WHERE id = $1;

-- 3. Fetch List of Current Event Staff
-- Used in: getStaffList function
SELECT id, full_name, email 
FROM users 
WHERE role = 'EVENT_STAFF' 
ORDER BY full_name ASC;

-- 4. Remove Staff (Demote back to Normal User)
-- Used in: removeStaff function
UPDATE users 
SET role = 'USER' 
WHERE id = $1;


-- ==============================================================================
-- FEATURE: TASKS / KANBAN BOARD (From taskController.js)
-- ==============================================================================

-- 1. Create a New Task
-- Used in: createTask function
INSERT INTO tasks (title, description, status, event_id, assigned_to) 
VALUES ($1, $2, $3, $4, $5) 
RETURNING *;

-- 2. Get All Tasks for a Specific Event
-- Used in: getEventTasks function
SELECT * FROM tasks 
WHERE event_id = $1;

-- 3. Update Task Status (Drag and Drop in Kanban)
-- Used in: updateTaskStatus function
UPDATE tasks 
SET status = $1 
WHERE id = $2;  


--dummy data
-- The hash below is for '12211221' using Bcrypt (10 rounds)
-- $2b$10$7s/L8yR9YmP8u.e/Tz7fL.x1mY3y.vH3Z4oQ9.W1E8y9mP8u.e/Tz7fL.

INSERT INTO users (full_name, email, password_hash, role, organization_id, is_verified, is_active)
VALUES 
('Test User One',   'user1@gmail.com', '$2b$10$7s/L8yR9YmP8u.e/Tz7fL.x1mY3y.vH3Z4oQ9.W1E8y9mP8u.e/Tz7fL.', 'USER', 4, TRUE, TRUE),
('Test User Two',   'user2@gmail.com', '$2b$10$7s/L8yR9YmP8u.e/Tz7fL.x1mY3y.vH3Z4oQ9.W1E8y9mP8u.e/Tz7fL.', 'USER', 4, TRUE, TRUE),
('Test User Three', 'user3@gmail.com', '$2b$10$7s/L8yR9YmP8u.e/Tz7fL.x1mY3y.vH3Z4oQ9.W1E8y9mP8u.e/Tz7fL.', 'USER', 8, TRUE, TRUE),
('Test User Four',  'user4@gmail.com', '$2b$10$7s/L8yR9YmP8u.e/Tz7fL.x1mY3y.vH3Z4oQ9.W1E8y9mP8u.e/Tz7fL.', 'USER', 8, TRUE, TRUE),
('Test User Five',  'user5@gmail.com', '$2b$10$7s/L8yR9YmP8u.e/Tz7fL.x1mY3y.vH3Z4oQ9.W1E8y9mP8u.e/Tz7fL.', 'USER', 8, TRUE, TRUE);



UPDATE users
SET password_hash = crypt('12211221', gen_salt('bf'))
WHERE email IN (
    'user1@gmail.com', 
    'user2@gmail.com', 
    'user3@gmail.com', 
    'user4@gmail.com', 
    'user5@gmail.com'
);