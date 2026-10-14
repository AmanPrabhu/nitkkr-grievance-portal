const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite Database
const db = new sqlite3.Database('./grievances.db', (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
    } else {
        console.log('✅ Connected to SQLite database.');
        initializeDatabase();
    }
});

// Ensure table exists with all required NIT KKR fields
function initializeDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS grievances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grievance_id TEXT UNIQUE,
        student_name TEXT,
        category TEXT,
        description TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating base table:', err.message);
            return;
        }

        // Auto-migrate schema: Check existing columns and add missing fields
        db.all("PRAGMA table_info(grievances)", (err, columns) => {
            if (err) {
                console.error('Error reading table columns:', err.message);
                return;
            }

            const existingColumns = columns.map(c => c.name);
            const columnsToAdd = [
                { name: 'roll_number', type: 'TEXT' },
                { name: 'email', type: 'TEXT' },
                { name: 'phone', type: 'TEXT' },
                { name: 'program', type: 'TEXT' },
                { name: 'department', type: 'TEXT' },
                { name: 'year_semester', type: 'TEXT' },
                { name: 'residence_type', type: 'TEXT' },
                { name: 'hostel_name', type: 'TEXT' },
                { name: 'room_number', type: 'TEXT' },
                { name: 'priority', type: 'TEXT DEFAULT "Moderate"' },
                { name: 'subject', type: 'TEXT' },
                { name: 'is_anonymous', type: 'INTEGER DEFAULT 0' },
                { name: 'status', type: 'TEXT DEFAULT "Submitted"' },
                { name: 'admin_remarks', type: 'TEXT' }
            ];

            columnsToAdd.forEach(col => {
                if (!existingColumns.includes(col.name)) {
                    db.run(`ALTER TABLE grievances ADD COLUMN ${col.name} ${col.type}`, (alterErr) => {
                        if (alterErr) {
                            console.error(`Error adding column ${col.name}:`, alterErr.message);
                        } else {
                            console.log(`+ Added missing column: ${col.name}`);
                        }
                    });
                }
            });
        });
    });
}

// API Endpoint to lodge a new grievance
app.post('/api/grievances', (req, res) => {
    const {
        grievanceId,
        studentName,
        rollNumber,
        email,
        phone,
        program,
        department,
        yearSemester,
        residenceType,
        hostelName,
        roomNumber,
        category,
        priority,
        subject,
        description,
        isAnonymous
    } = req.body;

    if (!grievanceId || !category || !description) {
        return res.status(400).json({ 
            success: false, 
            error: "Critical fields (grievanceId, category, description) are required." 
        });
    }

    const finalName = isAnonymous ? "Anonymous Student" : (studentName || "Not Specified");
    const finalRoll = isAnonymous ? "Confidential" : (rollNumber || "Not Specified");
    const finalEmail = isAnonymous ? "" : (email || "");
    const finalPhone = isAnonymous ? "" : (phone || "");
    const finalPriority = priority || "Moderate";
    const finalSubject = subject || `${category} Issue reported`;

    // High Priority & Emergency Alerts in Console
    if (
        finalPriority === "Critical" || 
        finalPriority === "Urgent" || 
        category.includes("Anti-Ragging") || 
        category.includes("Mental Health")
    ) {
        console.log("\n========================================================");
        console.log("🚨 [NIT KKR PROCTORIAL ALERT] URGENT ATTENTION REQUIRED 🚨");
        console.log(`Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
        console.log(`Grievance ID: ${grievanceId}`);
        console.log(`Category: ${category}`);
        console.log(`Priority: ${finalPriority.toUpperCase()}`);
        console.log(`Student: ${finalName} (Roll: ${finalRoll})`);
        console.log(`Department: ${department || 'N/A'} | Year: ${yearSemester || 'N/A'}`);
        console.log(`Hostel/Residence: ${residenceType === 'Day Scholar' ? 'Day Scholar' : (hostelName || 'Hostel') + ' ' + (roomNumber || '')}`);
        console.log(`Subject: ${finalSubject}`);
        console.log(`Details: ${description}`);
        console.log("========================================================\n");
    } else {
        console.log(`[${new Date().toLocaleTimeString('en-IN')}] Grievance logged: ${grievanceId} - ${category} [${finalPriority}]`);
    }

    const insertSql = `
        INSERT INTO grievances (
            grievance_id, student_name, roll_number, email, phone,
            program, department, year_semester, residence_type, hostel_name, room_number,
            category, priority, subject, description, is_anonymous, status, admin_remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', 'Grievance received and routed to concerned NIT KKR authority.')
    `;

    db.run(insertSql, [
        grievanceId,
        finalName,
        finalRoll,
        finalEmail,
        finalPhone,
        program || 'B.Tech',
        department || 'General',
        yearSemester || 'N/A',
        residenceType || 'Hostel Resident',
        hostelName || '',
        roomNumber || '',
        category,
        finalPriority,
        finalSubject,
        description,
        isAnonymous ? 1 : 0
    ], function (err) {
        if (err) {
            console.error('Database insert error:', err.message);
            return res.status(500).json({ success: false, error: 'Database save failed.' });
        }
        res.status(201).json({
            success: true,
            message: 'Grievance lodged successfully',
            grievanceId,
            status: 'Submitted',
            timestamp: new Date().toISOString()
        });
    });
});

// API Endpoint to track grievance status
app.get('/api/grievances/track/:id', (req, res) => {
    const rawId = req.params.id ? req.params.id.trim() : '';
    if (!rawId) {
        return res.status(400).json({ success: false, error: 'Grievance ID required' });
    }

    const query = `
        SELECT grievance_id, category, subject, priority, department, residence_type, hostel_name,
               status, admin_remarks, timestamp, is_anonymous,
               CASE WHEN is_anonymous = 1 THEN 'Anonymous Student' ELSE student_name END as student_display
        FROM grievances 
        WHERE LOWER(grievance_id) = LOWER(?)
    `;

    db.get(query, [rawId], (err, row) => {
        if (err) {
            console.error('Error fetching grievance:', err.message);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ 
                success: false, 
                error: 'No grievance found with this Reference ID. Please verify the ID.' 
            });
        }

        res.json({
            success: true,
            data: row
        });
    });
});

// API Endpoint for basic statistics
app.get('/api/stats', (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
            SUM(CASE WHEN status = 'In Progress' OR status = 'Under Review' THEN 1 ELSE 0 END) as inProgress,
            SUM(CASE WHEN priority = 'Critical' OR priority = 'Urgent' THEN 1 ELSE 0 END) as critical
        FROM grievances
    `;

    db.get(query, [], (err, row) => {
        if (err) {
            return res.json({ total: 0, resolved: 0, inProgress: 0, critical: 0 });
        }
        res.json({
            total: row.total || 0,
            resolved: row.resolved || 0,
            inProgress: row.inProgress || 0,
            critical: row.critical || 0
        });
    });
});

// Health check endpoint for deployment monitoring (Render, Railway, AWS ELB, etc.)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', institute: 'NIT Kurukshetra Grievance Portal', uptime: process.uptime() });
});

// Fallback for non-API routes (SPA support)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 NIT Kurukshetra Grievance Portal active on http://localhost:${PORT}`);
    console.log(`📍 Serving static assets from /public`);
});