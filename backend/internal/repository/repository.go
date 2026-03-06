package repository

import (
	"database/sql"
	"fmt"
	"time"
	"ugss-command-center-backend/internal/models"
)

// ==========================================
// USER REPOSITORY
// ==========================================

func GetUserByMobile(db *sql.DB, mobile string) (*models.User, error) {
	var user models.User
	var phone string
	err := db.QueryRow(`
		SELECT id::text, phone_number, role, created_at 
		FROM users WHERE phone_number = $1
	`, mobile).Scan(&user.ID, &phone, &user.Role, &user.CreatedAt)

	if err != nil {
		return nil, err
	}
	user.Username = &phone
	user.FullName = &phone
	user.MobileNumber = phone
	return &user, nil
}

func GetUsersByRole(db *sql.DB, role string) ([]models.User, error) {
	rows, err := db.Query(`
		SELECT id::text, phone_number, role, created_at 
		FROM users WHERE role = $1
	`, role)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		var phone string
		if err := rows.Scan(&u.ID, &phone, &u.Role, &u.CreatedAt); err != nil {
			return nil, err
		}
		u.Username = &phone
		u.FullName = &phone
		u.MobileNumber = phone
		users = append(users, u)
	}
	return users, nil
}

func GetOfficerStats(db *sql.DB) ([]models.OfficerStats, error) {
	// ID mapping as confirmed from database:
	// Officer 1: da0be945-6d0b-4733-99eb-2eeace7d7f68 (Wards 1-10)
	// Officer 2: a69651a7-c2a2-48bc-9df2-025ec007cb56 (Wards 11-20)
	// Officer 3: aa1ebc25-5b07-4145-9687-56cfe92228e8 (Wards 21-30)
	// Officer 4: a7f9568c-3e6f-4763-87dc-3b6fd5660cc6 (Wards 31-42)

	query := `
		SELECT 
			CASE 
				WHEN ward BETWEEN 1 AND 10 THEN 'da0be945-6d0b-4733-99eb-2eeace7d7f68'
				WHEN ward BETWEEN 11 AND 20 THEN 'a69651a7-c2a2-48bc-9df2-025ec007cb56'
				WHEN ward BETWEEN 21 AND 30 THEN 'aa1ebc25-5b07-4145-9687-56cfe92228e8'
				WHEN ward BETWEEN 31 AND 45 THEN 'a7f9568c-3e6f-4763-87dc-3b6fd5660cc6'
				ELSE 'other'
			END as staff_id,
			COUNT(*) as total,
			SUM(CASE WHEN status IN ('COMPLETED', 'RESOLVED') THEN 1 ELSE 0 END) as resolved
		FROM complaints
		GROUP BY staff_id
	`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []models.OfficerStats
	for rows.Next() {
		var s models.OfficerStats
		var staffID string
		var total, resolved int
		if err := rows.Scan(&staffID, &total, &resolved); err != nil {
			return nil, err
		}
		if staffID == "other" {
			continue
		}
		s.ID = staffID
		s.TotalAssigned = total
		s.Resolved = resolved
		if total > 0 {
			s.SLACompliancePercent = float64(resolved) / float64(total) * 100
		} else {
			s.SLACompliancePercent = 100
		}
		s.Score = s.SLACompliancePercent // Mock score based on compliance
		stats = append(stats, s)
	}
	return stats, nil
}

