import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_FILE = path.resolve("movietime.db");
const db = new Database(DB_FILE);

// Run simple migrations if tables don't exist
function migrate() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS movies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      lang TEXT,
      genre TEXT,
      rating TEXT,
      poster TEXT,
      duration TEXT,
      price INTEGER,
      showtimes TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      movie_id TEXT NOT NULL,
      showtime TEXT NOT NULL,
      seats TEXT NOT NULL,
      price INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(movie_id) REFERENCES movies(id)
    );

    CREATE TABLE IF NOT EXISTS surveys (
      id TEXT PRIMARY KEY,
      name TEXT,
      favorite_genre TEXT,
      rating INTEGER,
      feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

migrate();

export default db;
