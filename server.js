const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// เชื่อมต่อ MySQL (ใช้ XAMPP)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fitness_db'
});

db.connect(err => { if (err) console.log('DB Error:', err); else console.log('MySQL Connected!'); });

// --- API: LOGIN ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (results.length > 0) res.json({ user: results[0] });
        else res.status(401).json({ message: 'ผิดพลาด' });
    });
});

// --- API: GET EQUIPMENTS (10 เครื่อง) ---
app.get('/api/equipments', (req, res) => {
    db.query('SELECT * FROM equipments LIMIT 10', (err, results) => res.json(results));
});

// --- API: BOOKING ---
app.post('/api/book', (req, res) => {
    const { user_id, equipment_id, start_time, end_time } = req.body;
    const sql = 'INSERT INTO bookings (user_id, equipment_id, start_time, end_time) VALUES (?, ?, ?, ?)';
    db.query(sql, [user_id, equipment_id, start_time, end_time], (err) => {
        if (err) res.status(500).json(err);
        else res.json({ message: 'จองสำเร็จ!' });
    });
    // ดึงรายชื่อสมาชิกทั้งหมด
app.get('/api/admin/users', (req, res) => {
    db.query('SELECT id, username, role FROM users', (err, results) => {
        res.json(results);
    });
});

// ลบสมาชิก
app.delete('/api/admin/users/:id', (req, res) => {
    db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
        res.json({ message: 'ลบสมาชิกเรียบร้อย' });
    });
});

// ดึงรายการเครื่องเล่นทั้งหมด (สำหรับ Admin)
app.get('/api/admin/equipments', (req, res) => {
    db.query('SELECT * FROM equipments', (err, results) => {
        res.json(results);
    });
});

// ลบเครื่องเล่น
app.delete('/api/admin/equipments/:id', (req, res) => {
    db.query('DELETE FROM equipments WHERE id = ?', [req.params.id], (err) => {
        res.json({ message: 'ลบเครื่องเล่นเรียบร้อย' });
    });
});
});


app.listen(3000, () => console.log('Server running on port 3000'));
