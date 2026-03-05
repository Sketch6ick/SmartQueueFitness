const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. การเชื่อมต่อฐานข้อมูล Supabase (Postgres) ---
const db = new Pool({
  // *** สำคัญ: เปลี่ยน [YOUR_PASSWORD] เป็นรหัสผ่านที่คุณตั้งไว้ใน Supabase ***
  connectionString: "postgres://postgres:kriss2300954@wwonapzimccwolnmfglh.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

db.connect((err) => {
  if (err) {
    console.error('❌ เชื่อมต่อ Supabase ล้มเหลว:', err.message);
  } else {
    console.log('✅ เชื่อมต่อ Supabase สำเร็จ! ระบบพร้อมทำงาน 🎉');
  }
});

// --- 2. API สำหรับสมัครสมาชิก (Register) ---
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    console.log(`--- กำลังสมัครสมาชิก: ${username} ---`);

    try {
        // ตรวจสอบว่ามีชื่อผู้ใช้นี้อยู่หรือยัง
        const checkUser = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ message: 'ชื่อผู้ใช้นี้มีคนใช้แล้ว' });
        }

        // บันทึกข้อมูลใหม่
        await db.query(
            'INSERT INTO users (username, password, email, role) VALUES ($1, $2, $3, $4)',
            [username, password, email, 'member']
        );

        console.log("✅ สมัครสมาชิกสำเร็จ");
        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ!' });
    } catch (err) {
        console.error("❌ Register Error:", err.message);
        res.status(500).json({ error: "ไม่สามารถสมัครสมาชิกได้" });
    }
});

// --- 3. API สำหรับเข้าสู่ระบบ (Login) ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`--- ตรวจสอบ Login: ${username} ---`);

    try {
        const result = await db.query(
            'SELECT id, username, password, role FROM users WHERE username = $1', 
            [username]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            // ตรวจสอบรหัสผ่าน (ตัดช่องว่างออกเพื่อความชัวร์)
            if (user.password.trim() === password.trim()) {
                console.log("✅ Login ผ่าน!");
                res.json({ user: { id: user.id, username: user.username, role: user.role } });
            } else {
                console.log("❌ รหัสผ่านไม่ถูกต้อง");
                res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
            }
        } else {
            console.log("❌ ไม่พบชื่อผู้ใช้นี้");
            res.status(401).json({ message: 'ไม่พบชื่อผู้ใช้นี้' });
        }
    } catch (err) {
        console.error("❌ Login Error:", err.message);
        res.status(500).json({ error: "ระบบขัดข้อง" });
    }
});

// --- 4. API สำหรับดึงข้อมูลเครื่องเล่น ---
app.get('/api/equipments', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM equipments ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 5. API สำหรับการจองเครื่องเล่น ---
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
        
        res.json({ message: 'จองคิวสำเร็จ!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// เริ่มต้น Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
// เพิ่มส่วนนี้ใน server.js
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    try {
        await db.query(
            'INSERT INTO users (username, password, email, role) VALUES ($1, $2, $3, $4)',
            [username, password, email, 'member']
        );
        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ!' });
    } catch (err) {
        // ถ้าชื่อซ้ำ Postgres จะฟ้อง Error
        res.status(400).json({ message: 'ชื่อผู้ใช้นี้มีคนใช้แล้ว' });
    }
});

