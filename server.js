const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. การเชื่อมต่อฐานข้อมูล Supabase (Postgres) ---
const db = new Pool({
  // เปลี่ยน [YOUR_PASSWORD] เป็นรหัสผ่านที่คุณตั้งไว้ใน Supabase
  connectionString: "postgres://postgres:kriss2300954@wwonapzimccwolnmfglh.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

db.connect((err) => {
  if (err) {
    console.error('❌ เชื่อมต่อ Supabase ล้มเหลว:', err.message);
  } else {
    console.log('✅ เชื่อมต่อ Supabase สำเร็จ! พร้อมใช้งาน 🎉');
  }
});

// --- 2. API สำหรับ Login ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`ระบบกำลังตรวจสอบ Login: ${username}`);

    try {
        // ใช้ $1, $2 สำหรับ Postgres แทนเครื่องหมาย ?
        const result = await db.query(
            'SELECT id, username, role FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length > 0) {
            console.log("✅ เข้าสู่ระบบสำเร็จ");
            res.json({ user: result.rows[0] });
        } else {
            console.log("❌ รหัสผ่านผิดหรือไม่มีชื่อผู้ใช้");
            res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
    } catch (err) {
        console.error("Internal Error:", err.message);
        res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
    }
});

// --- 3. API สำหรับดึงข้อมูลเครื่องเล่น ---
app.get('/api/equipments', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM equipments ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 4. API สำหรับจองเครื่องเล่น ---
app.post('/api/book', async (req, res) => {
    const { user_id, equipment_id, start_time, end_time } = req.body;
    try {
        // 1. บันทึกการจอง
        await db.query(
            'INSERT INTO bookings (user_id, equipment_id, start_time, end_time, status) VALUES ($1, $2, $3, $4, $5)',
            [user_id, equipment_id, start_time, end_time, 'confirmed']
        );
        // 2. อัปเดตสถานะเครื่องเล่นเป็นไม่ว่าง (busy)
        await db.query('UPDATE equipments SET status = $1 WHERE id = $2', ['busy', equipment_id]);

        res.json({ message: 'จองคิวสำเร็จแล้ว!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 5. API สำหรับ Admin: จัดการ User ---
app.get('/api/admin/users', async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, role FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ message: 'ลบสมาชิกเรียบร้อย' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// เริ่มต้น Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server กำลังรันที่ http://localhost:${PORT}`);
});

