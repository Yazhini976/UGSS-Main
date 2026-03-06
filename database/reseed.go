package main

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	connStr := "postgres://postgres:123@localhost:5432/civic_db?sslmode=disable"
	db, err := sql.Open("pgx", connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	content, err := ioutil.ReadFile("seed/seed_data.sql")
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Cleaning tables...")
	_, err = db.Exec("TRUNCATE TABLE work_orders, complaints, users CASCADE")
	if err != nil {
		log.Printf("Warning: Failed to truncate: %v", err)
	}

	fmt.Println("Running seed_data.sql...")
	_, err = db.Exec(string(content))
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Database reseeded successfully!")
}
