package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"ugss-command-center-backend/internal/repository"
)

// ==========================================
// USER HANDLERS
// ==========================================

func GetUserByMobileHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		mobile := r.URL.Query().Get("mobile")
		if mobile == "" {
			http.Error(w, "Missing mobile parameter", http.StatusBadRequest)
			return
		}

		user, err := repository.GetUserByMobile(db, mobile)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
	}
}

func GetUsersByRoleHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		role := r.URL.Query().Get("role")
		if role == "" {
			http.Error(w, "Missing role parameter", http.StatusBadRequest)
			return
		}

		users, err := repository.GetUsersByRole(db, role)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(users)
	}
}

func GetOfficerStatsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stats, err := repository.GetOfficerStats(db)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(stats)
	}
}

func GetAllStationsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stations, err := repository.GetAllStations(db)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(stations)
	}
}

func GetStationsByTypeHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stationType := r.URL.Query().Get("type")
		if stationType == "" {
			http.Error(w, "Missing type parameter", http.StatusBadRequest)
			return
		}

		stations, err := repository.GetStationsByType(db, stationType)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(stations)
	}
}

func GetEquipmentByStationHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stationIDStr := r.URL.Query().Get("station_id")
		if stationIDStr == "" {
			http.Error(w, "Missing station_id parameter", http.StatusBadRequest)
			return
		}

		stationID, err := strconv.Atoi(stationIDStr)
		if err != nil {
			http.Error(w, "Invalid station_id parameter", http.StatusBadRequest)
			return
		}

		equipment, err := repository.GetEquipmentByStation(db, stationID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(equipment)
	}
}

// ==========================================
// COMPLAINT HANDLERS
// ==========================================

func GetComplaintsByWardHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ward := r.URL.Query().Get("ward")
		if ward == "" {
			http.Error(w, "Missing ward parameter", http.StatusBadRequest)
			return
		}

		complaints, err := repository.GetComplaintsByWard(db, ward)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(complaints)
	}
}

func GetComplaintsByStatusHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		status := r.URL.Query().Get("status")
		if status == "" {
			http.Error(w, "Missing status parameter", http.StatusBadRequest)
			return
		}

		complaints, err := repository.GetComplaintsByStatus(db, status)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(complaints)
	}
}

func GetStatusCountsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		date := r.URL.Query().Get("date")
		data, err := repository.GetStatusCounts(db, date)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	}
}

func GetComplaintTypeStatsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		date := r.URL.Query().Get("date")
		data, err := repository.GetComplaintTypeStats(db, date)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	}
}

func GetEnergyTrendHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		date := r.URL.Query().Get("date")
		data, err := repository.GetEnergyTrend(db, date)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	}
}

func GetSLATrendHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		date := r.URL.Query().Get("date")
		data, err := repository.GetSLATrend(db, date)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	}
}

func GetAllComplaintsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		date := r.URL.Query().Get("date")
		complaints, err := repository.GetAllComplaints(db, date)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(complaints)
	}
}

// ==========================================
// WORK ORDER HANDLERS
// ==========================================

func GetWorkOrdersByStaffHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		staffIDStr := r.URL.Query().Get("staff_id")
		if staffIDStr == "" {
			http.Error(w, "Missing staff_id parameter", http.StatusBadRequest)
			return
		}

		staffID, err := strconv.Atoi(staffIDStr)
		if err != nil {
			http.Error(w, "Invalid staff_id parameter", http.StatusBadRequest)
			return
		}

		workOrders, err := repository.GetWorkOrdersByStaff(db, staffID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(workOrders)
	}
}

func GetAllWorkOrdersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		date := r.URL.Query().Get("date")
		workOrders, err := repository.GetAllWorkOrders(db, date)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(workOrders)
	}
}

// ==========================================
// FAULT HANDLERS
// ==========================================

func GetFaultsByStationHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stationIDStr := r.URL.Query().Get("station_id")
		if stationIDStr == "" {
			http.Error(w, "Missing station_id parameter", http.StatusBadRequest)
			return
		}

		stationID, err := strconv.Atoi(stationIDStr)
		if err != nil {
			http.Error(w, "Invalid station_id parameter", http.StatusBadRequest)
			return
		}

		faults, err := repository.GetFaultsByStation(db, stationID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(faults)
	}
}

func GetPendingFaultsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		date := r.URL.Query().Get("date")
		faults, err := repository.GetPendingFaults(db, date)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(faults)
	}
}

// ==========================================
// DASHBOARD HANDLER (NEW – SAFE ADDITION)
// ==========================================

func GetStationCountsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		counts, err := repository.GetStationCounts(db)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(counts)
	}
}

// ==========================================
// LOG HANDLERS
// ==========================================

func GetLiftingLogsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stationIDStr := r.URL.Query().Get("station_id")
		date := r.URL.Query().Get("date")
		if stationIDStr == "" {
			http.Error(w, "Missing station_id", http.StatusBadRequest)
			return
		}
		stationID, _ := strconv.Atoi(stationIDStr)

		logs, err := repository.GetLiftingLogs(db, stationID, date)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(logs)
	}
}

func GetPumpingLogsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stationIDStr := r.URL.Query().Get("station_id")
		date := r.URL.Query().Get("date")
		if stationIDStr == "" {
			http.Error(w, "Missing station_id", http.StatusBadRequest)
			return
		}
		stationID, _ := strconv.Atoi(stationIDStr)

		logs, err := repository.GetPumpingLogs(db, stationID, date)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(logs)
	}
}

func GetSTPLogsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stationIDStr := r.URL.Query().Get("station_id")
		date := r.URL.Query().Get("date")
		if stationIDStr == "" {
			http.Error(w, "Missing station_id", http.StatusBadRequest)
			return
		}
		stationID, _ := strconv.Atoi(stationIDStr)

		logs, err := repository.GetSTPLogs(db, stationID, date)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(logs)
	}
}
