-- =========================================
-- USERS (100)
-- =========================================
INSERT INTO users (username, password_hash, full_name, role, mobile_number, ward_number)
SELECT 
    'user' || i,
    'hashed_password_' || i,
    'User ' || i,
    CASE 
        WHEN i % 5 = 0 THEN 'operator'
        WHEN i % 5 = 1 THEN 'field_staff'
        WHEN i % 5 = 2 THEN 'junior_engineer'
        WHEN i % 5 = 3 THEN 'assistant_engineer'
        ELSE 'citizen'
    END,
    '9000000' || LPAD(i::text, 3, '0'),
    (i % 42 + 1)::text
FROM generate_series(1, 100) AS s(i);

-- =========================================

-- STATIONS (8)
-- =========================================
INSERT INTO stations (name, type, ward_number, capacity, process_type) VALUES
('Kothankulam Road LS', 'lifting', '5', 10.5, 'SBR'),
('Samandhapuram LS', 'lifting', '12', 8.2, 'SBR'),
('Chandhoorani LS', 'lifting', '18', 12.0, 'SBR'),
('Thiruvananthapuram Street LS', 'lifting', '28', 15.5, 'SBR'),
('North Avarampatti PS', 'pumping', '8', 25.0, 'ASP'),
('Indira Nagar PS', 'pumping', '15', 30.0, 'ASP'),
('Konthankulam STP', 'stp', '10', 50.0, 'SBR'),
('South Zone STP', 'stp', '20', 40.0, 'SBR');

-- =========================================
-- EQUIPMENT (50)
-- =========================================
INSERT INTO equipment (station_id, name, type, details)
SELECT
    (i % 8) + 1,
    'Equipment ' || i,
    CASE 
        WHEN i % 3 = 0 THEN 'pump'
        WHEN i % 3 = 1 THEN 'motor'
        ELSE 'blower'
    END,
    jsonb_build_object('power_hp', (random()*50)::int, 'brand', 'Generic')
FROM generate_series(1, 50) AS s(i);

-- =========================================
-- COMPLAINTS (Guaranteed Coverage: 42 wards * 7 days = 294 + extras)
-- =========================================
INSERT INTO complaints (
    citizen_user_id, citizen_name, citizen_role, ward_number, street_name, door_number, landmark,
    category, type, area_type, photo_url, audio_url, status, assigned_to, created_at, expected_resolution_at
)
SELECT
    (ward * 2 + day_offset) % 100 + 1,
    'Citizen ' || (ward * 2 + day_offset),
    'citizen',
    ward::text,
    'Street ' || ward,
    'D-' || (ward * 10 + day_offset),
    'Near Landmark ' || (ward % 5 + 1),
    'UGSS',
    CASE 
        WHEN ward % 3 = 0 THEN 'Blockage'
        WHEN ward % 3 = 1 THEN 'Overflow'
        ELSE 'Leakage'
    END,
    'Residential',
    'https://example.com/photo' || ward || '_' || day_offset || '.jpg',
    NULL,
    CASE 
        WHEN day_offset % 4 = 0 THEN 'Resolved'
        WHEN day_offset % 4 = 1 THEN 'In Progress'
        WHEN day_offset % 4 = 2 THEN 'Assigned'
        ELSE 'Submitted'
    END,
    (ward % 8) + 1,
    NOW() - (day_offset || ' days')::interval,
    NOW() - (day_offset || ' days')::interval + INTERVAL '2 days'
FROM generate_series(0, 6) AS day_offset
CROSS JOIN generate_series(1, 42) AS ward;

-- Add some random bulk data on top
INSERT INTO complaints (
    citizen_user_id, citizen_name, citizen_role, ward_number, street_name, door_number, landmark,
    category, type, area_type, photo_url, audio_url, status, assigned_to, created_at, expected_resolution_at
)
SELECT
    (i % 100) + 1,
    'Citizen ' || i,
    'citizen',
    (i % 42 + 1)::text,
    'Street ' || (i % 20 + 1),
    'D-' || i,
    'Near Landmark ' || (i % 5 + 1),
    'UGSS',
    'Blockage',
    'Residential',
    'https://example.com/bulk_' || i || '.jpg',
    NULL,
    'Submitted',
    (i % 8) + 1,
    NOW() - ((i % 7) || ' days')::interval,
    NOW() - ((i % 7) || ' days')::interval + INTERVAL '2 days'
