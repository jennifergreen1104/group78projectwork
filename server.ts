import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('autoverify.db');
const JWT_SECRET = 'ghana-police-secret-key-2025';

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_number TEXT UNIQUE,
    owner_name TEXT,
    make TEXT,
    model TEXT,
    color TEXT,
    insurance_company TEXT,
    insurance_expiry TEXT
  );

  CREATE TABLE IF NOT EXISTS lookups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    officer_id INTEGER,
    plate_number TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_number TEXT,
    officer_id INTEGER,
    suspicion_notes TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial data
const hashedPassword = bcrypt.hashSync('group78', 10);

// Remove legacy test account if it exists
db.prepare("DELETE FROM users WHERE username = 'officer1'").run();

const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, username, password, role) VALUES (?, ?, ?, ?)');

// Officer 1: LARBI ANSAH KWAKU JOSEPH
insertUser.run(10298787, 'LARBI ANSAH KWAKU JOSEPH', hashedPassword, 'officer');

// Officer 2: DANIEL AFRIYIE
insertUser.run(10299855, 'DANIEL AFRIYIE', hashedPassword, 'officer');

// Admin User
insertUser.run(99999999, 'ADMIN', hashedPassword, 'admin');

console.log('Official officer and admin accounts verified/created.');

// --- Helper Functions ---
function logAudit(officer_id: number, action: string, details: string) {
  db.prepare('INSERT INTO audit_logs (officer_id, action, details) VALUES (?, ?, ?)')
    .run(officer_id, action, details);
}

// Add Audit Logs table
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    officer_id INTEGER,
    action TEXT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Expand vehicle database to 500,000+ if needed
