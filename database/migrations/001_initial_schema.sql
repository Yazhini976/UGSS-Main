-- ==========================================
-- USERS & AUTH
-- ==========================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(100),
    role VARCHAR(50) NOT NULL,
    mobile_number VARCHAR(20) UNIQUE NOT NULL,
    ward_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE otp_codes (
    id SERIAL PRIMARY KEY,
    mobile_number VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expiry TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- MASTER DATA: STATIONS & EQUIPMENT
-- ==========================================

CREATE TABLE stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    ward_number VARCHAR(50),
    capacity FLOAT,
    process_type VARCHAR(50)
);

CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES stations(id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    details JSONB
);

-- ==========================================
-- LIFTING STATION MODULE
-- ==========================================

CREATE TABLE lifting_daily_logs (
    id SERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES stations(id),
    operator_id INTEGER REFERENCES users(id),
    log_date DATE NOT NULL,
    shift_type VARCHAR(20),
    equipment_id INTEGER REFERENCES equipment(id),
    pump_status VARCHAR(20),
    hours_reading FLOAT,
    voltage FLOAT,
    current_reading FLOAT,
    vibration_issue BOOLEAN,
    noise_issue BOOLEAN,
    leakage_issue BOOLEAN,
    sump_level_status VARCHAR(20),
    panel_status VARCHAR(20),
    cleaning_done BOOLEAN,
    remark TEXT,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lifting_weekly_logs (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipment(id),
    operator_id INTEGER REFERENCES users(id),
    log_date DATE NOT NULL,
    lubrication_done BOOLEAN,
    belt_check_status VARCHAR(50),
    valve_status VARCHAR(50),
    panel_cleaned BOOLEAN,
    earthing_status VARCHAR(50),
    standby_pump_test BOOLEAN,
    minor_fault BOOLEAN,
    remark TEXT,
    photo_url TEXT
);

CREATE TABLE lifting_monthly_logs (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipment(id),
    operator_id INTEGER REFERENCES users(id),
    log_date DATE NOT NULL,
    insulation_test_status VARCHAR(50),
    bearing_condition VARCHAR(50),
    alignment_status VARCHAR(50),
    foundation_bolt_status VARCHAR(50),
    starter_panel_status VARCHAR(50),
    load_test_done BOOLEAN,
    energy_consumption FLOAT
);

CREATE TABLE lifting_yearly_logs (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipment(id),
    operator_id INTEGER REFERENCES users(id),
    log_date DATE NOT NULL,
    overhaul_done BOOLEAN,
    rewinding_done BOOLEAN,
    impeller_condition VARCHAR(50),
    seal_replaced BOOLEAN,
    calibration_done BOOLEAN,
    capacity_test_result VARCHAR(50),
    safety_audit_done BOOLEAN,
    third_party_inspection BOOLEAN,
    certificate_url TEXT
);

-- ==========================================
-- PUMPING STATION MODULE
-- ==========================================

CREATE TABLE pumping_daily_logs (
    id SERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES stations(id),
    operator_id INTEGER REFERENCES users(id),
    log_date DATE NOT NULL,
    shift_type VARCHAR(20),
    pumps_running_count INTEGER,
    inlet_level_status VARCHAR(50),
    outlet_pressure FLOAT,
    flow_rate FLOAT,
    voltage FLOAT,
    current_reading FLOAT,
    power_factor FLOAT,
    vibration_issue BOOLEAN,
    noise_issue BOOLEAN,
    leakage_issue BOOLEAN,
    panel_alarm_status VARCHAR(50),
    sump_cleanliness VARCHAR(50),
    screen_bar_cleaned BOOLEAN,
    remark TEXT,
    photo_url TEXT
);

CREATE TABLE pumping_weekly_logs (
    id SERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES stations(id),
    operator_id INTEGER REFERENCES users(id),
    log_date DATE,
    lubrication_done BOOLEAN,
    valve_check VARCHAR(50),
    standby_test BOOLEAN,
    panel_cleaned BOOLEAN,
    earthing_status VARCHAR(50),
    cable_condition VARCHAR(50),
    minor_fault BOOLEAN,
    remark TEXT,
    photo_url TEXT
);

CREATE TABLE pumping_monthly_logs (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipment(id),
    operator_id INTEGER REFERENCES users(id),
    log_date DATE,
    insulation_resistance FLOAT,
    bearing_condition VARCHAR(50),
    alignment_status VARCHAR(50),
    foundation_bolt_status VARCHAR(50),
    starter_test_status VARCHAR(50),
    load_test_done BOOLEAN,
    energy_consumption FLOAT,
    preventive_action TEXT,
    remark TEXT
);

CREATE TABLE pumping_yearly_logs (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipment(id),
    operator_id INTEGER REFERENCES users(id),
    log_date DATE,
    overhaul_done BOOLEAN,
    rewinding_done BOOLEAN,
    impeller_condition VARCHAR(50),
    seal_replaced BOOLEAN,
    calibration_done BOOLEAN,
    capacity_test_result VARCHAR(50),
    safety_audit_done BOOLEAN,
    inspection_flag BOOLEAN,
    remark TEXT
);

-- ==========================================
-- STP MODULE
-- ==========================================

CREATE TABLE stp_daily_logs (
    id SERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES stations(id),
    operator_id INTEGER REFERENCES users(id),
    log_date DATE NOT NULL,
    inlet_flow_rate FLOAT,
    inlet_ph FLOAT,
    inlet_bod FLOAT,
    inlet_cod FLOAT,
    inlet_tss FLOAT,
    inlet_oil_grease FLOAT,
    inlet_temp FLOAT,
    inlet_color_odour VARCHAR(50),
    do_level FLOAT,
    mlss FLOAT,
    mcrt FLOAT,
    sv30 FLOAT,
    fm_ratio FLOAT,
    blower_hours FLOAT,
    sludge_depth FLOAT,
    ras_flow FLOAT,
    was_flow FLOAT,
    scum_present BOOLEAN,
    outlet_flow_rate FLOAT,
    outlet_ph FLOAT,
    outlet_bod FLOAT,
    outlet_cod FLOAT,
    outlet_tss FLOAT,
    outlet_oil_grease FLOAT,
    outlet_fecal_coliform FLOAT,
    residual_chlorine FLOAT,
    sludge_generated FLOAT,
    sludge_dried FLOAT,
    moisture_content FLOAT,
    disposal_method VARCHAR(50),
    drying_bed_condition VARCHAR(50),
    power_kwh FLOAT,
    energy_per_mld FLOAT,
    chlorine_usage FLOAT,
    polymer_usage FLOAT,
    chemical_stock_status VARCHAR(50)
);

CREATE TABLE stp_maintenance_logs (
    id SERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES stations(id),
    operator_id INTEGER REFERENCES users(id),
    log_date DATE,
    type VARCHAR(20),
    blower_maint_done BOOLEAN,
    diffuser_cleaning_done BOOLEAN,
    clarifier_check VARCHAR(50),
    lab_calibrated BOOLEAN,
    analyzer_status VARCHAR(50)
);

-- ==========================================
-- FAULT & ESCALATION
-- ==========================================

CREATE TABLE faults (
    id SERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES stations(id),
    equipment_id INTEGER REFERENCES equipment(id),
    reported_by INTEGER REFERENCES users(id),
    report_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fault_type VARCHAR(50),
    severity VARCHAR(20),
    emergency_shutdown BOOLEAN,
    escalation_required BOOLEAN,
    escalated_to_role VARCHAR(50),
    escalation_reason TEXT,
    rectification_status VARCHAR(50) DEFAULT 'Pending',
    rectified_at TIMESTAMP,
    rectification_remark TEXT
);

-- ==========================================
-- CITIZEN COMPLAINT & FIELD APP
-- ==========================================

CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    citizen_user_id INTEGER REFERENCES users(id),
    citizen_name VARCHAR(100),
    citizen_role VARCHAR(50),
    ward_number VARCHAR(50),
    street_name VARCHAR(100),
    door_number VARCHAR(50),
    landmark VARCHAR(100),
    category VARCHAR(50),
    type VARCHAR(50),
    area_type VARCHAR(50),
    photo_url TEXT,
    audio_url TEXT,
    status VARCHAR(50) DEFAULT 'Submitted',
    assigned_to INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expected_resolution_at TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE TABLE complaint_feedback (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id),
    feedback_text TEXT,
    service_rating INT,
    work_quality_rating INT
);

CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id),
    staff_id INTEGER REFERENCES users(id),
    sla_deadline TIMESTAMP,
    work_type VARCHAR(50),
    expected_duration FLOAT,
    site_reach_time TIMESTAMP,
    checkin_photo_url TEXT,
    site_depart_time TIMESTAMP,
    status VARCHAR(50),
    action_taken TEXT,
    equipment_used TEXT,
    material_used TEXT,
    manpower_count INT,
    safety_gear_used BOOLEAN,
    hazard_detected VARCHAR(100),
    before_photo_url TEXT,
    after_photo_url TEXT,
    permanent_solution BOOLEAN,
    next_action TEXT
);

CREATE TABLE escalations (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id),
    work_order_id INTEGER REFERENCES work_orders(id),
    trigger_type VARCHAR(50),
    trigger_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(50),
    reason_type VARCHAR(50),
    officer_id INTEGER REFERENCES users(id),
    remarks TEXT
);

-- ==========================================
-- PROPERTY MASTER
-- ==========================================

CREATE TABLE property_master (
    id SERIAL PRIMARY KEY,
    door_no VARCHAR(50),
    street_name VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_complaints_ward ON complaints(ward_number);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned ON complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_work_orders_staff ON work_orders(staff_id);
CREATE INDEX IF NOT EXISTS idx_faults_station ON faults(station_id);
CREATE INDEX IF NOT EXISTS idx_stations_type ON stations(type);
