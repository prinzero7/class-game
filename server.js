const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
app.use(express.static('public'));

let players = [];
const questions = [
    { q: "คำสั่งแสดงผลภาษา C คือ?", a: ["printf", "scanf", "input", "echo"], ans: 0 },
    { q: "ตัวแปร int ใช้เก็บอะไร?", a: ["ทศนิยม", "จำนวนเต็ม", "ตัวอักษร", "ข้อความ"], ans: 1 },
    { q: "คำสั่งรับค่าคือ?", a: ["output", "scanf", "read", "scan"], ans: 1 },
    { q: "สัญลักษณ์ & ใน scanf ใช้ทำไม?", a: ["เว้นวรรค", "บอกที่อยู่", "ขึ้นบรรทัดใหม่", "เชื่อมข้อความ"], ans: 1 },
    { q: "%f แสดงผลอะไร?", a: ["ทศนิยม", "จำนวนเต็ม", "ตัวอักษร", "ข้อความ"], ans: 0 },
    { q: "การประกาศ int a = 10; คือ?", a: ["ประกาศทศนิยม", "ประกาศจำนวนเต็ม", "ประกาศตัวอักษร", "ประกาศข้อความ"], ans: 1 },
    { q: "\\n คืออะไร?", a: ["เว้นวรรค", "จบโปรแกรม", "ขึ้นบรรทัดใหม่", "แสดงผล"], ans: 2 },
    { q: "%c ใช้กับอะไร?", a: ["ข้อความ", "เลขจำนวนเต็ม", "ตัวอักษรเดียว", "ทศนิยม"], ans: 2 },
    { q: "ตัวแปรแบบไหนเก็บทศนิยม?", a: ["int", "char", "float", "short"], ans: 2 },
    { q: "scanf(\"%d\", &x); ถ้าลืม & จะเกิด?", a: ["โปรแกรมค้าง", "ไม่เกิดอะไรขึ้น", "แสดงผลผิด", "คอมไพล์ไม่ผ่าน"], ans: 0 },
    { q: "printf อยู่ใน library ใด?", a: ["math.h", "stdio.h", "conio.h", "string.h"], ans: 1 },
    { q: "ชื่อตัวแปรข้อใดถูกต้อง?", a: ["1stNum", "my_var", "int", "break"], ans: 1 },
    { q: "การแสดงผลทศนิยม 2 ตำแหน่ง?", a: ["%.2f", "%2f", "%f2", "%2.f"], ans: 0 },
    { q: "ตัวแปร char ขนาดกี่ byte?", a: ["1", "2", "4", "8"], ans: 0 },
    { q: "คำสั่งใดใช้ทำซ้ำ?", a: ["if", "while", "printf", "scanf"], ans: 1 }
];
let wrongCounts = new Array(questions.length).fill(0);

io.on('connection', (socket) => {
    socket.on('join', (name) => {
        // กันคนซ้ำ
        players = players.filter(p => p.id !== socket.id);
        players.push({ id: socket.id, name: name, score: 0, ready: false, answeredCount: 0, wrongQ: [] });
        io.emit('update_players', players);
    });
    
    socket.on('mark_ready', () => {
        let p = players.find(x => x.id === socket.id);
        if(p) { p.ready = true; io.emit('update_players', players); }
    });

    socket.on('admin_start', () => {
        wrongCounts = new Array(questions.length).fill(0);
        players.forEach(p => { p.score = 0; p.answeredCount = 0; p.wrongQ = []; });
        let qs = questions.map((q,i)=>({...q, originalIdx: i})).sort(()=>Math.random()-0.5);
        io.emit('game_start', qs);
    });

    socket.on('submit', (data) => {
        let p = players.find(x => x.id === socket.id);
        // แก้ไข: ใส่ if (p) ครอบไว้เพื่อป้องกัน Error
        if (p && data.qObj) {
            if (data.ans !== -1) {
                if (data.ans !== data.qObj.ans) { wrongCounts[data.qObj.originalIdx]++; p.wrongQ.push(data.qObj); }
                else { p.score += 5; }
            }
            p.answeredCount = data.idx + 1;
            
            // ส่งอัปเดตคะแนน
            io.emit('score_update', { players, wrongCounts });
            
            // เช็คจบเกม
            if(p.answeredCount >= questions.length) {
                io.to(socket.id).emit('game_over', p);
            }
        }
    });

    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        io.emit('update_players', players);
    });
});

// ลบบรรทัด http.listen(3000, ...) ออกไปเลยครับ

// ให้เหลือแค่ชุดนี้ชุดเดียว:
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});