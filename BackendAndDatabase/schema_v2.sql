-- ============================================================================
-- ISU INFIRMARY LOG BOOK SYSTEM
-- schema_v2.sql  —  complete schema, 22 tables
--
-- Isabela State University · University Health Service
-- Target : MySQL 8.0.16+   (generated columns + CHECK constraints required)
-- Engine : InnoDB · utf8mb4_unicode_ci
--
-- This is a FRESH INSTALL file. It drops and recreates everything.
-- Supersedes isu_infirmary_schema.sql (v1, 17 tables).
-- See ISU_Infirmary_Database_Plan_v2.md for the reasoning behind each table.
--
-- Run:
--   mysql -u root -p < schema_v2.sql
--
-- Table order below is dependency order — parents before children.
-- ============================================================================

DROP DATABASE IF EXISTS isu_infirmary;
CREATE DATABASE isu_infirmary
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE isu_infirmary;

SET NAMES utf8mb4;


-- ============================================================================
-- SECTION 1 — ACCOUNTS & SECURITY
-- ============================================================================

-- 1. USERS
-- Admin and Nurse/Staff only. Patients never authenticate.
CREATE TABLE users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  first_name    VARCHAR(100) NOT NULL,
  middle_name   VARCHAR(100) NULL,
  last_name     VARCHAR(100) NOT NULL,
  username      VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL COMMENT 'bcrypt or argon2 — never plaintext',
  role          ENUM('admin','nurse') NOT NULL,
  email         VARCHAR(150) NULL,
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME NULL COMMENT 'Soft delete — purged after system_settings.soft_delete_days',
  CONSTRAINT uq_users_username UNIQUE (username),
  CONSTRAINT uq_users_email    UNIQUE (email)
) ENGINE=InnoDB;

CREATE INDEX idx_users_role    ON users (role);
CREATE INDEX idx_users_status  ON users (status);
CREATE INDEX idx_users_deleted ON users (deleted_at);


