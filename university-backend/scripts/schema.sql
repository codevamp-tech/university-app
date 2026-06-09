-- ═══════════════════════════════════════════════════════════════
-- UniCampus — Supabase Database Schema
-- ═══════════════════════════════════════════════════════════════
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ───────────────────────────────────────────────────────────────

-- Drop existing table if re-running (comment out if you want to preserve data)
-- DROP TABLE IF EXISTS students;

CREATE TABLE IF NOT EXISTS students (
  id                  TEXT        PRIMARY KEY,       -- Roll number (e.g. 2400140100081)
  name                TEXT        NOT NULL,
  email               TEXT,
  gender              TEXT,                          -- 'M' or 'F'
  phone               TEXT,
  course              TEXT,                          -- e.g. 'B.Tech', 'B.Pharma', 'MBBS'
  branch              TEXT,                          -- e.g. 'CSE', 'ECE'
  year                TEXT,                          -- '1' to '5'
  semester            TEXT,                          -- '1' to '10'
  category            TEXT,                          -- 'engineering', 'medical', etc.
  persona_type        TEXT,                          -- 'topperformer', 'highpotential', 'atrisk', 'average'
  attendance          NUMERIC(5,2) DEFAULT 0,
  cgpa                NUMERIC(4,2) DEFAULT 0,
  sgpa_history        JSONB        DEFAULT '[]',     -- [8.5, 8.2, 7.9, ...]
  current_skills      TEXT[]       DEFAULT '{}',
  target_career       TEXT,
  missing_skills      TEXT[]       DEFAULT '{}',
  certs_done          TEXT[]       DEFAULT '{}',
  certs_in_progress   TEXT[]       DEFAULT '{}',
  extracurricular     TEXT[]       DEFAULT '{}',
  leadership          TEXT[]       DEFAULT '{}',
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Indexes for common query patterns ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_students_email    ON students (email);
CREATE INDEX IF NOT EXISTS idx_students_course   ON students (course);
CREATE INDEX IF NOT EXISTS idx_students_cgpa     ON students (cgpa DESC);

-- ── Auto-update updated_at on row change ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_students_updated_at ON students;
CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── Row Level Security (RLS) ──────────────────────────────────────────────────
-- Enable RLS so only the backend (service role) can write, but anyone can read.
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Allow the backend (any authenticated request) to read all rows
CREATE POLICY "Allow read all students"
  ON students FOR SELECT
  USING (true);

-- Allow backend (service role) to insert
CREATE POLICY "Allow backend insert"
  ON students FOR INSERT
  WITH CHECK (true);

-- Allow backend (service role) to update
CREATE POLICY "Allow backend update"
  ON students FOR UPDATE
  USING (true);

-- ── Done ─────────────────────────────────────────────────────────────────────
-- After running this, execute: node scripts/seed.js
