package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"

	"ugss-command-center-backend/internal/handlers"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Connect to Database
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Fallback for Docker environment variables if DATABASE_URL is not set
		dbHost := os.Getenv("DB_HOST")
		dbUser := os.Getenv("DB_USER")
		dbPass := os.Getenv("DB_PASSWORD")
		dbName := os.Getenv("DB_NAME")
		dbPort := os.Getenv("DB_PORT")
		if dbPort == "" {
			dbPort = "5432"
		}

		if dbHost != "" && dbUser != "" && dbPass != "" && dbName != "" {
			dbURL = "postgres://" + dbUser + ":" + dbPass + "@" + dbHost + ":" + dbPort + "/" + dbName + "?sslmode=disable"
			log.Println("DATABASE_URL not set, constructed from DB_HOST/USER/PASSWORD/NAME")
		} else {
			log.Fatal("DATABASE_URL is not set and cannot be constructed from components")
		}
	}

	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer db.Close()

	// Verify connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Unable to ping database: %v\n", err)
	}
	log.Println("Connected to database")

	// Setup Router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"}, // Adjust for production
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Routes

	// User routes
	r.Get("/api/users/mobile", handlers.GetUserByMobileHandler(db))
	r.Get("/api/users/role", handlers.GetUsersByRoleHandler(db))

	// Station routes
	r.Get("/api/stations", handlers.GetAllStationsHandler(db))
	r.Get("/api/stations/type", handlers.GetStationsByTypeHandler(db))
	r.Get("/api/equipment", handlers.GetEquipmentByStationHandler(db))

	// Complaint routes
	r.Get("/api/complaints", handlers.GetAllComplaintsHandler(db))
	r.Get("/api/complaints/ward", handlers.GetComplaintsByWardHandler(db))
	r.Get("/api/complaints/status", handlers.GetComplaintsByStatusHandler(db))
	r.Get("/api/complaints/stats", handlers.GetStatusCountsHandler(db))
	r.Get("/api/complaints/type-stats", handlers.GetComplaintTypeStatsHandler(db))

	// Work order routes
	r.Get("/api/work-orders", handlers.GetAllWorkOrdersHandler(db))
	r.Get("/api/work-orders/staff", handlers.GetWorkOrdersByStaffHandler(db))

	// Fault routes
	r.Get("/api/faults/station", handlers.GetFaultsByStationHandler(db))
	r.Get("/api/faults/pending", handlers.GetPendingFaultsHandler(db))

	// Log routes
	r.Get("/api/logs/lifting", handlers.GetLiftingLogsHandler(db))
	r.Get("/api/logs/pumping", handlers.GetPumpingLogsHandler(db))
	r.Get("/api/logs/stp", handlers.GetSTPLogsHandler(db))

	// ✅ NEW ROUTE (ONLY ADDITION – DOES NOT AFFECT OTHERS)

	r.Get("/api/dashboard/station-counts", handlers.GetStationCountsHandler(db))
	r.Get("/api/dashboard/officer-stats", handlers.GetOfficerStatsHandler(db))
	r.Get("/api/energy/trend", handlers.GetEnergyTrendHandler(db))
	r.Get("/api/sla/trend", handlers.GetSLATrendHandler(db))

	// Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
