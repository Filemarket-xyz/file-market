package main

import (
	"context"
	"database/sql"
	"log"
	"os"
	"os/signal"
	"syscall"
	"taskTracker/handlers"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	var (
		botToken        = getEnv("TASK_TRACKER_TOKEN", "")
		dbPath          = getEnv("TASK_TRACKER_DB_PATH", "./db/task_tracker.db")
		credentialsFile = getEnv("TASK_TRACKER_CREDENTIALS_PATH", "no-such-file")
	)

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal(err)
	}

	cmdHandlers := []handlers.CmdHandler{
		handlers.NewMSHandler(context.Background(), "/ms", db, credentialsFile),
	}
	bot := NewBot(botToken, cmdHandlers)
	go bot.Start()

	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)

	<-stopChan

	log.Println("Shutting down...")

	if err := db.Close(); err != nil {
		log.Fatalf("failed to close db: %v", err)
	}
}
