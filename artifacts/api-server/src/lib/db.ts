import sqlite3 from "sqlite3";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "leads.db");

export const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Failed to open database:", err.message);
  } else {
    console.log("SQLite connected:", DB_PATH);
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT,
    company TEXT,
    company_size INTEGER,
    notes TEXT,
    score INTEGER,
    segment TEXT,
    message TEXT,
    action TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
