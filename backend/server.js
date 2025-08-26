import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import bcrypt from "bcrypt";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ---- Database Setup ----
const db = new Database("movies.db");

// Create tables if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    price INTEGER,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    movieId INTEGER,
    title TEXT,
    showtime TEXT,
    seats TEXT,
    price INTEGER,
    date TEXT
  );
`);

// ---- Seed movies if empty ----
const movieCount = db.prepare("SELECT COUNT(*) as c FROM movies").get().c;
if (movieCount === 0) {
  const seed = db.prepare(
    "INSERT INTO movies (title, description, price, image) VALUES (?, ?, ?, ?)"
  );

  seed.run(
    "Avengers: Endgame",
    "The Avengers assemble for the final battle.",
    300,
    "http://www.impawards.com/2019/posters/avengers_endgame_ver2.jpg"
  );
  seed.run(
    "Inception",
    "A thief who steals corporate secrets through dream-sharing tech.",
    250,
    "https://m.media-amazon.com/images/I/51oD-VR5w7L._AC_.jpg"
  );
  seed.run(
    "Interstellar",
    "A journey through space and time to save humanity.",
    280,
    "https://m.media-amazon.com/images/I/71n58mY1v+L._AC_SY679_.jpg"
  );
}

// ---- Signup ----
app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;

  const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (existing) return res.json({ success: false, message: "User already exists" });

  const hashed = bcrypt.hashSync(password, 10);
  db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").run(
    name,
    email,
    hashed
  );

  res.json({ success: true, message: "Signup successful" });
});

// ---- Login ----
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user) return res.json({ success: false, message: "User not found" });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.json({ success: false, message: "Invalid password" });

  res.json({
    success: true,
    message: "Login successful",
    user: { id: user.id, name: user.name, email: user.email },
  });
});

// ---- Get all movies ----
app.get("/movies", (req, res) => {
  const movies = db.prepare("SELECT * FROM movies").all();
  res.json(movies);
});

// ---- Get all bookings ----
app.get("/bookings", (req, res) => {
  const bookings = db.prepare("SELECT * FROM bookings ORDER BY date DESC").all();
  bookings.forEach(b => b.seats = JSON.parse(b.seats));
  res.json(bookings);
});

// ---- Save booking ----
app.post("/bookings", (req, res) => {
  const { userId, movieId, title, showtime, seats, price, date } = req.body;
  const stmt = db.prepare(
    "INSERT INTO bookings (userId, movieId, title, showtime, seats, price, date) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const result = stmt.run(userId, movieId, title, showtime, JSON.stringify(seats), price, date);
  res.json({ success: true, id: result.lastInsertRowid });
});

// ---- Start Server ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