func GetAllStations(db *sql.DB) ([]models.Station, error) {
	rows, err := db.Query(`SELECT id, name, type, ward_number, capacity, process_type FROM stations`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stations []models.Station
	for rows.Next() {
		var s models.Station
		if err := rows.Scan(&s.ID, &s.Name, &s.Type, &s.WardNumber, &s.Capacity, &s.ProcessType); err != nil {
			return nil, err
		}
		stations = append(stations, s)
	}
	return stations, nil
}

func GetStationsByType(db *sql.DB, stationType string) ([]models.Station, error) {
	rows, err := db.Query(`SELECT id, name, type, ward_number, capacity, process_type FROM stations WHERE type = $1`, stationType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stations []models.Station
	for rows.Next() {
		var s models.Station
		if err := rows.Scan(&s.ID, &s.Name, &s.Type, &s.WardNumber, &s.Capacity, &s.ProcessType); err != nil {
			return nil, err
		}
		stations = append(stations, s)
	}
	return stations, nil
}

func GetStationCounts(db *sql.DB) (*models.StationCount, error) {
	var counts models.StationCount
	err := db.QueryRow(`
		SELECT
			COUNT(*) FILTER (WHERE type = 'lifting') AS lifting_station_count,
			COUNT(*) FILTER (WHERE type = 'pumping') AS pumping_station_count,
			COUNT(*) FILTER (WHERE type = 'stp') AS stp_count
		FROM stations
	`).Scan(&counts.Lifting, &counts.Pumping, &counts.STP)
	if err != nil {
		return nil, err
	}
	return &counts, nil
}

func GetEquipmentByStation(db *sql.DB, stationID int) ([]models.Equipment, error) {
	rows, err := db.Query(`SELECT id, station_id, name, type, NULL as details FROM equipment WHERE station_id = $1`, stationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var equipment []models.Equipment
	for rows.Next() {
		var e models.Equipment
		if err := rows.Scan(&e.ID, &e.StationID, &e.Name, &e.Type, &e.Details); err != nil {
			return nil, err
		}
		equipment = append(equipment, e)
	}
	return equipment, nil
}

// ==========================================
// COMPLAINT REPOSITORY
// ==========================================

const complaintSelectCols = `
	SELECT 
		id::text, 
		citizen_id::text as citizen_user_id, 
		'Citizen' as citizen_name, 
		NULL as citizen_role, 
		ward::text as ward_number, 
		street as street_name, 
		NULL as door_number, 
		NULL as landmark, 
		category, 
		category as type, 
		'Urban' as area_type, 
		image_url as photo_url, 
		NULL as audio_url, 
		CASE 
			WHEN status = 'OPEN' THEN 'Submitted'
			WHEN status = 'ALLOCATED' THEN 'Assigned'
			WHEN status = 'PENDING' THEN 'In Progress'
			WHEN status IN ('COMPLETED', 'RESOLVED') THEN 'Resolved'
			ELSE status
		END AS status, 
		NULL as assigned_to, 
		created_at, 
		(created_at + INTERVAL '1 day') as expected_resolution_at, 
		completed_at as resolved_at
	FROM complaints
`

func scanComplaint(rows *sql.Rows) (models.Complaint, error) {
	var c models.Complaint
	err := rows.Scan(
		&c.ID, &c.CitizenUserID, &c.CitizenName, &c.CitizenRole, &c.WardNumber,
		&c.StreetName, &c.DoorNumber, &c.Landmark, &c.Category, &c.Type,
		&c.AreaType, &c.PhotoURL, &c.AudioURL, &c.Status, &c.AssignedTo,
		&c.CreatedAt, &c.ExpectedResolutionAt, &c.ResolvedAt,
	)
	return c, err
}

func GetComplaintsByWard(db *sql.DB, ward string) ([]models.Complaint, error) {
	rows, err := db.Query(complaintSelectCols+` WHERE ward::text = $1`, ward)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var complaints []models.Complaint
	for rows.Next() {
		c, err := scanComplaint(rows)
		if err != nil {
			return nil, err
		}
		complaints = append(complaints, c)
	}
	return complaints, nil
}

func GetComplaintsByStatus(db *sql.DB, status string) ([]models.Complaint, error) {
	// Status parameter here is the mapped one (e.g. 'Submitted'), so we need to match the mapped value.
	query := complaintSelectCols + ` WHERE (
		CASE 
			WHEN status = 'OPEN' THEN 'Submitted'
			WHEN status = 'ALLOCATED' THEN 'Assigned'
			WHEN status = 'PENDING' THEN 'In Progress'
			WHEN status IN ('COMPLETED', 'RESOLVED') THEN 'Resolved'
			ELSE status
		END
	) = $1`
	rows, err := db.Query(query, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var complaints []models.Complaint
	for rows.Next() {
		c, err := scanComplaint(rows)
		if err != nil {
			return nil, err
		}
		complaints = append(complaints, c)
	}
	return complaints, nil
}

func GetStatusCounts(db *sql.DB, dateFilter string) (map[string]int, error) {
	query := `
		SELECT 
			CASE 
				WHEN status = 'OPEN' THEN 'Submitted'
				WHEN status = 'ALLOCATED' THEN 'Assigned'
				WHEN status = 'PENDING' THEN 'In Progress'
				WHEN status IN ('COMPLETED', 'RESOLVED') THEN 'Resolved'
				ELSE status
			END AS mapped_status, 
			COUNT(*) 
		FROM complaints 
	`
	args := []interface{}{}

	if dateFilter != "" {
		query += ` WHERE DATE(created_at) = $1 `
		args = append(args, dateFilter)
	}
	query += ` GROUP BY mapped_status`

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]int)
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		result[status] = count
	}
	return result, nil
}

func GetComplaintTypeStats(db *sql.DB, dateFilter string) (map[string]int, error) {
	query := `SELECT category as type, COUNT(*) FROM complaints `
	args := []interface{}{}

	if dateFilter != "" {
		query += ` WHERE DATE(created_at) = $1 `
		args = append(args, dateFilter)
	}
	query += ` GROUP BY type`

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]int)
	for rows.Next() {
		var complaintType *string
		var count int
		if err := rows.Scan(&complaintType, &count); err != nil {
			return nil, err
		}
		if complaintType != nil {
			result[*complaintType] = count
		}
	}
	return result, nil
}