const vehicleCount = db.prepare('SELECT count(*) as count FROM vehicles').get() as { count: number };
if (vehicleCount.count < 500000) {
  console.log('Generating 500,000+ vehicle records for the database. This may take a moment...');
  const start = Date.now();
  
  const firstNames = ['Kwame', 'Kofi', 'Ama', 'Abena', 'Yaw', 'Adwoa', 'Kwabena', 'Kojo', 'Akua', 'Ekow', 'Efua', 'Kwaku', 'Akosua', 'Yaaba', 'Emmanuel', 'Mary', 'Joseph', 'Seth', 'Bernice', 'Daniel', 'Grace'];
  const lastNames = ['Mensah', 'Osei', 'Adu', 'Serwaa', 'Appiah', 'Dankwa', 'Ansah', 'Addo', 'Owusu', 'Boateng', 'Kyeremeh', 'Tetteh', 'Quansah', 'Asante', 'Sarpong', 'Oppong', 'Agyemang', 'Baah', 'Acheampong', 'Yeboah'];
  const regions = ['GW', 'AS', 'GT', 'ER', 'WR', 'NR', 'CR', 'VR', 'SR', 'UW', 'UE', 'OT', 'BE', 'BN', 'AH', 'WN'];
  const vehicleData = [
    { make: 'Toyota', models: ['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Vitz', 'Yaris', 'Hilux', 'Prado'] },
    { make: 'Honda', models: ['Civic', 'Accord', 'CR-V', 'Fit', 'HR-V', 'Pilot'] },
    { make: 'Mercedes-Benz', models: ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'Sprinter'] },
    { make: 'Hyundai', models: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Accent', 'Ioniq'] },
    { make: 'Nissan', models: ['Sentra', 'Altima', 'Rogue', 'Pathfinder', 'Patrol', 'Navara'] },
    { make: 'Kia', models: ['Rio', 'Sportage', 'Sorento', 'Cerato', 'Picanto', 'Stinger'] },
    { make: 'Mazda', models: ['CX-5', '3', '6', 'CX-9', 'BT-50'] },
    { make: 'Ford', models: ['Explorer', 'F-150', 'Escape', 'Edge', 'Ranger', 'Focus'] },
    { make: 'Volkswagen', models: ['Golf', 'Tiguan', 'Passat', 'Polo', 'Amarok', 'Jetta'] }
  ];
  const colors = ['Silver', 'Black', 'White', 'Blue', 'Red', 'Gray', 'Dark Green', 'Gold', 'Beige', 'Pearlescent', 'Brown'];
  const insuranceCompanies = ['Star Assurance', 'Enterprise Insurance', 'SIC Insurance', 'Hollard Insurance', 'Glico Insurance', 'Phoenix Insurance', 'Prudential Life', 'Old Mutual', 'Vanguard Assurance', 'Activa Insurance'];

  const insertVehicle = db.prepare('INSERT OR IGNORE INTO vehicles (plate_number, owner_name, make, model, color, insurance_company, insurance_expiry) VALUES (?, ?, ?, ?, ?, ?, ?)');
  
  const generateBatch = db.transaction((count) => {
    let generated = 0;
    while(generated < count) {
      const region = regions[Math.floor(Math.random() * regions.length)];
      const num = Math.floor(1000 + Math.random() * 8999);
      // Removed hyphen after region, added space
      const year = Math.floor(10 + Math.random() * 15); 
      const suffix = Math.random() > 0.8 ? String.fromCharCode(65 + Math.floor(Math.random() * 26)) : '';
      const plate = `${region} ${num}${suffix}-${year}`;
      
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const owner = `${firstName} ${lastName}`;
      
      const vChoice = vehicleData[Math.floor(Math.random() * vehicleData.length)];
      const make = vChoice.make;
      const model = vChoice.models[Math.floor(Math.random() * vChoice.models.length)];
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      const insurance = insuranceCompanies[Math.floor(Math.random() * insuranceCompanies.length)];
      
      const now = new Date();
      const expiryDate = new Date(now.getFullYear() - 1 + Math.random() * 3, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const expiryStr = expiryDate.toISOString().split('T')[0];

      const result = insertVehicle.run(plate, owner, make, model, color, insurance, expiryStr);
      if (result.changes > 0) generated++;
      
      // Periodically log progress for logs
      if (generated % 100000 === 0 && generated > 0) {
        console.log(`Generated ${generated} records...`);
      }
    }
  });

  generateBatch(500001); 
  const duration = (Date.now() - start) / 1000;
  console.log(`Successfully expanded database to over 500,000 records in ${duration}s.`);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Permissions denied. Admin role required.' });
    }
  };

  // API Routes
  app.post('/api/login', (req, res) => {
    const { loginId, password } = req.body;
    // Allow login by ID (Officers) or Username (Admin fallback)
    const user = db.prepare('SELECT * FROM users WHERE id = ? OR username = ?').get(loginId, loginId) as any;
    
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
      logAudit(user.id, 'LOGIN', `User ${user.username} (ID: ${user.id}) logged in.`);
      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(401).json({ message: 'Invalid credentials. Check Officer ID and password.' });
    }
  });

  app.get('/api/vehicles/:plate', authenticateToken, (req, res) => {
    let plate = req.params.plate.toUpperCase();
    
    // Normalize: if user enters XX-1234 but DB has XX 1234
    if (plate.length > 3 && plate[2] === '-') {
      plate = plate.substring(0, 2) + ' ' + plate.substring(3);
    }

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE plate_number = ?').get(plate);
    
    if (vehicle) {
      // Log lookup
      db.prepare('INSERT INTO lookups (officer_id, plate_number) VALUES (?, ?)').run((req as any).user.id, plate);
      logAudit((req as any).user.id, 'LOOKUP', `Looked up plate ${plate}`);
      res.json(vehicle);
    } else {
      res.status(404).json({ message: 'Vehicle not found' });
    }
  });

  // Admin: Audit Logs
  app.get('/api/admin/audit', authenticateToken, isAdmin, (req, res) => {
    const logs = db.prepare(`
      SELECT a.*, u.username 
      FROM audit_logs a 
      JOIN users u ON a.officer_id = u.id 
      ORDER BY a.timestamp DESC 
      LIMIT 100
    `).all();
    res.json(logs);
  });

  // Admin: Stats
  app.get('/api/admin/stats', authenticateToken, isAdmin, (req, res) => {
    const totalVehicles = db.prepare('SELECT count(*) as count FROM vehicles').get() as any;
    const totalLookups = db.prepare('SELECT count(*) as count FROM lookups').get() as any;
    const totalFlags = db.prepare('SELECT count(*) as count FROM flags').get() as any;
    const totalUsers = db.prepare('SELECT count(*) as count FROM users').get() as any;
    
    res.json({
      vehicles: totalVehicles.count,
      lookups: totalLookups.count,
      flags: totalFlags.count,
      users: totalUsers.count
    });
  });

  // Admin: Users
  app.get('/api/admin/users', authenticateToken, isAdmin, (req, res) => {
    const users = db.prepare('SELECT id, username, role FROM users').all();
    res.json(users);
  });

  app.get('/api/history', authenticateToken, (req, res) => {
    const history = db.prepare(`
      SELECT l.*, v.make, v.model 
      FROM lookups l 
      LEFT JOIN vehicles v ON l.plate_number = v.plate_number 
      WHERE l.officer_id = ? 
      ORDER BY l.timestamp DESC 
      LIMIT 50
    `).all((req as any).user.id);
    res.json(history);
  });

  app.post('/api/flags', authenticateToken, (req, res) => {
    const { plate_number, suspicion_notes } = req.body;
    db.prepare('INSERT INTO flags (plate_number, officer_id, suspicion_notes) VALUES (?, ?, ?)')
      .run(plate_number.toUpperCase(), (req as any).user.id, suspicion_notes);
    res.json({ success: true });
  });

  app.get('/api/flags', authenticateToken, (req, res) => {
    const flags = db.prepare(`
      SELECT f.*, u.username as officer_name 
      FROM flags f 
      JOIN users u ON f.officer_id = u.id 
      ORDER BY f.timestamp DESC
    `).all();
    res.json(flags);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
