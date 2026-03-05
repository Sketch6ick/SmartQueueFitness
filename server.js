const express = require('express');
const { Pool } = require('pg'); // ใช้ pg สำหรับ Supabase (Postgres)
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. การเชื่อมต่อ Supabase (แทนที่ MySQL เดิม) ---
const db = new Pool({
  // *** สำคัญมาก: ใส่รหัสผ่านของคุณตรง [YOUR_PASSWORD] ***
  connectionString: "postgres://postgres:saget23009pro@wwonapzimccwolnmfglh.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

// ตรวจสอบการเชื่อมต่อ
db.connect((err) => {
  if (err) {
    console.error('❌ เชื่อมต่อ Supabase ล้มเหลว:', err.message);
    console.log('กรุณาเช็คว่าใส่ Password ถูกต้อง และอินเทอร์เน็ตใช้งานได้');
  } else {
    console.log('✅ เชื่อมต่อ Supabase สำเร็จ! (พอร์ต 5432)');
  }
});

// --- 2. API สำหรับสมัครสมาชิก (Register) ---
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    try {
        const sql = 'INSERT INTO users (username, password, email, role) VALUES ($1, $2, $3, $4)';
        await db.query(sql, [username, password, email, 'member']);
        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ!' });
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ message: 'ชื่อผู้ใช้นี้อาจมีคนใช้แล้ว' });
    }
});

// --- 3. API สำหรับเข้าสู่ระบบ (Login) ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const sql = 'SELECT id, username, password, role FROM users WHERE username = $1';
        const result = await db.query(sql, [username]);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            // ตรวจสอบรหัสผ่าน (ตัดช่องว่างออกเพื่อความแม่นยำ)
            if (user.password.trim() === password.trim()) {
                res.json({ user: { id: user.id, username: user.username, role: user.role } });
            } else {
                res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
            }
        } else {
            res.status(401).json({ message: 'ไม่พบชื่อผู้ใช้นี้' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 4. API ดึงข้อมูลเครื่องเล่น ---
app.get('/api/equipments', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM equipments ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 5. API การจองเครื่องเล่น ---
app.post('/api/book', async (req, res) => {
    const { user_id, equipment_id, start_time, end_time } = req.body;
    try {
        // บันทึกการจอง
        await db.query(
            'INSERT INTO bookings (user_id, equipment_id, start_time, end_time, status) VALUES ($1, $2, $3, $4, $5)',
            [user_id, equipment_id, start_time, end_time, 'confirmed']
        );
        // อัปเดตสถานะเครื่องเล่น
        await db.query('UPDATE equipments SET status = $1 WHERE id = $2', ['busy', equipment_id]);
        res.json({ message: 'จองสำเร็จ!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// เริ่มต้น Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server พร้อมทำงานที่ http://localhost:${PORT}`);
});


