const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();

// --- 1. Middleware ---
app.use(cors()); // อนุญาตให้หน้าเว็บ (Port 5500) คุยกับ Server ได้
app.use(express.json());

// --- 2. การเชื่อมต่อ Supabase ---
// ใช้ URL และ Key จากรูปที่ 31 ของคุณ
const supabaseUrl = 'https://wwonapzimccwolnmfglh.supabase.co';
const supabaseKey = 'sb_publishable_D99j3a2UF6Dsyn4kgEjDNA_xAuH0U4t'; // ก๊อปปี้จากช่อง Publishable key ให้ครบ
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 3. API: เข้าสู่ระบบ (Login) ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !data) return res.status(401).json({ message: 'ไม่พบชื่อผู้ใช้นี้' });

        // ตรวจสอบรหัสผ่าน (แบบง่าย)
        if (data.password.trim() === password.trim()) {
            res.json({ 
                user: { id: data.id, username: data.username, role: data.role } 
            });
        } else {
            res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
        }
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
    }
});

// --- 4. API: สมัครสมาชิก (Register) ---
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    try {
        const { data, error } = await supabase
            .from('users')
            .insert([{ username, password, email, role: 'member' }]);

        if (error) throw error;
        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ!' });
    } catch (err) {
        res.status(400).json({ message: 'สมัครไม่สำเร็จ: ' + err.message });
    }
});

// --- 5. API: จองคิวเครื่องเล่น (Booking) ---
// ส่วนนี้คือส่วนที่คุณต้องการเพิ่มเพื่อให้ปุ่มจองในหน้า index.html กดได้จริง
app.post('/api/booking', async (req, res) => {
    const { username, equipment_name } = req.body;
    try {
        // บันทึกข้อมูลการจองลงตาราง 'bookings' (อย่าลืมไปสร้างตารางนี้ใน Supabase ด้วยนะครับ)
        const { data, error } = await supabase
            .from('bookings')
            .insert([{ 
                username: username, 
                equipment: equipment_name, 
                status: 'pending',
                created_at: new Date() 
            }]);

        if (error) throw error;
        res.status(201).json({ message: 'จองคิวสำเร็จ! กรุณารอเจ้าหน้าที่เรียก' });
    } catch (err) {
        res.status(500).json({ message: 'ไม่สามารถจองได้ในขณะนี้' });
    }
});

// --- 6. เริ่มต้น Server ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 SmartQueue Fitness Server is Running!`);
    console.log(`📡 Local Server: http://localhost:${PORT}`);
    console.log(`✅ Connected to Supabase: ${supabaseUrl}`);
    console.log(`------------------------------------------`);
});
