-- Women Safety & Emergency Alert System
-- Database Creation Script
-- Target Platform: MySQL 8.0+ / MariaDB

CREATE DATABASE IF NOT EXISTS women_safety_db;
USE women_safety_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user'
);

-- 2. Emergency Contacts Table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  contact_name VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  relationship VARCHAR(50) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. SOS Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  alert_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Incident Reports Table
CREATE TABLE IF NOT EXISTS incident_reports (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  incident_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'PENDING',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed initial admin user (Password pre-encrypted for Spring Security: Bcrypt for 'admin123' is $2a$10$8.KclF9E1F0pA0K/1kOnWeGfBqJbWdAtv.Jp8XyWwIclGskXy4p2a)
-- For demonstration purposes:
-- INSERT INTO users (name, email, phone, password, role) VALUES ('System Admin', 'admin@safety.com', '+1555029312', '$2a$10$8.KclF9E1F0pA0K/1kOnWeGfBqJbWdAtv.Jp8XyWwIclGskXy4p2a', 'admin');
