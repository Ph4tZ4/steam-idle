require('dotenv').config();
const SteamUser = require('steam-user');
const express = require('express'); // 1. นำเข้า express

const app = express();
const port = process.env.PORT || 3000; // Render จะส่งพอร์ตมาทาง process.env.PORT

// 2. สร้างหน้าเว็บเปล่าๆ เพื่อให้ Render รู้ว่าโปรแกรมเราทำงานอยู่
// บันทึกเวลาเริ่มต้นทันทีที่สคริปต์ทำงาน
const startTime = Date.now();

// 1. สถานะของบอท (Dynamic Status)
let currentStatus = '🟡 กำลังเตรียมการเชื่อมต่อ...';
let needSteamGuard = false;
let steamGuardCallback = null;

// เพิ่ม middleware สำหรับอ่านข้อมูลจากฟอร์ม
app.use(express.urlencoded({ extended: true }));

// 3. Healthcheck Route สำหรับ Cron-job
app.get('/ping', (req, res) => {
    res.status(200).send('OK');
});

// Route รับรหัส Steam Guard จากหน้าเว็บ
app.post('/steamguard', (req, res) => {
    const code = req.body.code;
    if (steamGuardCallback && code) {
        steamGuardCallback(code.trim().toUpperCase());
        steamGuardCallback = null; // ล้างค่าออกหลังจากส่งแล้ว
        needSteamGuard = false;
        currentStatus = '🟡 กำลังตรวจสอบรหัส Steam Guard...';
    }
    res.redirect('/');
});

app.get('/', (req, res) => {
    // คำนวณเวลาที่ผ่านไป (มิลลิวินาที -> วินาที, นาที, ชั่วโมง)
    const uptimeMillis = Date.now() - startTime;
    const hours = Math.floor(uptimeMillis / 3600000);
    const minutes = Math.floor((uptimeMillis % 3600000) / 60000);
    const seconds = Math.floor((uptimeMillis % 60000) / 1000);

    // สร้างหน้าเว็บ HTML แบบฝังตัว (Inline HTML) พร้อมตกแต่งด้วย CSS สไตล์ Steam
    const htmlResponse = `
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Steam Idler Dashboard</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    background-color: #1b2838; /* สีพื้นหลังโทน Steam */
                    color: #c7d5e0; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    height: 100vh; 
                    margin: 0; 
                }
                .dashboard-card { 
                    background: linear-gradient(to bottom, #2a475e, #1b2838);
                    padding: 40px; 
                    border-radius: 12px; 
                    box-shadow: 0 10px 20px rgba(0,0,0,0.5);
                    text-align: center;
                }
                h1 { color: #66c0f4; margin-bottom: 10px; }
                .time-display { 
                    font-size: 2.5em; 
                    font-weight: bold; 
                    color: #a4d007; /* สีเขียวตอนกำลังเล่นเกมของ Steam */
                    margin: 20px 0; 
                }
                .status { font-size: 1.2em; color: #8f98a0; }
            </style>
        </head>
        <body>
            <div class="dashboard-card">
                <h1>🎮 Steam Idler Status</h1>
                <div class="status">${currentStatus}</div>
                ${needSteamGuard ? `
                <form action="/steamguard" method="POST" style="margin-top:20px;">
                    <input type="text" name="code" placeholder="รหัส Guard 5 หลัก" required autocomplete="off" style="padding:10px; border-radius:5px; border:none; outline:none; font-size:1.2em; text-align:center; text-transform:uppercase; width:220px; background:#2a475e; color:#c7d5e0; margin-bottom:15px;">
                    <br>
                    <button type="submit" style="padding:10px 20px; border-radius:5px; border:none; background-color:#66c0f4; color:#fff; font-weight:bold; cursor:pointer; font-size:1.1em; transition: background 0.2s;">
                        ส่งรหัสยืนยัน
                    </button>
                    <div style="margin-top: 15px; font-size: 0.9em; color: #8f98a0;">(หรือกดยืนยันผ่านแอป Steam ในมือถือได้เลย)</div>
                </form>
                ` : `
                <div class="time-display" id="time">
                    ${hours} ชม. ${minutes} นาที ${seconds} วินาที
                </div>
                <div class="status">อัปเดตเวลาอัตโนมัติ 🟢</div>
                `}
            </div>
            <script>
                const timeEl = document.getElementById('time');
                if (timeEl) {
                    const initialUptime = ${uptimeMillis};
                    const pageLoadTime = Date.now();
                    
                    setInterval(() => {
                        const currentUptime = initialUptime + (Date.now() - pageLoadTime);
                        const h = Math.floor(currentUptime / 3600000);
                        const m = Math.floor((currentUptime % 3600000) / 60000);
                        const s = Math.floor((currentUptime % 60000) / 1000);
                        timeEl.innerText = h + ' ชม. ' + m + ' นาที ' + s + ' วินาที';
                    }, 1000);
                }
            </script>
        </body>
        </html>
    `;

    res.send(htmlResponse);
});

