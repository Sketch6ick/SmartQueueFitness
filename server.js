const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();

// --- 1. ตั้งค่า Middleware ---
app.use(cors()); // สำคัญมาก: ป้องกัน Error "ติดต่อ Server ไม่ได้" จากฝั่ง Browser
app.use(express.json());

// --- 2. เชื่อมต่อ Supabase API (แทนที่การใช้ Pool แบบเก่า) ---
// นำข้อมูลจากรูปที่ 31 (image_3d7a20.png) มาใส่ที่นี่
const supabaseUrl = 'https://wwonapzimccwolnmfglh.supabase.co';
const supabaseKey = 'sb_publishable_D99j3a2UF6Dsyn4kgEjDNA_xAuH0U4t'; // ก๊อปปี้ Anon Key จากหน้าเว็บมาใส่ให้ครบ

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📡 ระบบกำลังทำงานในโหมด Supabase API (Port 443)');

// --- 3. API สำหรับสมัครสมาชิก (Register) ---
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    
    try {
        const { data, error } = await supabase
            .from('users')
            .insert([
                { username, password, email, role: 'member' }
            ]);

        if (error) throw error;

        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ!' });
    } catch (err) {
        console.error('❌ Register Error:', err.message);
        res.status(400).json({ message: 'สมัครสมาชิกไม่สำเร็จ: ' + err.message });
    }
});

// --- 4. API สำหรับเข้าสู่ระบบ (Login) ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !data) {
            return res.status(401).json({ message: 'ไม่พบชื่อผู้ใช้นี้' });
        }

        // ตรวจสอบรหัสผ่าน (ใช้ .trim() ป้องกันช่องว่างเกิน)
        if (data.password.trim() === password.trim()) {
            res.json({ 
                user: { 
                    id: data.id, 
                    username: data.username, 
                    role: data.role 
                } 
            });
        } else {
            res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
        }
    } catch (err) {
        console.error('❌ Login Error:', err.message);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
    }
});

// --- 5. API ดึงข้อมูลเครื่องเล่น (Equipments) ---
app.get('/api/equipments', async (req, res) => {
    const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .order('id', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// --- เริ่มต้น Server ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server พร้อมทำงานที่ http://localhost:${PORT}`);
    console.log(`✅ เชื่อมต่อกับ Supabase URL: ${supabaseUrl}`);
});
