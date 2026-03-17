const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = 3000;

const DB_FILE = './database.json';
const TOOLS_FILE = './tools.json';

app.use(cors());
app.use(express.json());

function loadJson(file, initialData) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    const data = fs.readFileSync(file);
    return JSON.parse(data);
}

function saveJson(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// --- KULLANICI İŞLEMLERİ ---
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    if (db.users.find(u => u.username === username)) return res.status(400).json({ message: "Kullanıcı adı alınmış!" });
    const newUser = { id: Date.now().toString(), username, password };
    db.users.push(newUser);
    saveJson(DB_FILE, db);
    res.status(201).json({ user: newUser });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    const user = db.users.find(u => u.username === username && u.password === password);
    if (user) res.json({ user });
    else res.status(401).json({ message: "Hatalı giriş!" });
});

// --- MODEL İŞLEMLERİ ---
app.get('/api/tools', (req, res) => res.json(loadJson(TOOLS_FILE, [])));

app.post('/api/tools', (req, res) => {
    let tools = loadJson(TOOLS_FILE, []);
    const newTool = { id: Date.now().toString(), ...req.body };
    tools.push(newTool);
    saveJson(TOOLS_FILE, tools);
    res.status(201).json(newTool);
});

app.put('/api/tools/:id', (req, res) => {
    let tools = loadJson(TOOLS_FILE, []);
    // Sayısal ID sorununu String(t.id) ile burada da çözüyoruz
    const index = tools.findIndex(t => String(t.id) === req.params.id);
    if (index !== -1) {
        // Eski ek alanları (url, longDescription vb.) kaybetmemek için objeleri birleştiriyoruz
        tools[index] = { ...tools[index], ...req.body };
        saveJson(TOOLS_FILE, tools);
        res.json(tools[index]);
    } else {
        res.status(404).json({ message: "Model bulunamadı" });
    }
});

app.delete('/api/tools/:id', (req, res) => {
    let tools = loadJson(TOOLS_FILE, []);
    tools = tools.filter(t => String(t.id) !== req.params.id);
    saveJson(TOOLS_FILE, tools);
    res.status(204).send();
});

// --- KEY İŞLEMLERİ ---
app.get('/api/keys', (req, res) => {
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    const keysWithUsers = db.keys.map(key => {
        let username = "-";
        if (key.usedBy) {
            const user = db.users.find(u => u.id === key.usedBy);
            if (user) username = user.username;
        }
        return { ...key, username };
    });
    res.json(keysWithUsers);
});

app.post('/api/keys', (req, res) => {
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    const { code, type } = req.body;
    let durationMs = type === '1_Saat' ? 3600000 : type === '7_Gün' ? 604800000 : type === '1_Yıl' ? 31536000000 : 2592000000;
    const newKey = { id: Date.now().toString(), code, type, durationMs, isUsed: false, usedBy: null, expiryDate: null };
    db.keys.push(newKey);
    saveJson(DB_FILE, db);
    res.status(201).json(newKey);
});

app.post('/api/activate-key', (req, res) => {
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    const { key, userId } = req.body;
    const foundKey = db.keys.find(k => k.code === key && !k.isUsed);
    if (foundKey) {
        foundKey.isUsed = true;
        foundKey.usedBy = userId;
        foundKey.expiryDate = Date.now() + foundKey.durationMs;
        saveJson(DB_FILE, db);
        res.json({ success: true });
    } else res.status(400).json({ success: false });
});

app.delete('/api/keys/:id', (req, res) => {
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    db.keys = db.keys.filter(k => k.id !== req.params.id);
    saveJson(DB_FILE, db);
    res.status(204).send();
});

app.get('/api/verify-premium/:userId', (req, res) => {
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    const validKey = db.keys.find(k => k.usedBy === req.params.userId && k.isUsed && k.expiryDate > Date.now());
    res.json({ status: validKey ? "premium" : "normal" });
});

app.listen(PORT, () => console.log(`🚀 Server http://localhost:${PORT} adresinde çalışıyor!`));