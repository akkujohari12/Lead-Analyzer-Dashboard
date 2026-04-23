import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

router.get("/leads", (req, res) => {
  db.all("SELECT * FROM leads ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch leads" });
    }
    res.json(rows);
  });
});

export default router;
