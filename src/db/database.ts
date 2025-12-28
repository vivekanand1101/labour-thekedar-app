import * as SQLite from 'expo-sqlite';
import type { User, Project, Labour, Attendance, Payment, LabourWithStats, ProjectWithStats } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('labourthekedar.db');
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      isActive INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS labours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      dailyWage REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      labourId INTEGER NOT NULL,
      date TEXT NOT NULL,
      workType TEXT NOT NULL CHECK(workType IN ('full', 'half')),
      notes TEXT,
      FOREIGN KEY (labourId) REFERENCES labours(id) ON DELETE CASCADE,
      UNIQUE(labourId, date)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      labourId INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('advance', 'settlement')),
      notes TEXT,
      FOREIGN KEY (labourId) REFERENCES labours(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_projects_userId ON projects(userId);
    CREATE INDEX IF NOT EXISTS idx_labours_projectId ON labours(projectId);
    CREATE INDEX IF NOT EXISTS idx_attendance_labourId ON attendance(labourId);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
    CREATE INDEX IF NOT EXISTS idx_payments_labourId ON payments(labourId);
  `);
}

// User operations
export async function createUser(phone: string, name: string): Promise<User> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO users (phone, name) VALUES (?, ?)',
    [phone, name]
  );
  return { id: result.lastInsertRowId, phone, name, createdAt: new Date().toISOString() };
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<User>(
    'SELECT * FROM users WHERE phone = ?',
    [phone]
  );
  return result || null;
}

// Project operations
export async function createProject(userId: number, name: string, description: string = ''): Promise<Project> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO projects (userId, name, description) VALUES (?, ?, ?)',
    [userId, name, description]
  );
  return {
    id: result.lastInsertRowId,
    userId,
    name,
    description,
    createdAt: new Date().toISOString(),
    isActive: true
  };
}

export async function getProjectsByUser(userId: number): Promise<ProjectWithStats[]> {
  const database = await getDatabase();
  const projects = await database.getAllAsync<ProjectWithStats>(`
    SELECT
      p.*,
      COUNT(DISTINCT l.id) as labourCount,
      COALESCE(SUM(
        (SELECT COALESCE(SUM(
          CASE WHEN a.workType = 'full' THEN l2.dailyWage ELSE l2.dailyWage / 2 END
        ), 0) FROM attendance a
        JOIN labours l2 ON a.labourId = l2.id
        WHERE l2.id = l.id)
        -
        (SELECT COALESCE(SUM(pay.amount), 0) FROM payments pay WHERE pay.labourId = l.id)
      ), 0) as totalPendingDues
    FROM projects p
    LEFT JOIN labours l ON l.projectId = p.id
    WHERE p.userId = ? AND p.isActive = 1
    GROUP BY p.id
    ORDER BY p.createdAt DESC
  `, [userId]);
  return projects.map(p => ({ ...p, isActive: Boolean(p.isActive) }));
}

export async function getProjectById(id: number): Promise<Project | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<Project>(
    'SELECT * FROM projects WHERE id = ?',
    [id]
  );
  return result ? { ...result, isActive: Boolean(result.isActive) } : null;
}

export async function updateProject(id: number, name: string, description: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE projects SET name = ?, description = ? WHERE id = ?',
    [name, description, id]
  );
}

export async function deleteProject(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE projects SET isActive = 0 WHERE id = ?', [id]);
}

// Labour operations
export async function createLabour(projectId: number, name: string, phone: string | null, dailyWage: number): Promise<Labour> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO labours (projectId, name, phone, dailyWage) VALUES (?, ?, ?, ?)',
    [projectId, name, phone, dailyWage]
  );
  return {
    id: result.lastInsertRowId,
    projectId,
    name,
    phone,
    dailyWage,
    createdAt: new Date().toISOString()
  };
}

export async function getLaboursByProject(projectId: number): Promise<LabourWithStats[]> {
  const database = await getDatabase();
  return await database.getAllAsync<LabourWithStats>(`
    SELECT
      l.*,
      COALESCE(SUM(CASE WHEN a.workType = 'full' THEN l.dailyWage ELSE l.dailyWage / 2 END), 0) as totalEarned,
      COALESCE((SELECT SUM(amount) FROM payments WHERE labourId = l.id), 0) as totalPaid,
      COALESCE(SUM(CASE WHEN a.workType = 'full' THEN l.dailyWage ELSE l.dailyWage / 2 END), 0)
        - COALESCE((SELECT SUM(amount) FROM payments WHERE labourId = l.id), 0) as balance,
      COUNT(a.id) as attendanceCount
    FROM labours l
    LEFT JOIN attendance a ON a.labourId = l.id
    WHERE l.projectId = ?
    GROUP BY l.id
    ORDER BY l.name
  `, [projectId]);
}

export async function getLabourById(id: number): Promise<LabourWithStats | null> {
  const database = await getDatabase();
  return await database.getFirstAsync<LabourWithStats>(`
    SELECT
      l.*,
      COALESCE(SUM(CASE WHEN a.workType = 'full' THEN l.dailyWage ELSE l.dailyWage / 2 END), 0) as totalEarned,
      COALESCE((SELECT SUM(amount) FROM payments WHERE labourId = l.id), 0) as totalPaid,
      COALESCE(SUM(CASE WHEN a.workType = 'full' THEN l.dailyWage ELSE l.dailyWage / 2 END), 0)
        - COALESCE((SELECT SUM(amount) FROM payments WHERE labourId = l.id), 0) as balance,
      COUNT(a.id) as attendanceCount
    FROM labours l
    LEFT JOIN attendance a ON a.labourId = l.id
    WHERE l.id = ?
    GROUP BY l.id
  `, [id]);
}

export async function updateLabour(id: number, name: string, phone: string | null, dailyWage: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE labours SET name = ?, phone = ?, dailyWage = ? WHERE id = ?',
    [name, phone, dailyWage, id]
  );
}

export async function deleteLabour(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM labours WHERE id = ?', [id]);
}

// Attendance operations
export async function markAttendance(labourId: number, date: string, workType: 'full' | 'half', notes?: string): Promise<Attendance> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT OR REPLACE INTO attendance (labourId, date, workType, notes) VALUES (?, ?, ?, ?)',
    [labourId, date, workType, notes || null]
  );
  return { id: result.lastInsertRowId, labourId, date, workType, notes: notes || null };
}

export async function removeAttendance(labourId: number, date: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM attendance WHERE labourId = ? AND date = ?', [labourId, date]);
}

export async function getAttendanceByLabour(labourId: number): Promise<Attendance[]> {
  const database = await getDatabase();
  return await database.getAllAsync<Attendance>(
    'SELECT * FROM attendance WHERE labourId = ? ORDER BY date DESC',
    [labourId]
  );
}

export async function getAttendanceByDate(projectId: number, date: string): Promise<(Attendance & { labourName: string })[]> {
  const database = await getDatabase();
  return await database.getAllAsync<Attendance & { labourName: string }>(`
    SELECT a.*, l.name as labourName
    FROM attendance a
    JOIN labours l ON a.labourId = l.id
    WHERE l.projectId = ? AND a.date = ?
    ORDER BY l.name
  `, [projectId, date]);
}

// Payment operations
export async function addPayment(labourId: number, amount: number, date: string, type: 'advance' | 'settlement', notes?: string): Promise<Payment> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO payments (labourId, amount, date, type, notes) VALUES (?, ?, ?, ?, ?)',
    [labourId, amount, date, type, notes || null]
  );
  return { id: result.lastInsertRowId, labourId, amount, date, type, notes: notes || null };
}

export async function getPaymentsByLabour(labourId: number): Promise<Payment[]> {
  const database = await getDatabase();
  return await database.getAllAsync<Payment>(
    'SELECT * FROM payments WHERE labourId = ? ORDER BY date DESC',
    [labourId]
  );
}

export async function deletePayment(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM payments WHERE id = ?', [id]);
}