-- 2. LOGIN_ATTEMPTS
-- Backs the account lockout rule in system_settings.
CREATE TABLE login_attempts (
  attempt_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
  username     VARCHAR(50) NOT NULL COMMENT 'Recorded even when no such user exists, to catch probing',
  user_id      INT NULL,
  ip_address   VARCHAR(45) NULL COMMENT 'IPv6-safe length',
  successful   BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_login_attempts_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_login_attempts_lookup ON login_attempts (username, attempted_at);
CREATE INDEX idx_login_attempts_user   ON login_attempts (user_id, attempted_at);


-- ============================================================================
-- SECTION 2 — PEOPLE
-- ============================================================================

-- 3. PATIENT_TYPES
CREATE TABLE patient_types (
  patient_type_id INT AUTO_INCREMENT PRIMARY KEY,
  type_name       VARCHAR(50)  NOT NULL,
  description     VARCHAR(255) NULL,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_patient_types_name UNIQUE (type_name)
) ENGINE=InnoDB;


-- 4. PATIENTS
-- Permanent details. One patient has many visits.
CREATE TABLE patients (
  patient_id      INT AUTO_INCREMENT PRIMARY KEY,
  patient_number  VARCHAR(50)  NULL COMMENT 'Student/employee number. Visitors get VIS-YYYY-NNNN',
  first_name      VARCHAR(100) NOT NULL,
  middle_name     VARCHAR(100) NULL,
  last_name       VARCHAR(100) NOT NULL,
  sex             VARCHAR(30)  NULL,
  date_of_birth   DATE NULL COMMENT 'Age is derived, never stored',
  civil_status    VARCHAR(30)  NULL COMMENT 'Printed on the Medical Certificate',
  contact_number  VARCHAR(30)  NULL,
  patient_type_id INT NULL,
  department      VARCHAR(150) NULL COMMENT 'Students and Faculty/NASA only',
  program         VARCHAR(150) NULL,
  year_level      VARCHAR(50)  NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME NULL,
  CONSTRAINT uq_patients_number UNIQUE (patient_number),
  CONSTRAINT fk_patients_type
    FOREIGN KEY (patient_type_id) REFERENCES patient_types(patient_type_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_patients_name    ON patients (last_name, first_name);
CREATE INDEX idx_patients_number  ON patients (patient_number);
CREATE INDEX idx_patients_type    ON patients (patient_type_id);
CREATE INDEX idx_patients_deleted ON patients (deleted_at);


-- ============================================================================
-- SECTION 3 — CLINICAL
-- ============================================================================

-- 5. COMPLAINTS
-- Controlled vocabulary. Every figure on the Insights screen counts these,
-- which is impossible against free text.
CREATE TABLE complaints (
  complaint_id   INT AUTO_INCREMENT PRIMARY KEY,
  complaint_name VARCHAR(100) NOT NULL,
  description    VARCHAR(255) NULL,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_complaints_name UNIQUE (complaint_name)
) ENGINE=InnoDB;


-- 6. DISPOSITIONS
CREATE TABLE dispositions (
  disposition_id   INT AUTO_INCREMENT PRIMARY KEY,
  disposition_name VARCHAR(100) NOT NULL,
  description      VARCHAR(255) NULL,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_dispositions_name UNIQUE (disposition_name)
) ENGINE=InnoDB;


-- 7. VISITS
-- One clinic encounter, arrival to sign-out.
--   status      = where the visit is in the workflow
--   disposition = how it ended
-- These are separate on purpose. v1 had 'referred' in both.
CREATE TABLE visits (
  visit_id          INT AUTO_INCREMENT PRIMARY KEY,
  patient_id        INT NOT NULL,
  attending_user_id INT NULL,
  chief_complaint   TEXT NOT NULL COMMENT 'The nurse''s own wording. Structured tags live in visit_complaints',
  management        TEXT NULL COMMENT 'What was done or advised',
  treatment_notes   TEXT NULL,
  blood_pressure    VARCHAR(20)  NULL,
  temperature       DECIMAL(4,1) NULL,
  pulse_rate        INT UNSIGNED NULL,
  disposition_id    INT NULL,
  started_at        DATETIME NOT NULL COMMENT 'Full timestamp — a visit can cross midnight',
  ended_at          DATETIME NULL,
  status            ENUM('waiting','in_care','completed','cancelled') NOT NULL DEFAULT 'waiting',
  created_by        INT NULL,
  updated_by        INT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        DATETIME NULL,
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
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_visits_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_visits_times CHECK (ended_at IS NULL OR ended_at >= started_at)
) ENGINE=InnoDB;

CREATE INDEX idx_visits_patient_started ON visits (patient_id, started_at);
CREATE INDEX idx_visits_started         ON visits (started_at);
CREATE INDEX idx_visits_status          ON visits (status);
CREATE INDEX idx_visits_attending       ON visits (attending_user_id);
CREATE INDEX idx_visits_deleted         ON visits (deleted_at);


-- 8. VISIT_COMPLAINTS
-- One visit may record several complaints. This is the table the association
-- mining runs on — co-occurrence needs two rows for one visit.
CREATE TABLE visit_complaints (
  visit_complaint_id INT AUTO_INCREMENT PRIMARY KEY,
  visit_id     INT NOT NULL,
  complaint_id INT NOT NULL,
  is_primary   BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_visit_complaints UNIQUE (visit_id, complaint_id),
  CONSTRAINT fk_vc_visit
    FOREIGN KEY (visit_id) REFERENCES visits(visit_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_vc_complaint
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_vc_complaint ON visit_complaints (complaint_id);


-- 9. SPECIAL_CASE_TYPES
-- Never add is_pwd / is_senior / is_asthma columns anywhere. A new case type
-- must be an INSERT here, not a schema change.
CREATE TABLE special_case_types (
  special_case_type_id INT AUTO_INCREMENT PRIMARY KEY,
  case_name            VARCHAR(100) NOT NULL,
  description          VARCHAR(255) NULL,
  active               BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_special_case_types_name UNIQUE (case_name)
) ENGINE=InnoDB;


-- 10. PATIENT_SPECIAL_CASES
-- Keyed to the PATIENT so a flag shows on every future visit.
-- origin_visit_id keeps the audit trail of where it was first noticed.
--
-- active_type_key is a generated column holding the type id while the flag is
-- active and NULL once retired. MySQL has no partial indexes, and NULLs do not
-- collide in a UNIQUE index — so this allows exactly one live flag per type
-- per patient, with unlimited retired history.
CREATE TABLE patient_special_cases (
  patient_special_case_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id           INT NOT NULL,
  special_case_type_id INT NOT NULL,
  origin_visit_id      INT NULL,
  notes                TEXT NULL,
  flagged_by           INT NULL,
  flagged_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  active               BOOLEAN NOT NULL DEFAULT TRUE,
  active_type_key      INT AS (IF(active, special_case_type_id, NULL)) STORED,
  CONSTRAINT uq_psc_active UNIQUE (patient_id, active_type_key),
  CONSTRAINT fk_psc_patient
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_psc_type
    FOREIGN KEY (special_case_type_id) REFERENCES special_case_types(special_case_type_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_psc_origin_visit
    FOREIGN KEY (origin_visit_id) REFERENCES visits(visit_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_psc_flagged_by
    FOREIGN KEY (flagged_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_psc_patient ON patient_special_cases (patient_id, active);
CREATE INDEX idx_psc_type    ON patient_special_cases (special_case_type_id);


-- ============================================================================
-- SECTION 4 — CATALOG
-- ============================================================================

-- 11. ITEM_CATEGORIES
-- One taxonomy for both medicines and supplies.
CREATE TABLE item_categories (
  category_id   INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  applies_to    ENUM('medicine','supply','both') NOT NULL DEFAULT 'medicine',
  description   VARCHAR(255) NULL,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_item_categories_name UNIQUE (category_name)
) ENGINE=InnoDB;


-- 12. MEDICINES  — what exists, not how much is on hand
CREATE TABLE medicines (
  medicine_id   INT AUTO_INCREMENT PRIMARY KEY,
  medicine_name VARCHAR(150) NOT NULL,
  category_id   INT NULL,
  unit          VARCHAR(50)  NOT NULL COMMENT 'tablet, capsule, bottle, sachet',
  description   VARCHAR(255) NULL,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME NULL,
  CONSTRAINT uq_medicines_name UNIQUE (medicine_name),
  CONSTRAINT fk_medicines_category
    FOREIGN KEY (category_id) REFERENCES item_categories(category_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_medicines_category ON medicines (category_id);


-- 13. SUPPLIES
CREATE TABLE supplies (
  supply_id   INT AUTO_INCREMENT PRIMARY KEY,
  supply_name VARCHAR(150) NOT NULL,
  category_id INT NULL,
  unit        VARCHAR(50)  NOT NULL COMMENT 'pcs, pair, roll, box',
  description VARCHAR(255) NULL,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME NULL,
  CONSTRAINT uq_supplies_name UNIQUE (supply_name),
  CONSTRAINT fk_supplies_category
    FOREIGN KEY (category_id) REFERENCES item_categories(category_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_supplies_category ON supplies (category_id);


-- ============================================================================
-- SECTION 5 — STOCK
-- stock_status is GENERATED. It can never disagree with quantity, and it is
-- still indexable. Do not write to it.
-- ============================================================================

-- 14. MEDICINE_STOCK
CREATE TABLE medicine_stock (
  stock_id      INT AUTO_INCREMENT PRIMARY KEY,
  medicine_id   INT NOT NULL,
  quantity      DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Running total. inventory_transactions is the source of truth',
  reorder_level DECIMAL(10,2) NOT NULL DEFAULT 0,
  expiry_date   DATE NULL,
  stock_status  ENUM('high','low','out_of_stock')
                  AS (CASE WHEN quantity <= 0            THEN 'out_of_stock'
                           WHEN quantity <= reorder_level THEN 'low'
                           ELSE 'high' END) STORED,
  updated_by    INT NULL,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_medicine_stock_medicine UNIQUE (medicine_id),
  CONSTRAINT fk_medicine_stock_medicine
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_medicine_stock_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_medicine_stock_qty CHECK (quantity >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_medicine_stock_status ON medicine_stock (stock_status);
CREATE INDEX idx_medicine_stock_expiry ON medicine_stock (expiry_date);


-- 15. SUPPLY_STOCK
CREATE TABLE supply_stock (
  supply_stock_id INT AUTO_INCREMENT PRIMARY KEY,
  supply_id       INT NOT NULL,
  quantity        DECIMAL(10,2) NOT NULL DEFAULT 0,
  reorder_level   DECIMAL(10,2) NOT NULL DEFAULT 0,
  expiry_date     DATE NULL,
  stock_status    ENUM('high','low','out_of_stock')
                    AS (CASE WHEN quantity <= 0            THEN 'out_of_stock'
                             WHEN quantity <= reorder_level THEN 'low'
                             ELSE 'high' END) STORED,
  updated_by      INT NULL,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_supply_stock_supply UNIQUE (supply_id),
  CONSTRAINT fk_supply_stock_supply
    FOREIGN KEY (supply_id) REFERENCES supplies(supply_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_supply_stock_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_supply_stock_qty CHECK (quantity >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_supply_stock_status ON supply_stock (stock_status);
CREATE INDEX idx_supply_stock_expiry ON supply_stock (expiry_date);


-- ============================================================================
-- SECTION 6 — CONSUMPTION
-- ============================================================================

-- 16. VISIT_MEDICINES
CREATE TABLE visit_medicines (
  visit_medicine_id INT AUTO_INCREMENT PRIMARY KEY,
  visit_id       INT NOT NULL,
  medicine_id    INT NOT NULL,
  quantity_given DECIMAL(10,2) NOT NULL,
  dosage         VARCHAR(100) NULL,
  instructions   VARCHAR(255) NULL,
  given_by       INT NULL,
  given_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vm_visit
    FOREIGN KEY (visit_id) REFERENCES visits(visit_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_vm_medicine
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_vm_given_by
    FOREIGN KEY (given_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_vm_qty CHECK (quantity_given > 0)
) ENGINE=InnoDB;

CREATE INDEX idx_vm_visit    ON visit_medicines (visit_id);
CREATE INDEX idx_vm_medicine ON visit_medicines (medicine_id);


-- 17. VISIT_SUPPLIES
-- Closes the loop: supplies can be consumed, not only stocked.
CREATE TABLE visit_supplies (
  visit_supply_id INT AUTO_INCREMENT PRIMARY KEY,
  visit_id      INT NOT NULL,
  supply_id     INT NOT NULL,
  quantity_used DECIMAL(10,2) NOT NULL,
  remarks       VARCHAR(255) NULL,
  given_by      INT NULL,
  given_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vs_visit
    FOREIGN KEY (visit_id) REFERENCES visits(visit_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_vs_supply
    FOREIGN KEY (supply_id) REFERENCES supplies(supply_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_vs_given_by
    FOREIGN KEY (given_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_vs_qty CHECK (quantity_used > 0)
) ENGINE=InnoDB;

CREATE INDEX idx_vs_visit  ON visit_supplies (visit_id);
CREATE INDEX idx_vs_supply ON visit_supplies (supply_id);


-- ============================================================================
-- SECTION 7 — REQUISITION
-- ============================================================================

-- 18. STOCK_REQUESTS
-- draft -> pending -> approved/denied -> completed
CREATE TABLE stock_requests (
  request_id     INT AUTO_INCREMENT PRIMARY KEY,
  requested_by   INT NOT NULL,
  request_date   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status         ENUM('draft','pending','approved','denied','completed') NOT NULL DEFAULT 'pending',
  approved_by    INT NULL,
  approved_at    DATETIME NULL,
  received_by    INT NULL COMMENT 'Clinic staff who confirmed the delivery',
  received_at    DATETIME NULL,
  admin_response TEXT NULL,
  remarks        TEXT NULL,
  CONSTRAINT fk_sr_requested_by
    FOREIGN KEY (requested_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_sr_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_sr_received_by
    FOREIGN KEY (received_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_sr_status ON stock_requests (status);
CREATE INDEX idx_sr_date   ON stock_requests (request_date);


-- 19. STOCK_REQUEST_ITEMS
-- requested_quantity and approved_quantity stay separate — Admin may approve less.
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
  CONSTRAINT chk_sri_item_type CHECK (
    (item_type = 'medicine' AND medicine_id IS NOT NULL AND supply_id   IS NULL)
    OR
    (item_type = 'supply'   AND supply_id   IS NOT NULL AND medicine_id IS NULL)
  ),
  CONSTRAINT chk_sri_qty CHECK (requested_quantity > 0)
) ENGINE=InnoDB;

CREATE INDEX idx_sri_request  ON stock_request_items (request_id);
CREATE INDEX idx_sri_medicine ON stock_request_items (medicine_id);
CREATE INDEX idx_sri_supply   ON stock_request_items (supply_id);


-- ============================================================================
-- SECTION 8 — AUDIT
-- ============================================================================

-- 20. INVENTORY_TRANSACTIONS
-- Append-only. Never UPDATE or DELETE a row here — correct a mistake by
-- writing an 'adjustment' row. quantity is signed: negative out, positive in.
CREATE TABLE inventory_transactions (
  transaction_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
  item_type        ENUM('medicine','supply') NOT NULL,
  medicine_id      INT NULL,
  supply_id        INT NULL,
  transaction_type ENUM('released','restocked','adjustment','expired','damaged') NOT NULL,
  quantity         DECIMAL(10,2) NOT NULL COMMENT 'Signed: negative out, positive in',
  reference_type   ENUM('visit','stock_request','manual') NULL,
  reference_id     INT NULL,
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
    (item_type = 'medicine' AND medicine_id IS NOT NULL AND supply_id   IS NULL)
    OR
    (item_type = 'supply'   AND supply_id   IS NOT NULL AND medicine_id IS NULL)
  )
) ENGINE=InnoDB;

CREATE INDEX idx_it_medicine  ON inventory_transactions (medicine_id);
CREATE INDEX idx_it_supply    ON inventory_transactions (supply_id);
CREATE INDEX idx_it_type      ON inventory_transactions (transaction_type);
CREATE INDEX idx_it_date      ON inventory_transactions (transaction_date);
CREATE INDEX idx_it_reference ON inventory_transactions (reference_type, reference_id);


-- 21. ACTIVITY_LOG
-- Backs the audit table on the System Settings screen.
CREATE TABLE activity_log (
  log_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NULL,
  action      VARCHAR(150) NOT NULL,
  entity_type VARCHAR(50)  NULL,
  entity_id   INT NULL,
  detail      TEXT NULL,
  log_type    ENUM('account','record','inventory','security','backup') NOT NULL DEFAULT 'record',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_log_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_activity_created ON activity_log (created_at);
CREATE INDEX idx_activity_type    ON activity_log (log_type, created_at);
CREATE INDEX idx_activity_entity  ON activity_log (entity_type, entity_id);


-- 22. SYSTEM_SETTINGS
CREATE TABLE system_settings (
  setting_id    INT AUTO_INCREMENT PRIMARY KEY,
  setting_name  VARCHAR(100) NOT NULL,
  setting_value TEXT NULL,
  value_type    ENUM('int','bool','string','json') NOT NULL DEFAULT 'string',
  description   VARCHAR(255) NULL,
  updated_by    INT NULL,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_system_settings_name UNIQUE (setting_name),
  CONSTRAINT fk_system_settings_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;


-- ============================================================================
-- SEED DATA — lookup tables only. No fake patients, no fake visits.
-- ============================================================================

INSERT INTO patient_types (type_name, description) VALUES
  ('Student',                   'Currently enrolled ISU student'),
  ('Faculty',                   'Teaching staff / faculty member'),
  ('Non-Teaching Staff (NASA)', 'Non-academic staff personnel'),
  ('Visitor',                   'Walk-in guest, parent or campus visitor with no ISU ID number');

INSERT INTO complaints (complaint_name, description) VALUES
  ('Tension Headache',        'Headache, migraine, head pain'),
  ('Dysmenorrhea',            'Menstrual cramps'),
  ('Viral Flu',               'Influenza-like illness'),
  ('Fever',                   'Elevated body temperature'),
  ('Cough / Colds',           'Upper respiratory symptoms'),
  ('Wound / Abrasion',        'Cuts, scrapes, lacerations'),
  ('Stomach Pain',            'Abdominal pain, hyperacidity'),
  ('Dizziness',               'Lightheadedness, vertigo, near-fainting'),
  ('Allergic Reaction',       'Rash, hives, allergic response'),
  ('Elevated Blood Pressure', 'High BP reading on examination'),
  ('Other',                   'Not covered by the list — see visit notes');

INSERT INTO dispositions (disposition_name, description) VALUES
  ('Back to Class/Work', 'Patient returned to class or work after treatment'),
  ('Sent Home',          'Patient was sent home to rest'),
  ('Observation',        'Patient kept for observation in the infirmary'),
  ('Referred to Doctor', 'Patient referred to a doctor for further evaluation'),
  ('Hospital Admission', 'Patient was admitted to a hospital');

INSERT INTO special_case_types (case_name, description) VALUES
  ('PWD',                'Person with disability — priority handling'),
  ('Senior Citizen',     'Senior citizen — priority handling'),
  ('Allergy',            'Known allergy — record the allergen in notes'),
  ('Anxiety',            'History of anxiety or panic episodes'),
  ('Asthma',             'History of asthma'),
  ('Hypertension',       'History of high blood pressure — check BP every visit'),
  ('Other Special Case', 'Catch-all — specify details in the notes field');

INSERT INTO item_categories (category_name, applies_to, description) VALUES
  ('Analgesic / Antipyretic', 'medicine', 'Pain and fever relief'),
  ('Antibiotic',              'medicine', 'Antibacterial medicines'),
  ('Antihistamine / Allergy', 'medicine', 'Allergy relief'),
  ('Gastrointestinal',        'medicine', 'Stomach and digestive relief'),
  ('Hydration',               'medicine', 'Oral rehydration and fluid replacement'),
  ('Antiseptic',              'both',     'Wound cleaning and disinfecting'),
  ('Wound Care',              'supply',   'Gauze, bandages, dressings'),
  ('PPE',                     'supply',   'Gloves, masks, protective equipment');

INSERT INTO medicines (medicine_name, category_id, unit, description) VALUES
  ('Paracetamol 500mg',    (SELECT category_id FROM item_categories WHERE category_name='Analgesic / Antipyretic'), 'tablet',  'General pain and fever reliever'),
  ('Mefenamic Acid 500mg', (SELECT category_id FROM item_categories WHERE category_name='Analgesic / Antipyretic'), 'tablet',  'Menstrual cramps and pain'),
  ('Amoxicillin 500mg',    (SELECT category_id FROM item_categories WHERE category_name='Antibiotic'),              'capsule', 'Broad-spectrum antibiotic'),
  ('Cetirizine 10mg',      (SELECT category_id FROM item_categories WHERE category_name='Antihistamine / Allergy'), 'tablet',  'Antihistamine for allergic reactions'),
  ('Antacid (Kremil-S)',   (SELECT category_id FROM item_categories WHERE category_name='Gastrointestinal'),        'tablet',  'Relieves stomachache and acidity'),
  ('Oral Rehydration Salts',(SELECT category_id FROM item_categories WHERE category_name='Hydration'),              'sachet',  'Fluid and electrolyte replacement'),
  ('Betadine Solution',    (SELECT category_id FROM item_categories WHERE category_name='Antiseptic'),              'bottle',  'Wound cleaning antiseptic');

INSERT INTO supplies (supply_name, category_id, unit, description) VALUES
  ('Sterile Gauze 4x4',      (SELECT category_id FROM item_categories WHERE category_name='Wound Care'), 'pcs',  'Sterile gauze for wound dressing'),
  ('Elastic Bandage 3-inch', (SELECT category_id FROM item_categories WHERE category_name='Wound Care'), 'roll', 'Elastic bandage roll'),
  ('Surgical Gloves (M)',    (SELECT category_id FROM item_categories WHERE category_name='PPE'),        'pair', 'Medium-size surgical gloves');

-- every catalog item gets a stock row so the UNIQUE rule is never violated later
INSERT INTO medicine_stock (medicine_id, quantity, reorder_level)
SELECT medicine_id, 0, 20 FROM medicines;

INSERT INTO supply_stock (supply_id, quantity, reorder_level)
SELECT supply_id, 0, 20 FROM supplies;

INSERT INTO system_settings (setting_name, setting_value, value_type, description) VALUES
  ('soft_delete_days',         '90',           'int',    'Days a soft-deleted record stays recoverable'),
  ('failed_login_limit',       '5',            'int',    'Failed sign-ins before the account locks'),
  ('lockout_minutes',          '15',           'int',    'How long an account stays locked'),
  ('min_password_length',      '8',            'int',    'Minimum password length'),
  ('password_symbol_required', '1',            'bool',   'Require at least one special character'),
  ('password_reset_email',     '1',            'bool',   'Allow password reset by email link'),
  ('backup_schedule',          'daily_12am',   'string', 'Automated backup schedule'),
  ('backup_retention',         '30',           'int',    'Days to keep automated backups'),
  ('maintenance_mode',         '0',            'bool',   'Block sign-in while maintenance is running'),
  ('clinic_timezone',          'Asia/Manila',  'string', 'Display timezone — storage is always UTC');


-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT COUNT(*) AS table_count
  FROM information_schema.TABLES
 WHERE TABLE_SCHEMA = 'isu_infirmary' AND TABLE_TYPE = 'BASE TABLE';   -- expect 22

SELECT 'patient_types'      AS seed, COUNT(*) AS rows_seeded FROM patient_types
UNION ALL SELECT 'complaints',            COUNT(*) FROM complaints
UNION ALL SELECT 'dispositions',          COUNT(*) FROM dispositions
UNION ALL SELECT 'special_case_types',    COUNT(*) FROM special_case_types
UNION ALL SELECT 'item_categories',       COUNT(*) FROM item_categories
UNION ALL SELECT 'medicines',             COUNT(*) FROM medicines
UNION ALL SELECT 'supplies',              COUNT(*) FROM supplies
UNION ALL SELECT 'medicine_stock',        COUNT(*) FROM medicine_stock
UNION ALL SELECT 'supply_stock',          COUNT(*) FROM supply_stock
UNION ALL SELECT 'system_settings',       COUNT(*) FROM system_settings;

-- generated column check — every row should read 'out_of_stock' at quantity 0
SELECT m.medicine_name, s.quantity, s.reorder_level, s.stock_status
  FROM medicine_stock s
  JOIN medicines m ON m.medicine_id = s.medicine_id
 ORDER BY m.medicine_name;

-- ============================================================================
-- NEXT STEPS
--   1. Create the first admin account (hash the password in Python, never here)
--   2. Set real reorder_level values per item
--   3. Bulk-import the Faculty/NASA roster into patients
-- ============================================================================
