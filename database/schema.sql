-- Education Management System Database Schema
-- MySQL 8.0+ compatible

-- Create database
CREATE DATABASE IF NOT EXISTS education_management
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE education_management;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('student', 'tutor', 'admin', 'super_admin') NOT NULL DEFAULT 'student',
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    profile_picture VARCHAR(500),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    last_login_at TIMESTAMP NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    topic VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled') NOT NULL DEFAULT 'scheduled',
    session_type ENUM('one_on_one', 'group', 'workshop', 'assessment') NOT NULL DEFAULT 'one_on_one',
    max_students INT NOT NULL DEFAULT 1,
    current_students INT NOT NULL DEFAULT 0,
    location VARCHAR(255),
    meeting_link VARCHAR(500),
    materials JSON,
    notes TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern ENUM('daily', 'weekly', 'monthly'),
    recurring_end_date DATETIME,
    tags JSON,
    metadata JSON,
    tutor_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_tutor_id (tutor_id),
    INDEX idx_start_time (start_time),
    INDEX idx_status (status),
    INDEX idx_topic (topic),
    INDEX idx_created_at (created_at)
);

-- Session-Student relationship table
CREATE TABLE IF NOT EXISTS session_students (
    id CHAR(36) PRIMARY KEY,
    session_id CHAR(36) NOT NULL,
    student_id CHAR(36) NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('enrolled', 'attended', 'cancelled', 'no_show') DEFAULT 'enrolled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_student (session_id, student_id),
    INDEX idx_session_id (session_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status)
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id CHAR(36) PRIMARY KEY,
    session_id CHAR(36) NOT NULL,
    student_id CHAR(36) NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused', 'pending') NOT NULL DEFAULT 'pending',
    check_in_time TIMESTAMP NULL,
    check_out_time TIMESTAMP NULL,
    duration INT COMMENT 'Duration in minutes',
    notes TEXT,
    marked_by CHAR(36),
    marked_at TIMESTAMP NULL,
    reason VARCHAR(255),
    evidence JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_session_student_attendance (session_id, student_id),
    INDEX idx_session_id (session_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id CHAR(36) PRIMARY KEY,
    student_id CHAR(36) NOT NULL,
    session_id CHAR(36),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method ENUM('credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe', 'cash', 'waiver', 'dev_mode') NOT NULL DEFAULT 'dev_mode',
    status ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled') NOT NULL DEFAULT 'pending',
    transaction_id VARCHAR(255) UNIQUE,
    gateway_response JSON,
    description TEXT,
    due_date DATE,
    paid_at TIMESTAMP NULL,
    refunded_at TIMESTAMP NULL,
    refund_amount DECIMAL(10,2),
    refund_reason VARCHAR(255),
    invoice_number VARCHAR(50) UNIQUE,
    receipt_url VARCHAR(500),
    metadata JSON,
    environment ENUM('dev', 'prod') NOT NULL DEFAULT 'dev',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
    INDEX idx_student_id (student_id),
    INDEX idx_session_id (session_id),
    INDEX idx_status (status),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_due_date (due_date),
    INDEX idx_created_at (created_at)
);

-- Syllabus table
CREATE TABLE IF NOT EXISTS syllabus (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50),
    topics JSON NOT NULL COMMENT 'Array of topic objects with name, description, duration, order',
    total_hours INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_subject (subject),
    INDEX idx_grade_level (grade_level),
    INDEX idx_created_by (created_by),
    INDEX idx_is_active (is_active)
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id CHAR(36) PRIMARY KEY,
    session_id CHAR(36) NOT NULL,
    student_id CHAR(36) NOT NULL,
    tutor_id CHAR(36) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    category ENUM('teaching_quality', 'communication', 'punctuality', 'materials', 'overall') NOT NULL DEFAULT 'overall',
    is_anonymous BOOLEAN DEFAULT FALSE,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_student_feedback (session_id, student_id),
    INDEX idx_session_id (session_id),
    INDEX idx_student_id (student_id),
    INDEX idx_tutor_id (tutor_id),
    INDEX idx_rating (rating),
    INDEX idx_category (category),
    INDEX idx_status (status)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error', 'session', 'payment', 'announcement') NOT NULL DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    metadata JSON,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id CHAR(36) PRIMARY KEY,
    sender_id CHAR(36) NOT NULL,
    receiver_id CHAR(36) NOT NULL,
    message TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'audio', 'video') DEFAULT 'text',
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sender_id (sender_id),
    INDEX idx_receiver_id (receiver_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- Tutor availability table
CREATE TABLE IF NOT EXISTS tutor_availability (
    id CHAR(36) PRIMARY KEY,
    tutor_id CHAR(36) NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tutor_day_time (tutor_id, day_of_week, start_time),
    INDEX idx_tutor_id (tutor_id),
    INDEX idx_day_of_week (day_of_week),
    INDEX idx_is_available (is_available)
);

-- Tutor earnings table
CREATE TABLE IF NOT EXISTS tutor_earnings (
    id CHAR(36) PRIMARY KEY,
    tutor_id CHAR(36) NOT NULL,
    session_id CHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
    paid_at TIMESTAMP NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    INDEX idx_tutor_id (tutor_id),
    INDEX idx_session_id (session_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Test results table
CREATE TABLE IF NOT EXISTS test_results (
    id CHAR(36) PRIMARY KEY,
    student_id CHAR(36) NOT NULL,
    session_id CHAR(36),
    test_name VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    grade VARCHAR(10),
    answers JSON COMMENT 'Student answers and correct answers',
    feedback TEXT,
    taken_at TIMESTAMP NOT NULL,
    duration_minutes INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
    INDEX idx_student_id (student_id),
    INDEX idx_session_id (session_id),
    INDEX idx_subject (subject),
    INDEX idx_score (score),
    INDEX idx_taken_at (taken_at)
);

-- Organization settings table
CREATE TABLE IF NOT EXISTS organization_settings (
    id CHAR(36) PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json', 'date') NOT NULL DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_setting_key (setting_key),
    INDEX idx_is_public (is_public)
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id CHAR(36),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity_type (entity_type),
    INDEX idx_entity_id (entity_id),
    INDEX idx_created_at (created_at)
);

-- Insert default organization settings
INSERT INTO organization_settings (id, setting_key, setting_value, setting_type, description, is_public) VALUES
(UUID(), 'organization_name', 'Education Management System', 'string', 'Organization name', TRUE),
(UUID(), 'organization_email', 'info@education.com', 'string', 'Organization contact email', TRUE),
(UUID(), 'organization_phone', '+1-555-0123', 'string', 'Organization contact phone', TRUE),
(UUID(), 'organization_address', '123 Education Street, Learning City, LC 12345', 'string', 'Organization address', TRUE),
(UUID(), 'organization_website', 'https://education.com', 'string', 'Organization website', TRUE),
(UUID(), 'session_duration_default', '60', 'number', 'Default session duration in minutes', FALSE),
(UUID(), 'max_students_per_session', '20', 'number', 'Maximum students allowed per session', FALSE),
(UUID(), 'payment_due_days', '30', 'number', 'Default payment due days', FALSE),
(UUID(), 'whatsapp_enabled', 'true', 'boolean', 'Enable WhatsApp notifications', FALSE),
(UUID(), 'email_notifications_enabled', 'true', 'boolean', 'Enable email notifications', FALSE),
(UUID(), 'maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', FALSE);

-- Create views for common queries
CREATE OR REPLACE VIEW student_sessions_view AS
SELECT 
    s.id as session_id,
    s.title,
    s.topic,
    s.start_time,
    s.end_time,
    s.duration,
    s.status as session_status,
    s.location,
    s.meeting_link,
    s.price,
    s.currency,
    u.id as tutor_id,
    u.first_name as tutor_first_name,
    u.last_name as tutor_last_name,
    u.email as tutor_email,
    u.profile_picture as tutor_profile_picture,
    ss.student_id,
    ss.status as enrollment_status,
    ss.enrollment_date
FROM sessions s
JOIN users u ON s.tutor_id = u.id
JOIN session_students ss ON s.id = ss.session_id
WHERE u.role = 'tutor';

CREATE OR REPLACE VIEW attendance_summary_view AS
SELECT 
    a.session_id,
    s.title as session_title,
    s.topic,
    s.start_time,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_count,
    COUNT(*) as total_students
FROM attendance a
JOIN sessions s ON a.session_id = s.id
GROUP BY a.session_id, s.title, s.topic, s.start_time;

CREATE OR REPLACE VIEW payment_summary_view AS
SELECT 
    p.student_id,
    u.first_name,
    u.last_name,
    u.email,
    COUNT(p.id) as total_payments,
    SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_paid,
    SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as total_pending,
    SUM(CASE WHEN p.status = 'overdue' THEN p.amount ELSE 0 END) as total_overdue,
    MAX(p.created_at) as last_payment_date
FROM payments p
JOIN users u ON p.student_id = u.id
GROUP BY p.student_id, u.first_name, u.last_name, u.email;

-- Create indexes for better performance
CREATE INDEX idx_sessions_tutor_start ON sessions(tutor_id, start_time);
CREATE INDEX idx_attendance_session_student ON attendance(session_id, student_id);
CREATE INDEX idx_payments_student_status ON payments(student_id, status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_chat_sender_receiver ON chat_messages(sender_id, receiver_id);
CREATE INDEX idx_feedback_session_student ON feedback(session_id, student_id);
CREATE INDEX idx_test_results_student_subject ON test_results(student_id, subject);