require('dotenv').config();
const SteamUser = require('steam-user');
const express = require('express'); // 1. นำเข้า express

const app = express();
const port = process.env.PORT || 3000; // Render จะส่งพอร์ตมาทาง process.env.PORT

// 2. สร้างหน้าเว็บเปล่าๆ เพื่อให้ Render รู้ว่าโปรแกรมเราทำงานอยู่
app.get('/', (req, res) => {
    res.send('Steam Idler is Active and Running!');
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
    client.setPersona(SteamUser.EPersonaState.Online);

    const gamesToPlay = [381210]; // Dead by Daylight
    client.gamesPlayed(gamesToPlay);
    console.log(`กำลังจำลองการเล่นเกม AppID: ${gamesToPlay.join(', ')}...`);
});

client.on('error', (err) => {
    console.error('เกิดข้อผิดพลาดในการเชื่อมต่อ:', err.message);
});