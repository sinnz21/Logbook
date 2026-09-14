-- ============================================================================
-- ISU INFIRMARY LOG BOOK SYSTEM — DATABASE SCHEMA
-- Generated from: ISU_Infirmary_Database_Plan_corrected.txt
-- Engine: MySQL 8.0+ / MariaDB 10.5+
-- Charset: utf8mb4 (safe for Filipino names, ñ, emoji in notes, etc.)
-- ============================================================================
--
-- Load order matters because of foreign keys. Tables are created in
-- dependency order (parents before children), and disabled during the
-- run just in case, then re-enabled at the end.
--
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS isu_infirmary
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE isu_infirmary;

-- ============================================================================
-- 1. USERS
-- Staff and Admin accounts. These are the only accounts that log in to
-- the system — patients are never login users (see PATIENTS below).
-- ============================================================================
CREATE TABLE users (
  user_id         INT AUTO_INCREMENT PRIMARY KEY,
  first_name      VARCHAR(100) NOT NULL,
  middle_name     VARCHAR(100) NULL,
  last_name       VARCHAR(100) NOT NULL,
  username        VARCHAR(50)  NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            ENUM('admin','nurse','doctor','staff') NOT NULL,
  email           VARCHAR(150) NULL,
  status          ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_username UNIQUE (username),
  CONSTRAINT uq_users_email    UNIQUE (email)
) ENGINE=InnoDB;

CREATE INDEX idx_users_role   ON users (role);
CREATE INDEX idx_users_status ON users (status);


-- ============================================================================
-- 2. PATIENT_TYPES
-- ============================================================================
CREATE TABLE patient_types (
  patient_type_id INT AUTO_INCREMENT PRIMARY KEY,
  type_name       VARCHAR(50)  NOT NULL,
  description     VARCHAR(255) NULL,
  CONSTRAINT uq_patient_types_name UNIQUE (type_name)
) ENGINE=InnoDB;


