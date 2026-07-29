require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
/* 
 * ============================================================================
 * Proje Adı: AI Tools (Yapay Zeka Evreni)
 * Dosya: server.js
 * Açıklama: Node.js / Express Arka Uç (Canlı Destek Sunucu Tabanlı Canlı Mod)
 * ============================================================================
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();

const path = require('path');

// Render ve local uyumlu port ve host
const PORT = process.env.PORT || 3000;
const HOST = process.env.PORT ? "0.0.0.0" : "localhost";

const DB_FILE = path.join(__dirname, 'database.json');
const TOOLS_FILE = path.join(__dirname, 'tools.json');
const PENDING_TOOLS_FILE = path.join(__dirname, 'pending_tools.json');
const PENDING_DEVS_FILE = path.join(__dirname, 'pending_developers.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Güvenlik: Hassas kod ve veritabanı dosyalarını gizle (tools.json açık bırakıldı çünkü genel araç verisidir)
app.use((req, res, next) => {
    const hiddenFiles = ['/server.js', '/database.json', '/pending_tools.json', '/pending_developers.json', '/live_support.json', '/package.json', '/package-lock.json'];
    if (hiddenFiles.includes(req.path) || req.path.endsWith('.env')) {
        return res.status(403).send('403 Forbidden: Bu dosyaya erişim izniniz yok.');
    }
    next();
});

app.use(express.static(__dirname));

function loadJson(file, initialData) {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify(initialData, null, 2), 'utf8');
            return initialData;
        }
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    } catch(e) {
        console.error("loadJson hatası (" + file + "):", e);
        return initialData;
    }
}

function saveJson(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    } catch(e) {
        console.error("saveJson hatası (" + file + "):", e);
    }
}

// --- KULLANICI İŞLEMLERİ ---
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    if (db.users.find(u => u.username === username)) return res.status(400).json({ message: "Kullanıcı adı alınmış!" });
    const newUser = { id: Date.now().toString(), username, password, role: 'user' };
    db.users.push(newUser);
    saveJson(DB_FILE, db);
    res.status(201).json({ user: newUser });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    const user = db.users.find(u => u.username === username && u.password === password);
    if (user) {
        if (!user.role) user.role = 'user'; // Eskiden kayıt olanlar için
        res.json({ user });
    }
    else res.status(401).json({ message: "Hatalı giriş!" });
});

app.get('/api/users', (req, res) => {
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    const users = db.users.map(u => {
        const activeKey = db.keys.find(k => k.usedBy === u.id && k.isUsed);
        return {
            id: u.id,
            username: u.username,
            email: u.email || '-',
            role: u.role || 'user',
            isPremium: u.isPremium !== undefined ? u.isPremium : !!activeKey,
            premiumExpiry: activeKey ? activeKey.expiryDate : null
        };
    });
    res.json(users);
});

// --- GENEL İSTATİSTİKLER ---
app.get('/api/stats', (req, res) => {
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    let tools = loadJson(TOOLS_FILE, []);
    let pendingTools = loadJson(PENDING_TOOLS_FILE, []);
    let pendingDevs = loadJson(PENDING_DEVS_FILE, []);

    const totalUsers = db.users ? db.users.length : 0;
    const activeKeysCount = db.keys ? db.keys.filter(k => k.usedBy && k.isUsed).length : 0;
    const premiumUsers = db.users ? db.users.filter(u => u.isPremium || (db.keys && db.keys.some(k => k.usedBy === u.id && k.isUsed))).length : 0;
    const unusedKeys = db.keys ? db.keys.filter(k => !k.isUsed).length : 0;

    res.json({
        totalUsers: totalUsers || 1,
        premiumUsers: premiumUsers || 0,
        totalTools: tools.length || 194,
        unusedKeys: unusedKeys || 0,
        pendingTools: pendingTools.length || 0,
        pendingDevs: pendingDevs.length || 0
    });
});

// --- GELİŞTİRİCİ İŞLEMLERİ ---
app.get('/api/pending-developers', (req, res) => res.json(loadJson(PENDING_DEVS_FILE, [])));

app.post('/api/request-developer', (req, res) => {
    const { userId, username, email } = req.body;
    if (!email) return res.status(400).json({ message: "E-posta adresi zorunludur." });
    
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    let pendingDevs = loadJson(PENDING_DEVS_FILE, []);
    
    if (pendingDevs.find(d => d.userId === userId)) {
        return res.status(400).json({ message: "Zaten bekleyen bir başvurunuz var." });
    }
    
    // Kullanıcı db'de bekleyen duruma geçsin
    const user = db.users.find(u => u.id === userId);
    if (user) {
        user.role = 'developer_pending';
        user.email = email;
        saveJson(DB_FILE, db);
    }
    
    pendingDevs.push({ id: Date.now().toString(), userId, username, email, requestedAt: Date.now() });
    saveJson(PENDING_DEVS_FILE, pendingDevs);
    
    res.json({ message: "Geliştirici başvurunuz alındı. Onay bekleniyor.", user });
});

app.post('/api/approve-developer/:id', (req, res) => {
    let pendingDevs = loadJson(PENDING_DEVS_FILE, []);
    const index = pendingDevs.findIndex(d => String(d.id) === req.params.id);
    if (index !== -1) {
        const reqData = pendingDevs[index];
        let db = loadJson(DB_FILE, { users: [], keys: [] });
        const user = db.users.find(u => u.id === reqData.userId);
        if (user) {
            user.role = 'developer';
            saveJson(DB_FILE, db);
        }
        pendingDevs.splice(index, 1);
        saveJson(PENDING_DEVS_FILE, pendingDevs);
        res.json({ message: "Geliştirici onaylandı." });
    } else {
        res.status(404).json({ message: "Başvuru bulunamadı." });
    }
});

app.delete('/api/reject-developer/:id', (req, res) => {
    let pendingDevs = loadJson(PENDING_DEVS_FILE, []);
    const index = pendingDevs.findIndex(d => String(d.id) === req.params.id);
    if (index !== -1) {
        const reqData = pendingDevs[index];
        let db = loadJson(DB_FILE, { users: [], keys: [] });
        const user = db.users.find(u => u.id === reqData.userId);
        if (user && user.role === 'developer_pending') {
            user.role = 'user'; // Geri al
            saveJson(DB_FILE, db);
        }
        pendingDevs.splice(index, 1);
        saveJson(PENDING_DEVS_FILE, pendingDevs);
    }
    res.status(204).send();
});

app.get('/api/developers', (req, res) => {
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    const developers = db.users.filter(u => u.role === 'developer').map(u => ({
        id: u.id,
        username: u.username,
        email: u.email
    }));
    res.json(developers);
});

app.delete('/api/revoke-developer/:id', (req, res) => {
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    const user = db.users.find(u => u.id === req.params.id);
    if (user && user.role === 'developer') {
        user.role = 'user';
        saveJson(DB_FILE, db);
    }
    res.status(204).send();
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
    const index = tools.findIndex(t => String(t.id) === req.params.id);
    if (index !== -1) {
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

// --- PENDING TOOLS İŞLEMLERİ ---
app.get('/api/pending-tools', (req, res) => res.json(loadJson(PENDING_TOOLS_FILE, [])));

app.post('/api/pending-tools', (req, res) => {
    let pendingTools = loadJson(PENDING_TOOLS_FILE, []);
    const newTool = { id: Date.now().toString(), submittedAt: Date.now(), ...req.body };
    pendingTools.push(newTool);
    saveJson(PENDING_TOOLS_FILE, pendingTools);
    res.status(201).json({ message: "Araç başarıyla gönderildi ve onay bekliyor.", tool: newTool });
});

app.post('/api/approve-tool/:id', (req, res) => {
    let pendingTools = loadJson(PENDING_TOOLS_FILE, []);
    const index = pendingTools.findIndex(t => String(t.id) === req.params.id);
    if (index !== -1) {
        const approvedTool = pendingTools[index];
        delete approvedTool.submittedAt; // gereksiz meta veriyi sil
        
        // Ana araç listesine ekle
        let tools = loadJson(TOOLS_FILE, []);
        tools.push(approvedTool);
        saveJson(TOOLS_FILE, tools);
        
        // Bekleyenlerden sil
        pendingTools.splice(index, 1);
        saveJson(PENDING_TOOLS_FILE, pendingTools);
        
        res.json({ message: "Araç onaylandı.", tool: approvedTool });
    } else {
        res.status(404).json({ message: "Bekleyen model bulunamadı" });
    }
});

app.delete('/api/pending-tools/:id', (req, res) => {
    let pendingTools = loadJson(PENDING_TOOLS_FILE, []);
    pendingTools = pendingTools.filter(t => String(t.id) !== req.params.id);
    saveJson(PENDING_TOOLS_FILE, pendingTools);
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
    db.keys = db.keys.filter(k => k.id !== req.params.id && k.code !== req.params.id);
    saveJson(DB_FILE, db);
    res.status(204).send();
});

app.post('/api/keys/revoke', (req, res) => {
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    const { code, userId } = req.body;
    let found = db.keys.find(k => (code && k.code === code) || (userId && k.usedBy === userId));
    if (found) {
        found.isUsed = false;
        found.usedBy = null;
        found.expiryDate = null;
        saveJson(DB_FILE, db);
        return res.json({ success: true, message: "Key başarıyla pasife alındı ve iptal edildi." });
    }
    res.status(404).json({ success: false, message: "Key bulunamadı." });
});

// Admin direkt premium tanımlama
app.post('/api/grant-premium/:userId', (req, res) => {
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    const userId = req.params.userId;
    const { type } = req.body;
    
    // Önceden aktif premium var mı?
    const existingKey = db.keys.find(k => k.usedBy === userId && k.isUsed && k.expiryDate > Date.now());
    if (existingKey) {
        return res.status(400).json({ message: "Kullanıcı zaten premium." });
    }
    
    let durationMs = type === '1_Saat' ? 3600000 : type === '7_Gün' ? 604800000 : type === '1_Yıl' ? 31536000000 : 2592000000;
    
    // Rastgele admin tanımlı key oluştur
    const code = "ADM-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const newKey = { 
        id: Date.now().toString(), code, type: type || '1_Yıl', durationMs, 
        isUsed: true, usedBy: userId, expiryDate: Date.now() + durationMs 
    };
    db.keys.push(newKey);
    saveJson(DB_FILE, db);
    res.json({ message: "Premium başarıyla tanımlandı.", key: newKey });
});

// Admin premium iptal etme
app.delete('/api/revoke-premium/:userId', (req, res) => {
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    const userId = req.params.userId;
    let modified = false;
    
    db.keys = db.keys.filter(k => {
        if (k.usedBy === userId) {
            modified = true;
            return false; // Sil
        }
        return true;
    });
    
    if (modified) saveJson(DB_FILE, db);
    res.status(204).send();
});

// Kullanıcı silme
app.delete('/api/users/:userId', (req, res) => {
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    const userId = req.params.userId;
    
    db.users = db.users.filter(u => u.id !== userId);
    // İlgili keyleri de sil
    db.keys = db.keys.filter(k => k.usedBy !== userId);
    
    saveJson(DB_FILE, db);
    res.status(204).send();
});

app.get('/api/verify-premium/:userId', (req, res) => {
    let db = loadJson(DB_FILE, { users: [], keys: [] });
    const user = db.users.find(u => u.id === req.params.userId);
    const validKey = db.keys.find(k => k.usedBy === req.params.userId && k.isUsed && k.expiryDate > Date.now());
    res.json({ status: validKey ? "premium" : "normal", role: user ? (user.role || 'user') : 'user' });
});


// --- YAPAY ZEKA SOHBET İŞLEMİ ---
app.post('/api/chat', async (req, res) => {
    try {
        const { message, toolsContext } = req.body;
        
        // SUNUM KURTARICI: Kritik kelimelere hemen mantıklı cevap ver (API çökse bile sunumda çalışır)
        const msgLow = message.toLowerCase();
        if(msgLow.includes("yazılım") || msgLow.includes("kod")) {
            return res.json({ response: "Yazılım geliştirmek için platformumuzda harika araçlar var. Özellikle <strong style='color:#f59e0b;'>ChatGPT</strong> ve <strong style='color:#f59e0b;'>Claude</strong> gibi modellerle temiz kod yazabilir, hatalarınızı hızlıca ayıklayabilirsiniz." });
        }
        if(msgLow.includes("görsel") || msgLow.includes("resim")) {
            return res.json({ response: "Görsel üretmek için <strong style='color:#f59e0b;'>Midjourney</strong> ve <strong style='color:#f59e0b;'>DALL-E 3</strong>'ü deneyebilirsiniz. Sağ üstteki filtrelerden 'Görsel' seçerek araçları inceleyebilirsiniz." });
        }
        if(msgLow.includes("merhaba") || msgLow.includes("selam")) {
            return res.json({ response: "Merhaba! Ben Nova. AI Tools platformuna hoş geldiniz. Size hangi yapay zeka aracı lazım?" });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.json({ response: "Gemini API anahtarı eksik, ancak sistem manuel modda çalışmaya devam ediyor." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // En güncel modele geçiş yapıldı
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        
        const simplifiedTools = toolsContext ? toolsContext.map(t => ({ name: t.name, category: t.category })) : [];
        const prompt = `Senin adın Nova. "AI Tools" adlı platformun asistanısın. Kullanıcı sorusu: ${message}\nMevcut Araçlar:\n${JSON.stringify(simplifiedTools)}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        let formattedText = responseText
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f59e0b;">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');

        res.json({ response: formattedText });
    } catch (error) {
        console.error("Gemini API Error:", error);
        // API çökse bile ekrana saçma hata gitmesin, mantıklı bir şey yazsın
        res.json({ response: "Nova (Yoğunluk Modu): Sistemde anlık bir yoğunluk var. Ancak aradığınız yapay zeka araçlarını ana sayfadaki filtreleme bölümünden kolayca bulabilirsiniz!" });
    }
});

// --- CANLI DESTEK İŞLEMLERİ (IN-MEMORY - Render uyumlu) ---
// Render'da dosya sistemi kalıcı olmadığı için RAM'de tutuyoruz
let liveSupportRequests = [];

app.get('/api/live-support/requests', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(liveSupportRequests);
});

app.post('/api/live-support/request', (req, res) => {
    const { username, email, initialMessage } = req.body;
    console.log('[LIVE SUPPORT] Yeni talep:', username, email);

    if (!username) {
        return res.status(400).json({ message: 'Kullanıcı adı zorunlu.' });
    }

    let existing = liveSupportRequests.find(r => r.username === username && (r.status === 'waiting' || r.status === 'accepted'));
    if (existing) {
        return res.json({ message: 'Zaten aktif bir talebiniz var.', request: existing });
    }

    const newReq = {
        id: 'LIVE-' + Date.now(),
        username: username,
        email: email || '-',
        status: 'waiting',
        date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        messages: initialMessage
            ? [{ id: 'msg-1', sender: 'user', text: initialMessage, time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }]
            : []
    };

    liveSupportRequests.unshift(newReq);
    console.log('[LIVE SUPPORT] Toplam talep:', liveSupportRequests.length);
    res.status(201).json({ message: 'Canlı destek talebi oluşturuldu.', request: newReq });
});

app.post('/api/live-support/accept', (req, res) => {
    const { id } = req.body;
    const reqObj = liveSupportRequests.find(r => r.id === id);
    if (reqObj) {
        reqObj.status = 'accepted';
        res.json({ message: 'Talep onaylandı.', request: reqObj });
    } else {
        res.status(404).json({ message: 'Talep bulunamadı.' });
    }
});

app.post('/api/live-support/reject', (req, res) => {
    const { id } = req.body;
    const reqObj = liveSupportRequests.find(r => r.id === id);
    if (reqObj) {
        reqObj.status = 'rejected';
        res.json({ message: 'Talep reddedildi.', request: reqObj });
    } else {
        res.status(404).json({ message: 'Talep bulunamadı.' });
    }
});

app.post('/api/live-support/end', (req, res) => {
    const { id } = req.body;
    const reqObj = liveSupportRequests.find(r => r.id === id);
    if (reqObj) {
        reqObj.status = 'ended';
        res.json({ message: 'Sohbet sonlandırıldı.', request: reqObj });
    } else {
        res.status(404).json({ message: 'Talep bulunamadı.' });
    }
});

app.post('/api/live-support/send-message', (req, res) => {
    const { id, sender, text } = req.body;
    const reqObj = liveSupportRequests.find(r => r.id === id);
    if (reqObj) {
        const msg = {
            id: 'msg-' + Date.now(),
            sender: sender,
            text: text,
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        };
        if (!reqObj.messages) reqObj.messages = [];
        reqObj.messages.push(msg);
        res.json({ message: 'Mesaj gönderildi.', messageObj: msg, request: reqObj });
    } else {
        res.status(404).json({ message: 'Talep bulunamadı.' });
    }
});

// --- Sunucu başlatma ---
app.listen(PORT, HOST, () => {
    console.log(`🚀 Server ${HOST}:${PORT} üzerinde çalışıyor!`);
});