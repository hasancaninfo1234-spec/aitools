const API_BASE = 'http://localhost:3000';
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let isLoginMode = true;
let allTools = [];

document.addEventListener('DOMContentLoaded', () => {
    initCanvasParticles(); // Güncellenmiş AI Animasyonu
    checkAuthStatus();
    loadModels();
    setupFilters();
    
    const authBtn = document.querySelector('.auth-btn');
    if(authBtn) authBtn.onclick = openAuthModal;

    document.getElementById('toggle-auth').onclick = (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        document.getElementById('modal-title').innerText = isLoginMode ? "Giriş Yap" : "Kayıt Ol";
        document.getElementById('toggle-auth').innerText = isLoginMode ? "Kayıt Ol" : "Giriş Yap";
    };

    document.getElementById('auth-submit-btn').onclick = handleAuth;
});

// GÜNCELLEME: AI SİNİR AĞI ANİMASYONU
function initCanvasParticles() {
    const canvas = document.getElementById('hero-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let nodes = [];
    const nodeCount = 80;
    const maxDistance = 150;

    const resize = () => { 
        canvas.width = window.innerWidth; 
        canvas.height = 600; // Sadece üst kısımla sınırlı
    };
    window.addEventListener('resize', resize);
    resize();

    // Düğüm oluşturma
    for(let i=0; i < nodeCount; i++) {
        nodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for(let i=0; i < nodeCount; i++) {
            let n = nodes[i];
            n.x += n.vx;
            n.y += n.vy;

            // Kenarlardan sekme
            if(n.x < 0 || n.x > canvas.width) n.vx *= -1;
            if(n.y < 0 || n.y > canvas.height) n.vy *= -1;

            // Noktayı çiz
            ctx.fillStyle = "rgba(56, 189, 248, 0.8)";
            ctx.beginPath();
            ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
            ctx.fill();

            // Diğer noktalarla bağ kur (Sinir Ağı Etkisi)
            for(let j=i+1; j < nodeCount; j++) {
                let n2 = nodes[j];
                let dist = Math.sqrt((n.x - n2.x)**2 + (n.y - n2.y)**2);

                if(dist < maxDistance) {
                    ctx.strokeStyle = `rgba(56, 189, 248, ${1 - dist/maxDistance})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(n.x, n.y);
                    ctx.lineTo(n2.x, n2.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(draw);
    }
    draw();
}

// FİLTRELEME SİSTEMİ
function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const filterBtns = document.querySelectorAll('.filter-btn');

    searchInput.addEventListener('input', (e) => {
        filterAndRender(e.target.value, document.querySelector('.filter-btn.active').dataset.category);
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterAndRender(searchInput.value, btn.dataset.category);
        });
    });
}

function filterAndRender(searchTerm, category) {
    searchTerm = searchTerm.toLowerCase();
    const filtered = allTools.filter(tool => {
        const matchesSearch = tool.name.toLowerCase().includes(searchTerm) || 
                             tool.description.toLowerCase().includes(searchTerm);
        const matchesCategory = (category === "Tümü" || tool.category === category);
        return matchesSearch && matchesCategory;
    });
    renderTools(filtered);
}

function renderTools(tools) {
    const container = document.getElementById('tools-container');
    if(tools.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #94a3b8;">Sonuç bulunamadı...</p>`;
        return;
    }
    container.innerHTML = tools.map(tool => `
        <div class="card">
            <div>
                <span style="color:#38bdf8; font-size:0.7rem; font-weight:800; text-transform:uppercase;">${tool.category}</span>
                <h3 style="margin:10px 0; font-size:1.4rem;">${tool.name}</h3>
                <p style="color:#94a3b8; font-size:0.9rem; line-height:1.5;">${tool.description}</p>
            </div>
            <a href="details.html?id=${tool.id}" class="details-link">DETAYLARI GÖR</a>
        </div>
    `).join('');
}

async function loadModels() {
    try {
        const res = await fetch(`${API_BASE}/api/tools`);
        allTools = await res.json();
        renderTools(allTools);
    } catch (err) { console.error("Modeller yüklenemedi"); }
}

// AUTH & PREMIUM LOGIC
async function handleAuth() {
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    const endpoint = isLoginMode ? '/login' : '/register';
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            closeAuthModal();
            checkAuthStatus();
        } else alert(data.message);
    } catch (err) { alert("Sunucu hatası!"); }
}

async function checkAuthStatus() {
    const authUI = document.getElementById('auth-ui');
    if (!currentUser) {
        authUI.innerHTML = `<button class="auth-btn" onclick="openAuthModal()">🔑 Giriş Yap</button>`;
        return;
    }
    const res = await fetch(`${API_BASE}/api/verify-premium/${currentUser.id}`);
    const premiumData = await res.json();
    if (premiumData.status === "premium") {
        authUI.innerHTML = `<div style="display:flex; align-items:center; gap:15px;"><span class="premium-status-badge">👑 PREMIUM ÜYE</span><span style="color:#fff">Selam, <b>${currentUser.username}</b></span><button onclick="logout()" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:0.8rem;">Çıkış</button></div>`;
    } else {
        authUI.innerHTML = `<div class="auth-container"><div style="color:#fff; font-size:0.9rem;">Hoş geldin, <b>${currentUser.username}</b> | <span onclick="logout()" style="color:#ef4444; cursor:pointer;">Çıkış</span></div><div class="key-activation-box"><input type="text" id="premium-key" class="key-input" placeholder="Key Kodunu Gir..."><button onclick="activateKey()" class="key-btn">AKTİF ET</button></div></div>`;
    }
}

async function activateKey() {
    const key = document.getElementById('premium-key').value;
    const res = await fetch(`${API_BASE}/api/activate-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, userId: currentUser.id })
    });
    const data = await res.json();
    if(data.success) { alert("Premium aktif!"); checkAuthStatus(); } else alert(data.message);
}

function openAuthModal() { document.getElementById('auth-modal').style.display = 'flex'; }
function closeAuthModal() { document.getElementById('auth-modal').style.display = 'none'; }
function logout() { localStorage.removeItem('user'); location.reload(); }