FROM generate_series(1001, 1500) AS i;

-- =========================================
-- WORK ORDERS (Matched to complaints)
-- =========================================
INSERT INTO work_orders (
    complaint_id, staff_id, sla_deadline, work_type, expected_duration,
    status, action_taken, manpower_count, safety_gear_used
)
SELECT
    id,
    (id % 8) + 1,
    NOW() + INTERVAL '2 days',
    'Repair',
    (random() * 5 + 1),
    CASE 
        WHEN id % 2 = 0 THEN 'Completed'
        ELSE 'WIP'
    END,
    'Cleared blockage and cleaned line',
    (id % 5) + 1,
    true
FROM complaints;

-- =========================================
-- FAULTS (1000)
-- =========================================
INSERT INTO faults (
    station_id, equipment_id, reported_by, fault_type, severity,
    emergency_shutdown, escalation_required, escalated_to_role, rectification_status, report_time
)
SELECT
    (i % 8) + 1,
    (i % 50) + 1,
    (i % 100) + 1,
    CASE 
        WHEN i % 3 = 0 THEN 'Electrical'
        WHEN i % 3 = 1 THEN 'Mechanical'
        ELSE 'Civil'
    END,
    CASE 
        WHEN i % 3 = 0 THEN 'High'
        WHEN i % 3 = 1 THEN 'Medium'
        ELSE 'Low'
    END,
    false,
    true,
    'junior_engineer',
    CASE 
        WHEN i % 2 = 0 THEN 'Completed'
        ELSE 'Pending'
    END,
    NOW() - ((i % 7) || ' days')::interval
FROM generate_series(1, 1000) AS s(i);

-- =========================================
-- DAILY LOGS (Last 7 Days for all 8 stations)
-- =========================================

-- Lifting Logs
INSERT INTO lifting_daily_logs (
    station_id, operator_id, log_date, shift_type, equipment_id, pump_status,
    hours_reading, voltage, current_reading, vibration_issue, noise_issue,
    leakage_issue, sump_level_status, panel_status, cleaning_done, remark
)
SELECT 
    s.id,
    (s.id % 5) + 1,
    d.date,
    'Morning',
    (s.id * 5) % 50 + 1,
    'Running',
    12.5, 415.0, 15.2, false, false, false, 'Normal', 'Good', true, 'Normal operation'
FROM stations s
CROSS JOIN (SELECT CURRENT_DATE - i AS date FROM generate_series(0, 6) AS i) d
WHERE s.type = 'lifting';

-- Pumping Logs
INSERT INTO pumping_daily_logs (
    station_id, operator_id, log_date, shift_type, pumps_running_count,
    inlet_level_status, outlet_pressure, flow_rate, voltage, current_reading,
    power_factor, vibration_issue, noise_issue, leakage_issue, panel_alarm_status,
    sump_cleanliness, screen_bar_cleaned, remark
)
SELECT 
    s.id,
    (s.id % 5) + 1,
    d.date,
    'Evening',
    2,
    'Normal', 4.5, 120.0, 410.0, 45.5, 0.92, false, false, false, 'None', 'Clean', true, 'Pumping stable'
FROM stations s
CROSS JOIN (SELECT CURRENT_DATE - i AS date FROM generate_series(0, 6) AS i) d
WHERE s.type = 'pumping';

-- STP Logs
INSERT INTO stp_daily_logs (
    station_id, operator_id, log_date, inlet_flow_rate, inlet_ph, inlet_bod,
    outlet_flow_rate, outlet_ph, outlet_bod, power_kwh, chemical_stock_status
)
SELECT 
    s.id,
    (s.id % 5) + 1,
    d.date,
    12.5, 7.2, 210.0, 11.8, 7.0, 15.0, 450.0, 'Sufficient'
FROM stations s
CROSS JOIN (SELECT CURRENT_DATE - i AS date FROM generate_series(0, 6) AS i) d
WHERE s.type = 'stp';

