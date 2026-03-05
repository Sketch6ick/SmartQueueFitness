const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- ดึงข้อมูลจากรูปที่ 31 (image_3d7a20.png) มาใส่ตรงนี้ ---
const supabaseUrl = 'https://wwonapzimccwolnmfglh.supabase.co';
const supabaseKey = 'sb_publishable_D99j3a2UF6Dsyn4kgEjDNA_xAuH0U4t'; 

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📡 กำลังใช้ Supabase API Mode (ปลอดภัยจาก Timeout)');

// --- API สำหรับเข้าสู่ระบบ (Login) ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    // ดึงข้อมูลจากตาราง users ที่คุณสร้างไว้ในรูปที่ 25
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

    if (error || !data) {
        return res.status(401).json({ message: 'ไม่พบชื่อผู้ใช้นี้' });
    }

    if (data.password.trim() === password.trim()) {
        res.json({ user: { id: data.id, username: data.username, role: data.role } });
    } else {
        res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }
});

// --- API สำหรับดึงข้อมูลเครื่องเล่น (Equipments) ---
app.get('/api/equipments', async (req, res) => {
    const { data, error } = await supabase.from('equipments').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server พร้อมทำงานที่ http://localhost:${PORT}`);
});