// TRENDS

type TrendPoint struct {
	Day        string  `json:"day"`
	Compliance float64 `json:"compliance,omitempty"`
	Breached   float64 `json:"breached,omitempty"`
	Lifting    float64 `json:"lifting,omitempty"`
	Pumping    float64 `json:"pumping,omitempty"`
	STP        float64 `json:"stp,omitempty"`
}

func GetEnergyTrend(db *sql.DB, date string) ([]TrendPoint, error) {
	// Let's return empty, as the energy tables in original db have different column structures
	// and we don't want to break the app parsing them. The energy cards will just be 0.
	return []TrendPoint{}, nil
}

func GetSLATrend(db *sql.DB, date string) ([]TrendPoint, error) {
	// Query to get SLA compliance vs breached for the 7 days ending at 'date'
	dateVal := "CURRENT_DATE"
	if date != "" {
		dateVal = fmt.Sprintf("CAST('%s' AS DATE)", date)
	}

	query := fmt.Sprintf(`
		WITH RECURSIVE days AS (
			SELECT %s - INTERVAL '6 days' as day
			UNION ALL
			SELECT day + INTERVAL '1 day' FROM days WHERE day < %s
		),
		complaint_stats AS (
			SELECT 
				DATE(created_at) as log_date,
				COUNT(*) FILTER (WHERE completed_at <= (created_at + INTERVAL '1 day')) as compliance,
				COUNT(*) FILTER (WHERE completed_at > (created_at + INTERVAL '1 day') OR (completed_at IS NULL AND CURRENT_TIMESTAMP > (created_at + INTERVAL '1 day'))) as breached
			FROM complaints
			GROUP BY DATE(created_at)
		)
		SELECT 
			TO_CHAR(d.day, 'Mon DD') as day_label,
			COALESCE(s.compliance, 0) as compliance,
			COALESCE(s.breached, 0) as breached
		FROM days d
		LEFT JOIN complaint_stats s ON s.log_date = d.day
		ORDER BY d.day
	`, dateVal, dateVal)
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var trend []TrendPoint
	for rows.Next() {
		var p TrendPoint
		if err := rows.Scan(&p.Day, &p.Compliance, &p.Breached); err != nil {
			return nil, err
		}
		trend = append(trend, p)
	}
	return trend, nil
}