-- ============================================================================
-- 3. PATIENTS
-- Permanent/basic info per patient. Separate from VISITS (a patient has
-- many visits) and separate from USERS (patients never log in).
-- ============================================================================
CREATE TABLE patients (
  patient_id      INT AUTO_INCREMENT PRIMARY KEY,
  patient_number  VARCHAR(50)  NULL,
  first_name      VARCHAR(100) NOT NULL,
  middle_name     VARCHAR(100) NULL,
  last_name       VARCHAR(100) NOT NULL,
  gender          VARCHAR(30)  NULL,
  age             INT UNSIGNED NULL,
  contact_number  VARCHAR(30)  NULL,
  patient_type_id INT NULL,
  department      VARCHAR(150) NULL COMMENT 'Only for Students and Faculty/NASA (Non-Teaching Staff). Pre-filled automatically when the patient is already on the roster; entered manually when adding a brand-new one.',
  program         VARCHAR(150) NULL,
  year_level      VARCHAR(50)  NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_patients_number UNIQUE (patient_number),
  CONSTRAINT fk_patients_type
    FOREIGN KEY (patient_type_id) REFERENCES patient_types(patient_type_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_patients_name ON patients (last_name, first_name);
CREATE INDEX idx_patients_type ON patients (patient_type_id);


-- ============================================================================
-- 5. DISPOSITIONS  (created before VISITS, which references it)
-- ============================================================================
CREATE TABLE dispositions (
  disposition_id   INT AUTO_INCREMENT PRIMARY KEY,
  disposition_name VARCHAR(100) NOT NULL,
  description      VARCHAR(255) NULL,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_dispositions_name UNIQUE (disposition_name)
) ENGINE=InnoDB;


-- ============================================================================
-- 4. VISITS
-- ============================================================================
CREATE TABLE visits (
  visit_id          INT AUTO_INCREMENT PRIMARY KEY,
  patient_id        INT NOT NULL,
  attending_user_id INT NULL,
  chief_complaint   TEXT NOT NULL,
  blood_pressure    VARCHAR(20)  NULL,
  temperature       DECIMAL(4,1) NULL,
  pulse_rate        INT UNSIGNED NULL,
  treatment_notes   TEXT NULL,
  disposition_id    INT NULL,
  visit_date        DATE NOT NULL,
  time_in           TIME NULL,
  time_out          TIME NULL,
  status            ENUM('waiting','in_care','completed','referred','cancelled')
                      NOT NULL DEFAULT 'waiting',
  created_by        INT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_visits_patient
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_visits_attending_user
    FOREIGN KEY (attending_user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_visits_disposition
    FOREIGN KEY (disposition_id) REFERENCES dispositions(disposition_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_visits_created_by
    FOREIGN KEY (created_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_visits_patient   ON visits (patient_id);
CREATE INDEX idx_visits_date      ON visits (visit_date);
CREATE INDEX idx_visits_status    ON visits (status);
CREATE INDEX idx_visits_attending ON visits (attending_user_id);


-- ============================================================================
-- 6. SPECIAL_CASE_TYPES
-- ============================================================================
CREATE TABLE special_case_types (
  special_case_type_id INT AUTO_INCREMENT PRIMARY KEY,
  case_name            VARCHAR(100) NOT NULL,
  description          VARCHAR(255) NULL,
  active               BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_special_case_types_name UNIQUE (case_name)
) ENGINE=InnoDB;


-- ============================================================================
-- 7. VISIT_SPECIAL_CASES
-- Links a PATIENT (not a single visit) to one or more special-case types,
-- so a flag persists across every future visit. origin_visit_id keeps an
-- audit trail of which visit first raised the flag, without making the
-- flag disappear once that particular visit is no longer "current."
-- ============================================================================
CREATE TABLE visit_special_cases (
  visit_special_case_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id            INT NOT NULL,
  special_case_type_id  INT NOT NULL,
  origin_visit_id       INT NULL,
  notes                 TEXT NULL,
  flagged_by            INT NULL,
  flagged_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_vsc_patient
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_vsc_type
    FOREIGN KEY (special_case_type_id) REFERENCES special_case_types(special_case_type_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_vsc_origin_visit
    FOREIGN KEY (origin_visit_id) REFERENCES visits(visit_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_vsc_flagged_by
    FOREIGN KEY (flagged_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_vsc_patient ON visit_special_cases (patient_id, active);
CREATE INDEX idx_vsc_type    ON visit_special_cases (special_case_type_id);


-- ============================================================================
-- 8. MEDICINE_CATEGORIES
-- ============================================================================
CREATE TABLE medicine_categories (
  category_id   INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  description   VARCHAR(255) NULL,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_medicine_categories_name UNIQUE (category_name)
) ENGINE=InnoDB;


-- ============================================================================
-- 9. MEDICINES
-- ============================================================================
CREATE TABLE medicines (
  medicine_id   INT AUTO_INCREMENT PRIMARY KEY,
  medicine_name VARCHAR(150) NOT NULL,
  category_id   INT NULL,
  unit          VARCHAR(50)  NOT NULL,
  description   VARCHAR(255) NULL,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_medicines_name UNIQUE (medicine_name),
  CONSTRAINT fk_medicines_category
    FOREIGN KEY (category_id) REFERENCES medicine_categories(category_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_medicines_category ON medicines (category_id);


-- ============================================================================
-- 10. MEDICINE_STOCK
-- ============================================================================
CREATE TABLE medicine_stock (
  stock_id      INT AUTO_INCREMENT PRIMARY KEY,
  medicine_id   INT NOT NULL,
  quantity      DECIMAL(10,2) NOT NULL DEFAULT 0,
  reorder_level DECIMAL(10,2) NOT NULL DEFAULT 0,
  expiry_date   DATE NULL,
  stock_status  ENUM('high','low','out_of_stock') NOT NULL DEFAULT 'high',
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP,
  updated_by    INT NULL,
  CONSTRAINT uq_medicine_stock_medicine UNIQUE (medicine_id),
  CONSTRAINT fk_medicine_stock_medicine
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_medicine_stock_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_medicine_stock_status ON medicine_stock (stock_status);


-- ============================================================================
-- 11. SUPPLIES
-- ============================================================================
CREATE TABLE supplies (
  supply_id   INT AUTO_INCREMENT PRIMARY KEY,
  supply_name VARCHAR(150) NOT NULL,
  category    VARCHAR(100) NULL,
  unit        VARCHAR(50)  NOT NULL,
  description VARCHAR(255) NULL,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_supplies_name UNIQUE (supply_name)
) ENGINE=InnoDB;


-- ============================================================================
-- 12. SUPPLY_STOCK
-- ============================================================================
CREATE TABLE supply_stock (
  supply_stock_id INT AUTO_INCREMENT PRIMARY KEY,
  supply_id       INT NOT NULL,
  quantity        DECIMAL(10,2) NOT NULL DEFAULT 0,
  reorder_level   DECIMAL(10,2) NOT NULL DEFAULT 0,
  expiry_date     DATE NULL,
  stock_status    ENUM('high','low','out_of_stock') NOT NULL DEFAULT 'high',
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
  updated_by      INT NULL,
  CONSTRAINT uq_supply_stock_supply UNIQUE (supply_id),
  CONSTRAINT fk_supply_stock_supply
    FOREIGN KEY (supply_id) REFERENCES supplies(supply_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_supply_stock_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_supply_stock_status ON supply_stock (stock_status);


-- ============================================================================
-- 13. VISIT_MEDICINES
-- ============================================================================
CREATE TABLE visit_medicines (
  visit_medicine_id INT AUTO_INCREMENT PRIMARY KEY,
  visit_id          INT NOT NULL,
  medicine_id       INT NOT NULL,
  quantity_given    DECIMAL(10,2) NOT NULL,
  dosage            VARCHAR(100) NULL,
  instructions      VARCHAR(255) NULL,
  given_by          INT NULL,
  given_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_visit_medicines_visit
    FOREIGN KEY (visit_id) REFERENCES visits(visit_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_visit_medicines_medicine
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_visit_medicines_given_by
    FOREIGN KEY (given_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_visit_medicines_visit    ON visit_medicines (visit_id);
CREATE INDEX idx_visit_medicines_medicine ON visit_medicines (medicine_id);


-- ============================================================================
-- 14. STOCK_REQUESTS
-- ============================================================================
CREATE TABLE stock_requests (
  request_id     INT AUTO_INCREMENT PRIMARY KEY,
  requested_by   INT NOT NULL,
  request_date   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status         ENUM('pending','approved','denied','completed')
                   NOT NULL DEFAULT 'pending',
  approved_by    INT NULL,
  approved_at    DATETIME NULL,
  admin_response TEXT NULL,
  remarks        TEXT NULL,
  CONSTRAINT fk_stock_requests_requested_by
    FOREIGN KEY (requested_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_stock_requests_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_stock_requests_status ON stock_requests (status);


-- ============================================================================
-- 15. STOCK_REQUEST_ITEMS
-- ============================================================================
CREATE TABLE stock_request_items (
  request_item_id    INT AUTO_INCREMENT PRIMARY KEY,
  request_id         INT NOT NULL,
  item_type          ENUM('medicine','supply') NOT NULL,
  medicine_id        INT NULL,
  supply_id          INT NULL,
  requested_quantity DECIMAL(10,2) NOT NULL,
  approved_quantity  DECIMAL(10,2) NULL,
  reason             VARCHAR(255) NULL,
  CONSTRAINT fk_sri_request
    FOREIGN KEY (request_id) REFERENCES stock_requests(request_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_sri_medicine
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_sri_supply
    FOREIGN KEY (supply_id) REFERENCES supplies(supply_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  -- Enforces: item_type='medicine' -> medicine_id set, supply_id NULL
  --           item_type='supply'   -> supply_id set, medicine_id NULL
  CONSTRAINT chk_sri_item_type CHECK (
    (item_type = 'medicine' AND medicine_id IS NOT NULL AND supply_id IS NULL)
    OR
    (item_type = 'supply' AND supply_id IS NOT NULL AND medicine_id IS NULL)
  )
) ENGINE=InnoDB;

CREATE INDEX idx_sri_request  ON stock_request_items (request_id);
CREATE INDEX idx_sri_medicine ON stock_request_items (medicine_id);
CREATE INDEX idx_sri_supply   ON stock_request_items (supply_id);


-- ============================================================================
-- 16. INVENTORY_TRANSACTIONS
-- ============================================================================
CREATE TABLE inventory_transactions (
  transaction_id   INT AUTO_INCREMENT PRIMARY KEY,
  item_type        ENUM('medicine','supply') NOT NULL,
  medicine_id      INT NULL,
  supply_id        INT NULL,
  transaction_type ENUM('released','restocked','adjustment','expired','damaged')
                     NOT NULL,
  quantity         DECIMAL(10,2) NOT NULL,
  reference_id     INT NULL COMMENT 'Points to visits.visit_id when transaction_type = released, or stock_requests.request_id when transaction_type = restocked.',
  performed_by     INT NULL,
  transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  remarks          TEXT NULL,
  CONSTRAINT fk_it_medicine
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_it_supply
    FOREIGN KEY (supply_id) REFERENCES supplies(supply_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_it_performed_by
    FOREIGN KEY (performed_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_it_item_type CHECK (
    (item_type = 'medicine' AND medicine_id IS NOT NULL AND supply_id IS NULL)
    OR
    (item_type = 'supply' AND supply_id IS NOT NULL AND medicine_id IS NULL)
  )
) ENGINE=InnoDB;

CREATE INDEX idx_it_medicine ON inventory_transactions (medicine_id);
CREATE INDEX idx_it_supply   ON inventory_transactions (supply_id);
CREATE INDEX idx_it_type     ON inventory_transactions (transaction_type);
CREATE INDEX idx_it_date     ON inventory_transactions (transaction_date);


-- ============================================================================
-- 17. SYSTEM_SETTINGS
-- ============================================================================
CREATE TABLE system_settings (
  setting_id    INT AUTO_INCREMENT PRIMARY KEY,
  setting_name  VARCHAR(100) NOT NULL,
  setting_value TEXT NULL,
  updated_by    INT NULL,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_system_settings_name UNIQUE (setting_name),
  CONSTRAINT fk_system_settings_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;


SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- SEED DATA — lookup/reference tables only (no fake patients or visits).
-- These are the sample values already listed in the database plan.
-- ============================================================================

INSERT INTO patient_types (type_name, description) VALUES
  ('Student', 'Currently enrolled ISU student'),
  ('Faculty', 'Teaching staff / faculty member'),
  ('Non-Teaching Staff (NASA)', 'Non-academic staff personnel');

INSERT INTO dispositions (disposition_name, description) VALUES
  ('Sent Home', 'Patient was sent home to rest'),
  ('Back to School', 'Patient returned to class/work after treatment'),
  ('Hospital Admission', 'Patient was admitted to a hospital'),
  ('Referred to Doctor', 'Patient was referred to a doctor for further evaluation'),
  ('Observation', 'Patient is being kept for observation in the infirmary');

INSERT INTO special_case_types (case_name, description) VALUES
  ('PWD', 'Person with disability — priority handling'),
  ('Senior Citizen', 'Senior citizen — priority handling'),
  ('Anxiety', 'Patient has a history of anxiety'),
  ('Asthma', 'Patient has a history of asthma'),
  ('Other Special Case', 'Catch-all — specify details in the notes field');

INSERT INTO medicine_categories (category_name, description) VALUES
  ('Analgesic', 'Pain relievers'),
  ('Antibiotic', 'Antibacterial medicines'),
  ('Allergy', 'Antihistamines and allergy relief'),
  ('GI', 'Gastrointestinal / stomach relief'),
  ('Antiseptic', 'Wound cleaning and disinfecting'),
  ('Wound Care', 'Bandages, dressings, wound-care items'),
  ('Hydration', 'Oral rehydration and fluid replacement');

INSERT INTO medicines (medicine_name, category_id, unit, description) VALUES
  ('Paracetamol 500mg',   (SELECT category_id FROM medicine_categories WHERE category_name='Analgesic'),  'tablet',  'General pain and fever reliever'),
  ('Mefenamic Acid 500mg',(SELECT category_id FROM medicine_categories WHERE category_name='Analgesic'),  'tablet',  'Used for menstrual cramps and pain'),
  ('Amoxicillin 500mg',   (SELECT category_id FROM medicine_categories WHERE category_name='Antibiotic'), 'capsule', 'Broad-spectrum antibiotic'),
  ('Antacid (Kremil-S)',  (SELECT category_id FROM medicine_categories WHERE category_name='GI'),         'tablet',  'Relieves stomachache/acidity'),
  ('Cetirizine',          (SELECT category_id FROM medicine_categories WHERE category_name='Allergy'),    'tablet',  'Antihistamine for allergic reactions'),
  ('Betadine Solution',   (SELECT category_id FROM medicine_categories WHERE category_name='Antiseptic'), 'bottle',  'Wound cleaning antiseptic');

-- Give every seeded medicine an initial stock row so medicine_stock is
-- never left empty for a medicine that exists (matches the UNIQUE(medicine_id) rule).
INSERT INTO medicine_stock (medicine_id, quantity, reorder_level, stock_status)
SELECT medicine_id, 0, 20, 'out_of_stock' FROM medicines;

INSERT INTO supplies (supply_name, category, unit, description) VALUES
  ('Surgical Gloves (M)', 'PPE',        'pair', 'Medium-size surgical gloves'),
  ('Sterile Gauze Pads',  'Wound Care', 'pcs',  'Sterile gauze for wound dressing'),
  ('Elastic Bandage',     'Wound Care', 'roll', 'Elastic bandage roll');

INSERT INTO supply_stock (supply_id, quantity, reorder_level, stock_status)
SELECT supply_id, 0, 20, 'out_of_stock' FROM supplies;

INSERT INTO system_settings (setting_name, setting_value) VALUES
  ('soft_delete_days',        '90'),
  ('failed_login_limit',      '5'),
  ('password_symbol_required','1'),
  ('backup_schedule',         'daily_3am'),
  ('backup_retention',        '30'),
  ('maintenance_mode',        '0');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
