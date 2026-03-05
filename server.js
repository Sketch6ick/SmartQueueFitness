const express = require('express');
const { Pool } = require('pg'); // ใช้ pg แทน mysql2
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// เชื่อมต่อกับ Supabase
const db = new Pool({
  connectionString: "postgres://postgres:[kriss2300954]@wwonapzimccwolnmfglh.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false } // จำเป็นสำหรับเชื่อมต่อ Cloud
});

db.connect((err) => {
  if (err) {
    console.error('❌ เชื่อมต่อ Supabase ไม่สำเร็จ:', err.message);
  } else {
    console.log('✅ เชื่อมต่อ Supabase สำเร็จ! ข้อมูลออนไลน์แล้ว 🎉');
  }
});

// --- แก้ไข API Login ให้รองรับ Postgres ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        
        if (result.rows.length > 0) {
            res.json({ user: result.rows[0] });
        } else {
            res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- แก้ไข API ดึงเครื่องเล่น ---
app.get('/api/equipments', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM equipments');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