func GetAllComplaints(db *sql.DB, dateFilter string) ([]models.Complaint, error) {
	query := complaintSelectCols
	args := []interface{}{}
	if dateFilter != "" {
		query += " WHERE DATE(created_at) = $1"
		args = append(args, dateFilter)
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var complaints []models.Complaint
	for rows.Next() {
		c, err := scanComplaint(rows)
		if err != nil {
			return nil, err
		}
		complaints = append(complaints, c)
	}
	return complaints, nil
}

// ==========================================
// WORK ORDER REPOSITORY
// ==========================================
// Original DB doesn't have standard work_orders table, so we map complaints
func GetWorkOrdersByStaff(db *sql.DB, staffID int) ([]models.WorkOrder, error) {
	return []models.WorkOrder{}, nil // Need string ID support for staff
}

func GetAllWorkOrders(db *sql.DB, dateFilter string) ([]models.WorkOrder, error) {
	query := `
		SELECT 
			id::text as id,
			id::text as complaint_id,
			CASE 
				WHEN ward BETWEEN 1 AND 10 THEN 'da0be945-6d0b-4733-99eb-2eeace7d7f68'
				WHEN ward BETWEEN 11 AND 20 THEN 'a69651a7-c2a2-48bc-9df2-025ec007cb56'
				WHEN ward BETWEEN 21 AND 30 THEN 'aa1ebc25-5b07-4145-9687-56cfe92228e8'
				WHEN ward BETWEEN 31 AND 45 THEN 'a7f9568c-3e6f-4763-87dc-3b6fd5660cc6'
				ELSE 'other'
			END as staff_id,
			(created_at + INTERVAL '1 day') as sla_deadline,
			category as work_type,
			CASE 
				WHEN status = 'OPEN' THEN 'Submitted'
				WHEN status = 'ALLOCATED' THEN 'Assigned'
				WHEN status = 'PENDING' THEN 'In Progress'
				WHEN status IN ('COMPLETED', 'RESOLVED') THEN 'Resolved'
				ELSE status
			END AS status,
			completed_at as resolved_at
		FROM complaints
	`
	args := []interface{}{}
	if dateFilter != "" {
		query += " WHERE DATE(created_at) = $1"
		args = append(args, dateFilter)
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var wos []models.WorkOrder
	for rows.Next() {
		var wo models.WorkOrder
		var status string
		var resolvedAt *time.Time
		if err := rows.Scan(&wo.ID, &wo.ComplaintID, &wo.StaffID, &wo.SLADeadline, &wo.WorkType, &status, &resolvedAt); err != nil {
			return nil, err
		}
		if wo.StaffID == "other" {
			continue
		}
		wo.Status = &status
		// We repurpose SiteDepartTime as resolved_at for frontend if needed
		wo.SiteDepartTime = resolvedAt
		wos = append(wos, wo)
	}
	return wos, nil
}

// ==========================================
// FAULT REPOSITORY
// ==========================================

const faultSelectCols = `
	SELECT id::text, station_id, equipment_id, reported_by::text, report_time, fault_type,
		   severity, emergency_shutdown, escalation_required, escalated_to_role,
		   escalation_reason, rectification_status, rectified_at, rectification_remark
	FROM faults
`

func scanFault(rows *sql.Rows) (models.Fault, error) {
	var f models.Fault
	err := rows.Scan(
		&f.ID, &f.StationID, &f.EquipmentID, &f.ReportedBy, &f.ReportTime,
		&f.FaultType, &f.Severity, &f.EmergencyShutdown, &f.EscalationRequired,
		&f.EscalatedToRole, &f.EscalationReason, &f.RectificationStatus,
		&f.RectifiedAt, &f.RectificationRemark,
	)
	return f, err
}

func GetFaultsByStation(db *sql.DB, stationID int) ([]models.Fault, error) {
	rows, err := db.Query(faultSelectCols+` WHERE station_id = $1`, stationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var faults []models.Fault
	for rows.Next() {
		f, err := scanFault(rows)
		if err != nil {
			return nil, err
		}
		faults = append(faults, f)
	}
	return faults, nil
}

func GetPendingFaults(db *sql.DB, dateFilter string) ([]models.Fault, error) {
	query := faultSelectCols + ` WHERE rectification_status != 'Completed'`
	args := []interface{}{}

	if dateFilter != "" {
		query += ` AND DATE(report_time) = $1`
		args = append(args, dateFilter)
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var faults []models.Fault
	for rows.Next() {
		f, err := scanFault(rows)
		if err != nil {
			return nil, err
		}
		faults = append(faults, f)
	}
	return faults, nil
}

// ==========================================
// LOG REPOSITORY
// ==========================================
func GetLiftingLogs(db *sql.DB, stationID int, date string) ([]models.LiftingDailyLog, error) {
	query := `
		SELECT id, station_id, COALESCE(operator_id::text, ''), log_date, shift_type, equipment_id, 
		       pump_status, hours_reading, voltage, current_reading, vibration_issue, 
		       noise_issue, leakage_issue, sump_level_status, panel_status, 
		       cleaning_done, COALESCE(remark, ''), COALESCE(photo_url, ''), created_at
		FROM lifting_daily_logs 
		WHERE station_id = $1
	`
	args := []interface{}{stationID}
	if date != "" {
		query += " AND log_date = $2"
		args = append(args, date)
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.LiftingDailyLog
	for rows.Next() {
		var l models.LiftingDailyLog
		var opID string
		if err := rows.Scan(
			&l.ID, &l.StationID, &opID, &l.LogDate, &l.ShiftType, &l.EquipmentID,
			&l.PumpStatus, &l.HoursReading, &l.Voltage, &l.CurrentReading, &l.VibrationIssue,
			&l.NoiseIssue, &l.LeakageIssue, &l.SumpLevelStatus, &l.PanelStatus,
			&l.CleaningDone, &l.Remark, &l.PhotoURL, &l.CreatedAt,
		); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, nil
}

func GetPumpingLogs(db *sql.DB, stationID int, date string) ([]models.PumpingDailyLog, error) {
	query := `
		SELECT id, station_id, COALESCE(operator_id::text, ''), log_date, shift_type, 
		       pumps_running_count, inlet_level_status, outlet_pressure, flow_rate, 
		       voltage, current_reading, power_factor, vibration_issue, noise_issue, 
		       leakage_issue, panel_alarm_status, sump_cleanliness, screen_bar_cleaned, 
		       COALESCE(remark, ''), COALESCE(photo_url, '')
		FROM pumping_daily_logs 
		WHERE station_id = $1
	`
	args := []interface{}{stationID}
	if date != "" {
		query += " AND log_date = $2"
		args = append(args, date)
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.PumpingDailyLog
	for rows.Next() {
		var l models.PumpingDailyLog
		var opID string
		if err := rows.Scan(
			&l.ID, &l.StationID, &opID, &l.LogDate, &l.ShiftType,
			&l.PumpsRunningCount, &l.InletLevelStatus, &l.OutletPressure, &l.FlowRate,
			&l.Voltage, &l.CurrentReading, &l.PowerFactor, &l.VibrationIssue, &l.NoiseIssue,
			&l.LeakageIssue, &l.PanelAlarmStatus, &l.SumpCleanliness, &l.ScreenBarCleaned,
			&l.Remark, &l.PhotoURL,
		); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, nil
}

func GetSTPLogs(db *sql.DB, stationID int, date string) ([]models.STPDailyLog, error) {
	query := `
		SELECT id, station_id, COALESCE(operator_id::text, ''), log_date, inlet_flow_rate, 
		       inlet_ph, inlet_bod, inlet_cod, inlet_tss, inlet_oil_grease, inlet_temp, 
		       inlet_color_odour, do_level, mlss, mcrt, sv30, fm_ratio, blower_hours, 
		       sludge_depth, ras_flow, was_flow, scum_present, outlet_flow_rate, 
		       outlet_ph, outlet_bod, outlet_cod, outlet_tss, outlet_oil_grease, 
		       outlet_fecal_coliform, residual_chlorine, sludge_generated, 
		       sludge_dried, moisture_content, disposal_method, drying_bed_condition, 
		       power_kwh, energy_per_mld, chlorine_usage, polymer_usage, chemical_stock_status
		FROM stp_daily_logs 
		WHERE station_id = $1
	`
	args := []interface{}{stationID}
	if date != "" {
		query += " AND log_date = $2"
		args = append(args, date)
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.STPDailyLog
	for rows.Next() {
		var l models.STPDailyLog
		var opID string
		if err := rows.Scan(
			&l.ID, &l.StationID, &opID, &l.LogDate, &l.InletFlowRate,
			&l.InletPH, &l.InletBOD, &l.InletCOD, &l.InletTSS, &l.InletOilGrease, &l.InletTemp,
			&l.InletColorOdour, &l.DOLevel, &l.MLSS, &l.MCRT, &l.SV30, &l.FMRatio, &l.BlowerHours,
			&l.SludgeDepth, &l.RASFlow, &l.WASFlow, &l.ScumPresent, &l.OutletFlowRate,
			&l.OutletPH, &l.OutletBOD, &l.OutletCOD, &l.OutletTSS, &l.OutletOilGrease,
			&l.OutletFecalColiform, &l.ResidualChlorine, &l.SludgeGenerated,
			&l.SludgeDried, &l.MoistureContent, &l.DisposalMethod, &l.DryingBedCondition,
			&l.PowerKWH, &l.EnergyPerMLD, &l.ChlorineUsage, &l.PolymerUsage, &l.ChemicalStockStatus,
		); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, nil
}
