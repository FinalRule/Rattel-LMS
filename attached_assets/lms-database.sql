-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for various statuses
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE class_status AS ENUM ('active', 'paused', 'completed', 'cancelled');
CREATE TYPE session_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_type AS ENUM ('student_payment', 'teacher_payout');

-- Users table (base table for teachers and students)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(50),
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    timezone VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Teachers table (extends users)
CREATE TABLE teachers (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    bio TEXT,
    cv_file_url VARCHAR(255),
    residence_city VARCHAR(100),
    payment_method JSONB,  -- Stores payment details (bank account, digital wallet, etc.)
    base_salary_per_hour DECIMAL(10, 2),
    google_account VARCHAR(255),
    availability_schedule JSONB,  -- Stores weekly availability
    buffer_time_preference INTEGER,  -- Minutes
    notes TEXT,
    rating DECIMAL(3, 2)
);

-- Students table (extends users)
CREATE TABLE students (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    nationality VARCHAR(100),
    country_of_residence VARCHAR(100),
    parent_name VARCHAR(255),
    payment_method JSONB,  -- Stores payment preferences
    learning_goals TEXT,
    preferred_session_days VARCHAR(255)[],  -- Array of preferred days
    notes TEXT,
    emergency_contact JSONB
);

-- Subjects table
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    details TEXT,
    category VARCHAR(100),
    difficulty_level VARCHAR(50),
    available_durations INTEGER[],  -- Array of durations in minutes
    sessions_per_month INTEGER,
    default_buffer_time INTEGER,  -- Minutes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Teacher-Subject relationship (which teachers can teach which subjects)
CREATE TABLE teacher_subjects (
    teacher_id UUID REFERENCES teachers(user_id),
    subject_id UUID REFERENCES subjects(id),
    PRIMARY KEY (teacher_id, subject_id)
);

-- Price Plans table
CREATE TABLE price_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id),
    name VARCHAR(255) NOT NULL,
    duration_per_session INTEGER NOT NULL,  -- Minutes
    sessions_per_month INTEGER NOT NULL,
    monthly_fee DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,  -- ISO currency code
    promotional_price DECIMAL(10, 2),
    promotion_valid_until TIMESTAMP WITH TIME ZONE,
    minimum_commitment INTEGER,  -- Months
    is_trial_eligible BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id),
    teacher_id UUID REFERENCES teachers(user_id),
    price_plan_id UUID REFERENCES price_plans(id),
    name VARCHAR(255),
    start_date DATE NOT NULL,
    default_duration INTEGER NOT NULL,  -- Minutes
    schedule JSONB NOT NULL,  -- Stores recurring schedule
    buffer_time INTEGER,  -- Minutes
    monthly_price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    teacher_hourly_rate DECIMAL(10, 2) NOT NULL,
    status class_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student-Class enrollment
CREATE TABLE class_enrollments (
    class_id UUID REFERENCES classes(id),
    student_id UUID REFERENCES students(user_id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (class_id, student_id)
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id),
    session_number INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    planned_duration INTEGER NOT NULL,  -- Minutes
    actual_duration INTEGER,  -- Minutes
    google_meet_link VARCHAR(255),
    buffer_time_before INTEGER,  -- Minutes
    buffer_time_after INTEGER,  -- Minutes
    status session_status DEFAULT 'scheduled',
    rescheduled_from UUID REFERENCES sessions(id),
    cancellation_reason TEXT,
    recording_url VARCHAR(255),
    teacher_notes TEXT,
    student_notes TEXT,
    student_points INTEGER CHECK (student_points >= 0 AND student_points <= 10),
    is_makeup_session BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session Attendance
CREATE TABLE session_attendance (
    session_id UUID REFERENCES sessions(id),
    user_id UUID REFERENCES users(id),
    status attendance_status,
    join_time TIMESTAMP WITH TIME ZONE,
    leave_time TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (session_id, user_id)
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    payment_type payment_type NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    exchange_rate DECIMAL(10, 4),
    status payment_status DEFAULT 'pending',
    payment_method JSONB,
    transaction_reference VARCHAR(255),
    invoice_number VARCHAR(100),
    month INTEGER,
    year INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Resources table
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(255),
    file_type VARCHAR(50),
    owner_id UUID REFERENCES users(id),
    subject_id UUID REFERENCES subjects(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resource sharing
CREATE TABLE resource_sharing (
    resource_id UUID REFERENCES resources(id),
    class_id UUID REFERENCES classes(id),
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (resource_id, class_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for frequently accessed columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_class_id ON sessions(class_id);
CREATE INDEX idx_sessions_start_time ON sessions(start_time);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_class_enrollments_student_id ON class_enrollments(student_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_user_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subject_modtime
    BEFORE UPDATE ON subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_modtime
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add table comments
COMMENT ON TABLE users IS 'Base table for all users in the system';
COMMENT ON TABLE teachers IS 'Extended information for teacher users';
COMMENT ON TABLE students IS 'Extended information for student users';
COMMENT ON TABLE subjects IS 'Available subjects that can be taught';
COMMENT ON TABLE classes IS 'Individual classes with their schedule and configuration';
COMMENT ON TABLE sessions IS 'Individual sessions within classes';
COMMENT ON TABLE payments IS 'All financial transactions in the system';