// สั่งให้ Web Server เริ่มทำงาน
app.listen(port, () => {
    console.log(`[Web Server] กำลังรันอยู่ที่พอร์ต ${port}`);
});

// ==========================================
// ส่วนโค้ด Steam Idler (ใช้เหมือนเดิมได้เลย)
// ==========================================
const client = new SteamUser();

if (!process.env.STEAM_USERNAME || !process.env.STEAM_PASSWORD) {
    console.error('ข้อผิดพลาด: กรุณาตั้งค่า STEAM_USERNAME และ STEAM_PASSWORD');
    process.exit(1);
}

client.logOn({
    accountName: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD
});

client.on('loggedOn', () => {
    console.log('ล็อกอินเข้าสู่ระบบ Steam สำเร็จแล้ว!');
    needSteamGuard = false;
    steamGuardCallback = null;
    client.setPersona(SteamUser.EPersonaState.Online);

    const gamesToPlay = [381210]; // Dead by Daylight
    client.gamesPlayed(gamesToPlay);
    console.log(`กำลังจำลองการเล่นเกม AppID: ${gamesToPlay.join(', ')}...`);

    // อัปเดตสถานะเป็นออนไลน์
    currentStatus = `🟢 ออนไลน์: กำลังปั๊มชั่วโมง อ้างอิง AppID: ${gamesToPlay.join(', ')}`;
});

// ดักจับเหตุการณ์เมื่อต้องการรหัส Steam Guard (รอรับรหัส หรือกดยืนยันในแอป)
client.on('steamGuard', (domain, callback, lastCodeWrong) => {
    if (lastCodeWrong) {
        console.warn('[SteamGuard] รหัส Steam Guard ผิด กรุณากรอกใหม่!');
        currentStatus = '🔴 รหัส Steam Guard ผิด! กรุณากรอกใหม่ หรือกดยืนยันในแอป';
    } else {
        console.log('[SteamGuard] ระบบต้องการรหัส Steam Guard กรุณากรอกในหน้าเว็บ หรือกดยืนยันในแอปมือถือ');
        currentStatus = '🟡 ระบบต้องการรหัส Steam Guard (กรุณากรอกรหัส หรือกดยืนยันแอปมือถือ...)';
    }
    needSteamGuard = true;
    steamGuardCallback = callback;
});

// 2. ดักจับเหตุการณ์เมื่อหลุดจากเซิร์ฟเวอร์ (เช่นช่วง Maintenance วันพุธ)
client.on('disconnected', (eresult, msg) => {
    console.warn(`[Steam] หลุดการเชื่อมต่อ (รหัส: ${eresult}${msg ? ', ' + msg : ''}) บอทจะทำการเชื่อมต่อใหม่ให้อัตโนมัติ`);
    currentStatus = `🔴 ออฟไลน์: ขาดการเชื่อมต่อ รอระบบ Reconnect...`;
});

client.on('error', (err) => {
    console.error('เกิดข้อผิดพลาดในการเชื่อมต่อ:', err.message);
    currentStatus = `🔴 ข้อผิดพลาด: ${err.message}`;
});