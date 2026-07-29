/* Bu dosya, yönetici panelinin arka plan işlemlerini yönetme işini yapar. (Güncelleme: Canlı Destek Sunucu Modu) */
const ADMIN_API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('adminAuthed') === 'true') {
        loadStats();
        loadModels();
        loadKeys();
        loadPendingTools();
        loadPendingDevs();
        loadDevelopers();
        loadUsers();
        loadSupportTickets();
        loadLiveSupportRequests();
        setInterval(loadLiveSupportRequests, 2000);
    }
    
    const addForm = document.getElementById('add-form');
    if(addForm) {
        addForm.onsubmit = async (e) => {
            e.preventDefault();
            const tool = {
                id: Date.now().toString(),
                name: document.getElementById('add-name').value,
                category: document.getElementById('add-cat').value,
                description: document.getElementById('add-desc').value,
                specs: document.getElementById('add-specs').value,
                about: document.getElementById('add-about').value
            };
            try {
                await fetch(`${ADMIN_API_BASE}/tools`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(tool)
                });
            } catch(e) {}

            let customTools = JSON.parse(localStorage.getItem('customTools') || '[]');
            customTools.push(tool);
            localStorage.setItem('customTools', JSON.stringify(customTools));

            showToast("Model sisteme başarıyla eklendi! ✅", "success");
            await loadModels();
            await loadStats();
            e.target.reset();
        };
    }

    const genKeyBtn = document.getElementById('gen-key-btn');
    if(genKeyBtn) {
        genKeyBtn.onclick = async () => {
            const typeSelect = document.getElementById('key-duration');
            const type = typeSelect ? typeSelect.value : '1_Yıl';
            const code = "AI-" + Math.random().toString(36).substr(2, 9).toUpperCase();
            
            try {
                await fetch(`${ADMIN_API_BASE}/keys`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ code, type })
                });
            } catch(err) {}

            let localKeys = JSON.parse(localStorage.getItem('generatedKeys') || '[]');
            localKeys.push({ id: Date.now().toString(), code, type, isUsed: false, username: '-' });
            localStorage.setItem('generatedKeys', JSON.stringify(localKeys));

            showToast(`Yeni Premium Key Üretildi: ${code}`, "purple", "Premium Key Üretildi");
            await loadKeys();
            await loadStats();
        };
    }
});

function applyStatsDOM(usersCount, premiumCount, toolsCount, unusedKeysCount, pendingToolsCount, pendingDevsCount, openTicketsCount) {
    if(document.getElementById('stat-users')) document.getElementById('stat-users').innerText = usersCount;
    if(document.getElementById('stat-premium')) document.getElementById('stat-premium').innerText = premiumCount;
    if(document.getElementById('stat-tools')) document.getElementById('stat-tools').innerText = toolsCount;
    if(document.getElementById('stat-keys')) document.getElementById('stat-keys').innerText = unusedKeysCount;
    if(document.getElementById('stat-pending')) document.getElementById('stat-pending').innerText = pendingToolsCount;
    if(document.getElementById('stat-devs')) document.getElementById('stat-devs').innerText = pendingDevsCount;
    
    if(document.getElementById('badge-devs')) document.getElementById('badge-devs').innerText = pendingDevsCount;
    if(document.getElementById('badge-tools')) document.getElementById('badge-tools').innerText = pendingToolsCount;
    if(document.getElementById('badge-tickets')) document.getElementById('badge-tickets').innerText = openTicketsCount;
}

function getCombinedUsersAndKeys() {
    let localKeys = JSON.parse(localStorage.getItem('generatedKeys') || '[]');
    let revokedKeys = JSON.parse(localStorage.getItem('revokedKeys') || '[]');
    let revokedUsers = JSON.parse(localStorage.getItem('revokedUsers') || '[]');

    let defaultKeys = [
        { id: '1', code: 'AI-ECSRD3CDY', type: '1_Yıl', isUsed: true, username: 'x' },
        { id: '2', code: 'ADM-UKIFZGVQJ', type: '1_Yıl', isUsed: true, username: 'a' }
    ];

    let keyMap = new Map();
    defaultKeys.forEach(k => {
        if (!revokedKeys.includes(k.code)) keyMap.set(k.code, k);
    });
    localKeys.forEach(k => {
        if (k && k.code) {
            if (revokedKeys.includes(k.code)) k.isUsed = false;
            keyMap.set(k.code, k);
        }
    });

    let allKeys = Array.from(keyMap.values());

    let localUsers = JSON.parse(localStorage.getItem('users') || '[]');
    let curUser = JSON.parse(localStorage.getItem('user'));
    let defaultUsers = [
        { id: '1', username: 'a', role: 'admin', isPremium: true, email: 'admin@aiuniverse.com' },
        { id: '2', username: 'x', role: 'developer', isPremium: true, email: 'dev@aiuniverse.com' },
        { id: '3', username: 'demo_user', role: 'user', isPremium: false, email: 'user@aiuniverse.com' }
    ];
    if (curUser && curUser.username) localUsers.push(curUser);

    let userMap = new Map();
    defaultUsers.forEach(u => {
        if (revokedUsers.includes(u.username)) u.isPremium = false;
        userMap.set(u.username, u);
    });
    localUsers.forEach(u => {
        if (u && u.username) {
            if (revokedUsers.includes(u.username)) u.isPremium = false;
            userMap.set(u.username, u);
        }
    });

    allKeys.forEach(k => {
        if (k.isUsed && k.username && k.username !== '-') {
            let u = userMap.get(k.username);
            if (u && !revokedUsers.includes(u.username)) {
                u.isPremium = true;
            }
        }
    });

    let allUsers = Array.from(userMap.values());
    return { allUsers, allKeys };
}

async function loadStats() {
    const pendingToolsLocal = JSON.parse(localStorage.getItem('pendingTools') || '[]');
    const pendingDevsLocal = JSON.parse(localStorage.getItem('pendingDevs') || '[]');
    const supportTicketsLocal = JSON.parse(localStorage.getItem('supportTickets') || '[]');
    const customToolsLocal = JSON.parse(localStorage.getItem('customTools') || '[]');

    const { allUsers, allKeys } = getCombinedUsersAndKeys();

    let pendingToolsCount = pendingToolsLocal.length;
    let pendingDevsCount = pendingDevsLocal.length;
    let openTicketsCount = supportTicketsLocal.filter(t => t.status !== 'Çözüldü').length;

    let usersCount = Math.max(allUsers.length, 3);
    let premiumCount = allUsers.filter(u => u.isPremium).length;
    let toolsCount = 194 + customToolsLocal.length;
    let unusedKeysCount = allKeys.filter(k => !k.isUsed).length;

    applyStatsDOM(usersCount, premiumCount, toolsCount, unusedKeysCount, pendingToolsCount, pendingDevsCount, openTicketsCount);

    try {
        const res = await fetch(`${ADMIN_API_BASE}/stats?t=` + Date.now()).catch(() => null);
        if (res && res.ok) {
            const stats = await res.json();
            if (stats.totalUsers !== undefined) usersCount = Math.max(stats.totalUsers, usersCount);
            if (stats.premiumUsers !== undefined) premiumCount = Math.max(stats.premiumUsers, premiumCount);
            if (stats.totalTools !== undefined) toolsCount = stats.totalTools;
            if (stats.unusedKeys !== undefined) unusedKeysCount = stats.unusedKeys;
            pendingToolsCount = Math.max(stats.pendingTools || 0, pendingToolsCount);
            pendingDevsCount = Math.max(stats.pendingDevs || 0, pendingDevsCount);

            applyStatsDOM(usersCount, premiumCount, toolsCount, unusedKeysCount, pendingToolsCount, pendingDevsCount, openTicketsCount);
        }
    } catch(e) {}
}

function renderModelsDOM(uniqueTools) {
    const tbody = document.getElementById('models-tbody');
    if (!tbody) return;

    if (!uniqueTools || uniqueTools.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#64748b; padding:15px;">Model bulunamadı.</td></tr>`;
        return;
    }

    tbody.innerHTML = uniqueTools.map(t => `
        <tr>
            <td><strong>${t.name}</strong></td>
            <td><span style="background:rgba(56,189,248,0.1); color:#38bdf8; padding:3px 10px; border-radius:12px; font-size:0.78rem; font-weight:700;">${t.category}</span></td>
            <td>
                <button class="edit-btn" onclick="openEditModal('${t.id}')">DÜZENLE</button>
                <button class="delete-btn" onclick="deleteModel('${t.id}')">SİL</button>
            </td>
        </tr>
    `).join('');
}

async function loadModels() {
    let localCustom = JSON.parse(localStorage.getItem('customTools') || '[]');
    let cachedTools = JSON.parse(localStorage.getItem('cachedTools') || '[]');
    let tools = cachedTools;

    // 1. Önce statik tools.json dosyasını çek
    try {
        let res = await fetch(`tools.json?t=` + Date.now()).catch(() => null);
        if (res && res.ok) {
            tools = await res.json();
            try { localStorage.setItem('cachedTools', JSON.stringify(tools)); } catch(e) {}
        }
    } catch(e) {}

    // 2. Ardından sunucu API'sinden güncellenmiş modelleri dene
    try {
        let res = await fetch(`${ADMIN_API_BASE}/tools?t=` + Date.now()).catch(() => null);
        if (res && res.ok) {
            const apiTools = await res.json();
            if (apiTools && apiTools.length > 0) {
                tools = apiTools;
                try { localStorage.setItem('cachedTools', JSON.stringify(tools)); } catch(e) {}
            }
        }
    } catch(e) {}

    const combined = [...tools, ...localCustom];
    const uniqueTools = Array.from(new Map(combined.map(item => [String(item.id || item.name), item])).values());
    window.currentTools = uniqueTools;
    renderModelsDOM(uniqueTools);
}

function renderPendingToolsDOM(uniqueTools) {
    const tbody = document.getElementById('pending-tools-tbody');
    if (!tbody) return;

    if (!uniqueTools || uniqueTools.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:15px;">Bekleyen araç önerisi yok.</td></tr>`;
        return;
    }

    tbody.innerHTML = uniqueTools.map(t => `
        <tr>
            <td><strong>${t.name}</strong></td>
            <td><span style="background:rgba(52,211,153,0.1); color:#34d399; padding:3px 10px; border-radius:12px; font-size:0.78rem; font-weight:700;">${t.category}</span></td>
            <td><strong style="color:#10b981">${t.submittedBy || 'Anonim'}</strong></td>
            <td>
                <button class="edit-btn" style="background:#34d399; color:#0f172a;" onclick="openReviewModal('${t.id}')">İNCELE & ONAYLA</button>
            </td>
        </tr>
    `).join('');
}

async function loadPendingTools() {
    const localTools = JSON.parse(localStorage.getItem('pendingTools') || '[]');
    window.currentPendingTools = localTools;

    renderPendingToolsDOM(localTools);

    try {
        const res = await fetch(`${ADMIN_API_BASE}/pending-tools?t=` + Date.now()).catch(() => null);
        if (res && res.ok) {
            const apiTools = await res.json();
            const combined = [...apiTools, ...localTools];
            const uniqueTools = Array.from(new Map(combined.map(item => [String(item.id), item])).values());
            window.currentPendingTools = uniqueTools;
            renderPendingToolsDOM(uniqueTools);
        }
    } catch(e) {}
}

function renderPendingDevsDOM(uniqueDevs) {
    const tbody = document.getElementById('pending-devs-tbody');
    if (!tbody) return;

    if (!uniqueDevs || uniqueDevs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:15px;">Bekleyen geliştirici başvurusu yok.</td></tr>`;
        return;
    }

    tbody.innerHTML = uniqueDevs.map(d => `
        <tr>
            <td><strong>${d.username}</strong></td>
            <td><code style="color:#c084fc;">${d.email || '-'}</code></td>
            <td><span style="color:#64748b; font-size:0.82rem;">${d.date || 'Bugün'}</span></td>
            <td>
                <button class="edit-btn" style="background:#c084fc; color:#0f172a;" onclick="approveDev('${d.id}')">ONAYLA</button>
                <button class="delete-btn" onclick="rejectDev('${d.id}')">REDDET</button>
            </td>
        </tr>
    `).join('');
}

async function loadPendingDevs() {
    const localDevs = JSON.parse(localStorage.getItem('pendingDevs') || '[]');
    renderPendingDevsDOM(localDevs);

    try {
        const res = await fetch(`${ADMIN_API_BASE}/pending-developers?t=` + Date.now()).catch(() => null);
        if (res && res.ok) {
            const apiDevs = await res.json();
            const combined = [...apiDevs, ...localDevs];
            const uniqueDevs = Array.from(new Map(combined.map(item => [String(item.id), item])).values());
            renderPendingDevsDOM(uniqueDevs);
        }
    } catch(e) {}
}

function renderDevelopersDOM(uniqueDevs) {
    const tbody = document.getElementById('developers-tbody');
    if (!tbody) return;

    if (!uniqueDevs || uniqueDevs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#64748b; padding:15px;">Mevcut geliştirici bulunmuyor.</td></tr>`;
        return;
    }

    tbody.innerHTML = uniqueDevs.map(d => `
        <tr>
            <td><strong>${d.username}</strong></td>
            <td><code style="color:#818cf8;">${d.email || '-'}</code></td>
            <td>
                <button class="delete-btn" onclick="revokeDev('${d.id || d.username}')">YETKİYİ AL (SİL)</button>
            </td>
        </tr>
    `).join('');
}

async function loadDevelopers() {
    let localDevs = JSON.parse(localStorage.getItem('approvedDevs') || '[]');
    let defaultDevs = [
        { id: '1', username: 'x', email: 'dev@aiuniverse.com' }
    ];

    let combined = [...defaultDevs, ...localDevs];
    let devMap = new Map();
    combined.forEach(d => { if (d && d.username) devMap.set(d.username, d); });

    renderDevelopersDOM(Array.from(devMap.values()));

    try {
        const res = await fetch(`${ADMIN_API_BASE}/developers?t=` + Date.now()).catch(() => null);
        if (res && res.ok) {
            const apiDevs = await res.json();
            apiDevs.forEach(d => { if (d && d.username) devMap.set(d.username, d); });
            renderDevelopersDOM(Array.from(devMap.values()));
        }
    } catch(e) {}
}

function renderKeysDOM(uniqueKeys) {
    const tbody = document.getElementById('keys-tbody');
    if (!tbody) return;

    if (!uniqueKeys || uniqueKeys.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:15px;">Üretilmiş key bulunmuyor.</td></tr>`;
        return;
    }

    tbody.innerHTML = uniqueKeys.map(k => `
        <tr>
            <td><code>${k.code}</code></td>
            <td>${k.type || '1_Yıl'}</td>
            <td><span style="color:${k.isUsed ? '#f87171' : '#4ade80'}; font-weight:700;">${k.isUsed ? 'Kullanıldı' : 'Aktif'}</span></td>
            <td><strong style="color: #38bdf8">${k.isUsed ? (k.username || 'x') : '-'}</strong></td>
            <td>
                ${k.isUsed ? `<button class="delete-btn" style="background:rgba(239,68,68,0.2); color:#f87171; border-color:rgba(239,68,68,0.4); margin-right:6px;" onclick="revokeKeyAdmin('${k.code}', '${k.usedBy || ''}', '${k.username || ''}')">PREMİUM İPTAL ET</button>` : ''}
                <button class="delete-btn" onclick="deleteKey('${k.code}', '${k.id || ''}')">SİL</button>
            </td>
        </tr>
    `).join('');
}

async function loadKeys() {
    const { allKeys } = getCombinedUsersAndKeys();
    renderKeysDOM(allKeys);

    try {
        const res = await fetch(`${ADMIN_API_BASE}/keys?t=` + Date.now()).catch(() => null);
        if (res && res.ok) {
            const apiKeys = await res.json();
            let keyMap = new Map();
            allKeys.forEach(k => keyMap.set(k.code, k));
            const revokedKeys = JSON.parse(localStorage.getItem('revokedKeys') || '[]');
            apiKeys.forEach(k => {
                if (k && k.code) {
                    if (revokedKeys.includes(k.code)) k.isUsed = false;
                    keyMap.set(k.code, k);
                }
            });
            renderKeysDOM(Array.from(keyMap.values()));
        }
    } catch(e) {}
}

function loadSupportTickets() {
    const tickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
    const tbody = document.getElementById('tickets-tbody');
    if(!tbody) return;

    if(tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:15px;">Destek talebi bulunmuyor.</td></tr>`;
        return;
    }

    tbody.innerHTML = tickets.map(t => `
        <tr>
            <td><code>#${t.id}</code></td>
            <td><strong>${t.username}</strong> ${t.email !== '-' ? `<span style="color:#64748b; font-size:0.78rem;">(${t.email})</span>` : ''}</td>
            <td><strong>${t.subject}</strong><br><span style="color:#cbd5e1; font-size:0.82rem;">${t.message}</span></td>
            <td><span style="background:${t.priority === 'Acil' ? 'rgba(239,68,68,0.2)' : 'rgba(56,189,248,0.1)'}; color:${t.priority === 'Acil' ? '#f87171' : '#38bdf8'}; padding:3px 8px; border-radius:10px; font-size:0.75rem; font-weight:700;">${t.priority}</span></td>
            <td><span style="color:${t.status === 'Çözüldü' ? '#4ade80' : '#fbbf24'}; font-weight:700;">${t.status}</span></td>
            <td>
                ${t.status === 'Çözüldü' ? '<span style="color:#4ade80; font-size:0.8rem; font-weight:700;">✓ Yanıtlandı</span>' : `<button class="edit-btn" onclick="resolveTicket('${t.id}')">YANITLA / KAPAT</button>`}
            </td>
        </tr>
    `).join('');
}

function resolveTicket(id) {
    let tickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
    const ticket = tickets.find(t => String(t.id) === String(id));
    if(!ticket) return;

    const replyNote = prompt(`'#${ticket.id}' talep numaralı '${ticket.subject}' konusuna yanıtınız:`, "Talebiniz incelenmiş ve gerekli işlem sağlanmıştır.");
    if(replyNote === null) return;

    ticket.status = 'Çözüldü';
    localStorage.setItem('supportTickets', JSON.stringify(tickets));

    addNotification(
        ticket.username,
        '💬',
        `Destek Talebiniz Yanıtlandı (#${ticket.id})`,
        `'${ticket.subject}' konulu destek talebinize yönetim ekibimiz yanıt verdi.`,
        replyNote
    );

    loadSupportTickets();
    loadStats();
    showToast("Destek talebi yanıtlandı ve Gelen Kutusu bildirimi iletildi! ✅", "success");
}

function renderUsersDOM(userList) {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    if (!userList || userList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:15px;">Kayıtlı kullanıcı bulunmuyor.</td></tr>`;
        return;
    }

    tbody.innerHTML = userList.map(u => `
        <tr>
            <td><strong>${u.username}</strong> ${u.email && u.email !== '-' ? `<span style="color:#64748b; font-size:0.8rem;">(${u.email})</span>` : ''}</td>
            <td><span style="color:${u.role === 'admin' ? '#f59e0b' : u.role === 'developer' || u.isDev ? '#c084fc' : '#94a3b8'}; font-weight:700;">${u.role === 'admin' ? '🛡️ Yönetici' : u.role === 'developer' || u.isDev ? '💻 Developer' : '👤 Kullanıcı'}</span></td>
            <td><strong style="color:${u.isPremium ? '#fbbf24' : '#94a3b8'}">${u.isPremium ? '👑 Premium' : 'Standart'}</strong></td>
            <td>
                ${u.isPremium ? 
                    `<button class="delete-btn" style="background:rgba(239,68,68,0.2); color:#f87171; border-color:rgba(239,68,68,0.4); margin-right:6px;" onclick="revokeUserPremiumAdmin('${u.id || ''}', '${u.username}')">Premium İptal Et</button>` :
                    `<button class="edit-btn" style="background:rgba(251,191,36,0.15); color:#fbbf24; border-color:rgba(251,191,36,0.3); margin-right:6px;" onclick="grantUserPremiumAdmin('${u.id || ''}', '${u.username}')">👑 Premium Yap</button>`
                }
                <button class="edit-btn" style="background:#c084fc; color:#0f172a;" onclick="toggleUserDev('${u.username}')">${u.isDev || u.role === 'developer' ? 'Dev Yetkisini Al' : 'Dev Yetkisi Ver'}</button>
            </td>
        </tr>
    `).join('');
}

async function loadUsers() {
    const { allUsers } = getCombinedUsersAndKeys();
    renderUsersDOM(allUsers);

    try {
        const res = await fetch(`${ADMIN_API_BASE}/users?t=` + Date.now()).catch(() => null);
        if (res && res.ok) {
            const apiUsers = await res.json();
            let userMap = new Map();
            allUsers.forEach(u => userMap.set(u.username, u));
            const revokedUsers = JSON.parse(localStorage.getItem('revokedUsers') || '[]');
            apiUsers.forEach(u => {
                if (u && u.username) {
                    let existing = userMap.get(u.username) || {};
                    let merged = { ...existing, ...u };
                    if (revokedUsers.includes(u.username)) merged.isPremium = false;
                    userMap.set(u.username, merged);
                }
            });
            renderUsersDOM(Array.from(userMap.values()));
        }
    } catch(e) {}
}

function toggleUserDev(username) {
    let curUser = JSON.parse(localStorage.getItem('user'));
    if(curUser && curUser.username === username) {
        curUser.isDev = !curUser.isDev;
        if(curUser.isDev) curUser.showDevCongratulation = true;
        localStorage.setItem('user', JSON.stringify(curUser));
        showToast(`${username} kullanıcısının durumu güncellendi: ${curUser.isDev ? 'Geliştirici yapıldı ✅' : 'Kullanıcı yapıldı'}`, "success");
        loadUsers();
        loadDevelopers();
    }
}

async function deleteModel(id) {
    if(!confirm("Bu modeli silmek istediğinize emin misiniz?")) return;
    
    fetch(`${ADMIN_API_BASE}/tools/${id}`, { method: 'DELETE' }).catch(() => null);
    
    let customTools = JSON.parse(localStorage.getItem('customTools') || '[]');
    customTools = customTools.filter(t => String(t.id) !== String(id));
    localStorage.setItem('customTools', JSON.stringify(customTools));

    loadModels();
    loadStats();
}

async function deleteKey(code, id) {
    if(!confirm(`'${code}' kodlu keyi silmek istediğinize emin misiniz?`)) return;

    try {
        await fetch(`${ADMIN_API_BASE}/keys/${id || code}`, { method: 'DELETE' });
    } catch(e) {}

    let localKeys = JSON.parse(localStorage.getItem('generatedKeys') || '[]');
    localKeys = localKeys.filter(k => 
        String(k.code) !== String(code) && 
        (!id || String(k.id) !== String(id))
    );
    localStorage.setItem('generatedKeys', JSON.stringify(localKeys));

    await loadKeys();
    await loadStats();
    showToast("Lisans key başarıyla silindi! ✅", "info");
}

function addNotification(targetUser, icon, title, message, adminNote) {
    let notifs = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    notifs.unshift({
        id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        targetUser: targetUser || 'all',
        icon: icon || '🔔',
        title: title,
        message: message,
        adminNote: adminNote || '',
        date: new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        isRead: false
    });
    localStorage.setItem('userNotifications', JSON.stringify(notifs));
}

// --- ARAÇ İNCELEME MODALI ---
function openReviewModal(id) {
    const tool = (window.currentPendingTools || []).find(t => String(t.id) === String(id));
    if(!tool) return;
    
    document.getElementById('review-id').value = tool.id;
    document.getElementById('review-name').innerText = tool.name;
    document.getElementById('review-cat').innerText = tool.category;
    document.getElementById('review-url').href = tool.url;
    document.getElementById('review-url').innerText = tool.url;
    document.getElementById('review-desc').innerText = tool.description;
    
    document.getElementById('review-modal').style.display = 'flex';
}

function closeReviewModal() {
    document.getElementById('review-modal').style.display = 'none';
}

async function confirmApproveTool() {
    const id = document.getElementById('review-id').value;
    fetch(`${ADMIN_API_BASE}/approve-tool/${id}`, { method: 'POST' }).catch(() => null);

    let pendingTools = JSON.parse(localStorage.getItem('pendingTools') || '[]');
    const toolToApprove = pendingTools.find(t => String(t.id) === String(id));
    pendingTools = pendingTools.filter(t => String(t.id) !== String(id));
    localStorage.setItem('pendingTools', JSON.stringify(pendingTools));

    const adminNote = prompt("Kullanıcıya özel onay açıklaması/notu eklemek ister misiniz? (Opsiyonel):", "Araç öneriniz portal kriterlerine uygun bulunarak yayınlanmıştır.");

    if (toolToApprove) {
        let customTools = JSON.parse(localStorage.getItem('customTools') || '[]');
        customTools.push(toolToApprove);
        localStorage.setItem('customTools', JSON.stringify(customTools));

        addNotification(
            toolToApprove.submittedBy,
            '✅',
            'Araç Öneriniz Onaylandı!',
            `'${toolToApprove.name}' isimli yapay zeka aracı öneriniz onaylandı ve sitede yayınlandı! Katkınız için teşekkür ederiz.`,
            adminNote
        );
    }

    closeReviewModal();
    loadPendingTools();
    loadModels();
    loadStats();
    showToast("Araç önerisi onaylandı ve bildirimi gönderildi! ✅", "success");
}

async function confirmRejectTool() {
    const id = document.getElementById('review-id').value;
    if(!confirm("Bu araç önerisini reddetmek istediğinize emin misiniz?")) return;

    let pendingTools = JSON.parse(localStorage.getItem('pendingTools') || '[]');
    const toolToReject = pendingTools.find(t => String(t.id) === String(id));

    fetch(`${ADMIN_API_BASE}/pending-tools/${id}`, { method: 'DELETE' }).catch(() => null);

    pendingTools = pendingTools.filter(t => String(t.id) !== String(id));
    localStorage.setItem('pendingTools', JSON.stringify(pendingTools));

    const adminNote = prompt("Kullanıcıya özel ret açıklaması/nedeni eklemek ister misiniz? (Opsiyonel):", "Sağlanan URL geçersiz veya içerik yetersiz bulundu.");

    if (toolToReject) {
        addNotification(
            toolToReject.submittedBy,
            '❌',
            'Araç Öneriniz Kabul Edilmedi',
            `'${toolToReject.name}' isimli yapay zeka aracı öneriniz yapılan inceleme sonucunda kabul edilmemiştir.`,
            adminNote
        );
    }

    closeReviewModal();
    loadPendingTools();
    loadStats();
}

async function approveDev(id) {
    if(!confirm("Bu kullanıcıyı Geliştirici yapmak istediğinize emin misiniz?")) return;

    fetch(`${ADMIN_API_BASE}/approve-developer/${id}`, { method: 'POST' }).catch(() => null);

    let pendingDevs = JSON.parse(localStorage.getItem('pendingDevs') || '[]');
    const devToApprove = pendingDevs.find(d => String(d.id) === String(id));
    pendingDevs = pendingDevs.filter(d => String(d.id) !== String(id));
    localStorage.setItem('pendingDevs', JSON.stringify(pendingDevs));

    const adminNote = prompt("Kullanıcıya özel onay mesajı/notu eklemek ister misiniz? (Opsiyonel):", "Tebrikler! Geliştirici başvurunuz onaylanmıştır.");

    if (devToApprove) {
        let devs = JSON.parse(localStorage.getItem('approvedDevs') || '[]');
        devs.push(devToApprove);
        localStorage.setItem('approvedDevs', JSON.stringify(devs));

        let curUser = JSON.parse(localStorage.getItem('user'));
        if (curUser) {
            curUser.isDev = true;
            curUser.email = devToApprove.email || curUser.email;
            curUser.showDevCongratulation = true;
            localStorage.setItem('user', JSON.stringify(curUser));
        }

        addNotification(
            devToApprove.username,
            '🎉',
            'Geliştirici Başvurunuz Onaylandı!',
            'Tebrikler! Yönetim ekibimiz geliştirici başvurunuzu onayladı. Artık platforma yeni yapay zeka araçları ekleyebilirsiniz.',
            adminNote
        );
    }

    loadPendingDevs();
    loadDevelopers();
    loadUsers();
    loadStats();
    showToast("Geliştirici başvurusu onaylandı ve özel açıklama bildirimi gönderildi! 💻🎉", "success");
}

async function rejectDev(id) {
    if(!confirm("Bu başvuruyu reddetmek istediğinize emin misiniz?")) return;

    let pendingDevs = JSON.parse(localStorage.getItem('pendingDevs') || '[]');
    const devToReject = pendingDevs.find(d => String(d.id) === String(id));

    fetch(`${ADMIN_API_BASE}/reject-developer/${id}`, { method: 'DELETE' }).catch(() => null);

    pendingDevs = pendingDevs.filter(d => String(d.id) !== String(id));
    localStorage.setItem('pendingDevs', JSON.stringify(pendingDevs));

    const adminNote = prompt("Kullanıcıya özel ret açıklaması/nedeni eklemek ister misiniz? (Opsiyonel):", "E-posta adresi ve başvuru bilgileri kriterlerimize uygun görülmedi.");

    if (devToReject) {
        addNotification(
            devToReject.username,
            '❌',
            'Geliştirici Başvurunuz Onaylanmadı',
            'Geliştirici hesabınız için yaptığınız başvuru yapılan inceleme sonucunda maalesef kabul edilmemiştir.',
            adminNote
        );
    }

    loadPendingDevs();
    loadStats();
}

async function revokeDev(id) {
    if(!confirm("Bu kullanıcının Geliştirici yetkisini almak istediğinize emin misiniz?")) return;

    fetch(`${ADMIN_API_BASE}/revoke-developer/${id}`, { method: 'DELETE' }).catch(() => null);

    let approvedDevs = JSON.parse(localStorage.getItem('approvedDevs') || '[]');
    approvedDevs = approvedDevs.filter(d => String(d.id || d.username) !== String(id));
    localStorage.setItem('approvedDevs', JSON.stringify(approvedDevs));

    let curUser = JSON.parse(localStorage.getItem('user'));
    if (curUser) {
        curUser.isDev = false;
        curUser.showDevCongratulation = false;
        localStorage.setItem('user', JSON.stringify(curUser));
    }

    loadDevelopers();
    loadUsers();
    loadStats();
}

function openEditModal(id) {
    const tool = (window.currentTools || []).find(t => String(t.id) === String(id));
    if(!tool) return;
    
    document.getElementById('edit-id').value = tool.id;
    document.getElementById('edit-name').value = tool.name || '';
    document.getElementById('edit-category').value = tool.category || '';
    document.getElementById('edit-desc').value = tool.description || '';
    document.getElementById('edit-specs').value = Array.isArray(tool.specs) ? tool.specs.join('\n') : (tool.specs || '');
    document.getElementById('edit-about').value = tool.about || '';
    
    document.getElementById('edit-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

async function updateModel() {
    const id = document.getElementById('edit-id').value;
    const updatedTool = {
        name: document.getElementById('edit-name').value,
        category: document.getElementById('edit-category').value,
        description: document.getElementById('edit-desc').value,
        specs: document.getElementById('edit-specs').value,
        about: document.getElementById('edit-about').value
    };

    fetch(`${ADMIN_API_BASE}/tools/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(updatedTool)
    }).catch(() => null);

    let customTools = JSON.parse(localStorage.getItem('customTools') || '[]');
    const idx = customTools.findIndex(t => String(t.id) === String(id));
    if(idx !== -1) {
        customTools[idx] = { ...customTools[idx], ...updatedTool };
        localStorage.setItem('customTools', JSON.stringify(customTools));
    }

    closeEditModal();
    loadModels();
    showToast("Model başarıyla güncellendi! ✅", "success");
}

/* ============================================================================
   CANLI DESTEK SİSTEMİ (ADMİN TARAFI)
   ============================================================================ */
let activeAdminChatReqId = null;
let lastSeenWaitingCount = 0;

async function loadLiveSupportRequests() {
    let requests = [];
    try {
        const res = await fetch('/api/live-support/requests?t=' + Date.now()).catch(() => null);
        if (res && res.ok) {
            requests = await res.json();
        }
    } catch(e) {}
    window.allLiveSupportRequests = requests;

    const waitingRequests = requests.filter(r => r.status === 'waiting');
    const waitingCount = waitingRequests.length;

    if (waitingCount > lastSeenWaitingCount) {
        const newest = waitingRequests[0];
        if (newest && typeof showToast === 'function') {
            showToast(`🎧 Yeni Canlı Destek Talebi! (${newest.username})`, "warning", "Canlı Destek");
        }
    }
    lastSeenWaitingCount = waitingCount;

    const badgeEl = document.getElementById('badge-live');
    if (badgeEl) {
        if (waitingCount > 0) {
            badgeEl.innerText = waitingCount;
            badgeEl.style.display = 'inline-block';
        } else {
            badgeEl.style.display = 'none';
        }
    }

    const listEl = document.getElementById('live-requests-list');
    if (!listEl) return;

    if (requests.length === 0) {
        listEl.innerHTML = `
            <div style="text-align:center; color:#64748b; padding:20px 5px; font-size:0.85rem;">
                Henüz canlı destek talebi bulunmuyor.
                <br><br>
                <button onclick="createTestLiveSupportRequest()" class="admin-btn" style="font-size:0.75rem; padding:6px 12px; background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3);">🧪 Test Talebi Oluştur</button>
            </div>
        `;
        return;
    }

    listEl.innerHTML = requests.map(r => {
        const isSelected = activeAdminChatReqId === r.id;
        let statusBadge = '<span style="color:#fbbf24; font-size:0.7rem; background:rgba(251,191,36,0.15); padding:2px 6px; border-radius:6px; border:1px solid rgba(251,191,36,0.3);">⏳ Onay Bekliyor</span>';
        if (r.status === 'accepted') statusBadge = '<span style="color:#4ade80; font-size:0.7rem; background:rgba(34,197,94,0.15); padding:2px 6px; border-radius:6px; border:1px solid rgba(34,197,94,0.3);">🟢 Aktif</span>';
        if (r.status === 'rejected') statusBadge = '<span style="color:#f87171; font-size:0.7rem; background:rgba(239,68,68,0.15); padding:2px 6px; border-radius:6px; border:1px solid rgba(239,68,68,0.3);">❌ Reddedildi</span>';
        if (r.status === 'ended') statusBadge = '<span style="color:#94a3b8; font-size:0.7rem; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:6px; border:1px solid rgba(255,255,255,0.1);">⏹️ Sonlandı</span>';

        let actionBtns = '';
        if (r.status === 'waiting') {
            actionBtns = `
                <div style="display:flex; gap:6px; margin-top:8px;">
                    <button onclick="acceptLiveSupportAdmin('${r.id}')" class="admin-btn" style="padding:5px 10px; font-size:0.75rem; background:#34d399; color:#0f172a; flex:1;">Kabul Et</button>
                    <button onclick="rejectLiveSupportAdmin('${r.id}')" class="delete-btn" style="padding:5px 10px; font-size:0.75rem; flex:1;">Reddet</button>
                </div>
            `;
        } else if (r.status === 'accepted') {
            actionBtns = `
                <button onclick="openLiveChatAdmin('${r.id}')" class="admin-btn" style="width:100%; padding:5px 10px; font-size:0.75rem; margin-top:8px;">💬 Sohbete Bağlan</button>
            `;
        }

        return `
            <div style="background: ${isSelected ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${isSelected ? '#38bdf8' : 'rgba(255,255,255,0.06)'}; padding: 10px 12px; border-radius: 10px; cursor: pointer; transition: all 0.2s;" onclick="openLiveChatAdmin('${r.id}')">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <strong style="color:#fff; font-size:0.85rem;">👤 ${r.username}</strong>
                    <span style="font-size:0.7rem; color:#64748b;">${r.date}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    ${statusBadge}
                </div>
                ${actionBtns}
            </div>
        `;
    }).join('');

    if (activeAdminChatReqId) {
        const activeReq = requests.find(r => r.id === activeAdminChatReqId);
        if (activeReq) {
            renderAdminChatLog(activeReq);
        }
    }
}

async function acceptLiveSupportAdmin(id) {
    try {
        const res = await fetch('/api/live-support/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        if (!res.ok) throw new Error('Server error');
    } catch(e) {
        showToast("Sunucuya bağlanılamadı!", "error");
        return;
    }
    showToast("Canlı destek talebi onaylandı! Chat başlatıldı.", "success", "Canlı Destek");
    openLiveChatAdmin(id);
    loadLiveSupportRequests();
}

async function rejectLiveSupportAdmin(id) {
    let targetReq = (window.allLiveSupportRequests || []).find(r => r.id === id);
    try {
        await fetch('/api/live-support/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
    } catch(e) {}

    if (targetReq && targetReq.username) {
        addNotification(
            targetReq.username,
            '🙏',
            'Canlı Destek İptal Edildi - Özür Dileriz',
            'Yoğunluk nedeniyle canlı destek talebiniz şu anda karşılanamadı.',
            'Sayın kullanıcımız, temsilcilerimizin anlık yoğunluğu sebebiyle canlı destek talebiniz şu anda iptal edilmiştir. Yaşanan aksaklık ve gecikme nedeniyle özür dileriz. Sorularınız için İletişim sayfasındaki formu kullanabilir veya Gelen Kutunuz üzerinden bizlere ulaşabilirsiniz.'
        );
    }

    showToast("Canlı destek talebi reddedildi ve kullanıcıya özür bildirimi gönderildi.", "info");
    if (activeAdminChatReqId === id) {
        activeAdminChatReqId = null;
        const emptyEl = document.getElementById('live-chat-empty');
        const activeEl = document.getElementById('live-chat-active');
        if (emptyEl) emptyEl.style.display = 'block';
        if (activeEl) activeEl.style.display = 'none';
    }
    loadLiveSupportRequests();
}

function openLiveChatAdmin(id) {
    activeAdminChatReqId = id;
    const emptyEl = document.getElementById('live-chat-empty');
    const activeEl = document.getElementById('live-chat-active');
    if (emptyEl) emptyEl.style.display = 'none';
    if (activeEl) activeEl.style.display = 'flex';
    loadLiveSupportRequests();
}

function renderAdminChatLog(reqObj) {
    const userLabel = document.getElementById('active-chat-user');
    const msgContainer = document.getElementById('admin-chat-messages');

    if (userLabel) userLabel.innerText = `👤 ${reqObj.username} (${reqObj.email})`;

    if (msgContainer) {
        const msgs = reqObj.messages || [];
        if (msgs.length === 0) {
            msgContainer.innerHTML = `<div style="text-align:center; color:#64748b; margin:auto;">Henüz mesaj gönderilmedi. Aşağıdan ilk yanıtınızı yazın.</div>`;
        } else {
            msgContainer.innerHTML = msgs.map(m => {
                if (m.sender === 'user') {
                    return `
                        <div style="background: rgba(56,189,248,0.12); border: 1px solid rgba(56,189,248,0.25); padding: 8px 12px; border-radius: 12px 12px 12px 0; color: #fff; font-size: 0.88rem; max-width: 80%; align-self: flex-start;">
                            <div style="font-size: 0.7rem; color: #38bdf8; font-weight: bold; margin-bottom: 2px;">👤 ${reqObj.username} (${m.time || ''})</div>
                            ${m.text}
                        </div>
                    `;
                } else {
                    return `
                        <div style="background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); padding: 8px 12px; border-radius: 12px 12px 0 12px; color: #fff; font-size: 0.88rem; max-width: 80%; align-self: flex-end; margin-left: auto;">
                            <div style="font-size: 0.7rem; color: #4ade80; font-weight: bold; margin-bottom: 2px; text-align: right;">🛡️ Siz (Admin) (${m.time || ''})</div>
                            ${m.text}
                        </div>
                    `;
                }
            }).join('');
            msgContainer.scrollTop = msgContainer.scrollHeight;
        }
    }
}

async function sendAdminChatMessage() {
    const input = document.getElementById('admin-chat-input');
    if (!input || !activeAdminChatReqId) return;

    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    try {
        await fetch('/api/live-support/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: activeAdminChatReqId, sender: 'admin', text: text })
        });
    } catch(e) {
        showToast("Mesaj gönderilemedi!", "error");
        return;
    }
    loadLiveSupportRequests();
}

function insertAdminPrompt(promptText) {
    const input = document.getElementById('admin-chat-input');
    if (input) {
        input.value = promptText;
        input.focus();
    }
}

async function endLiveChatAdmin() {
    if (!activeAdminChatReqId) return;

    try {
        await fetch('/api/live-support/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: activeAdminChatReqId })
        });
    } catch(e) {}

    showToast("Canlı sohbet sonlandırıldı.", "info");
    activeAdminChatReqId = null;
    const emptyEl = document.getElementById('live-chat-empty');
    const activeEl = document.getElementById('live-chat-active');
    if (emptyEl) emptyEl.style.display = 'block';
    if (activeEl) activeEl.style.display = 'none';
    loadLiveSupportRequests();
}

async function createTestLiveSupportRequest() {
    try {
        const res = await fetch('/api/live-support/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Test Kullanıcısı',
                email: 'test@aiuniverse.com',
                initialMessage: 'Merhaba, sitenizdeki yapay zeka araçları hakkında bilgi almak istiyorum.'
            })
        });
        if (res.ok) {
            showToast("✅ Test Canlı Destek Talebi sunucuya eklendi!", "success");
        }
    } catch(e) {}
    loadLiveSupportRequests();
}

/* ============================================================================
   PREMİUM KEY & KULLANICI İPTAL İŞLEMLERİ (ADMİN)
   ============================================================================ */
async function revokeKeyAdmin(code, userId, username) {
    const targetName = username && username !== '-' ? username : (userId || code);
    if (!confirm(`'${targetName}' kullanıcısına ait '${code}' kodlu Premium Key'i iptal edip üyeliği sökmek istediğinize emin misiniz?`)) return;

    let revokedKeys = JSON.parse(localStorage.getItem('revokedKeys') || '[]');
    if (!revokedKeys.includes(code)) revokedKeys.push(code);
    localStorage.setItem('revokedKeys', JSON.stringify(revokedKeys));

    let localKeys = JSON.parse(localStorage.getItem('generatedKeys') || '[]');
    let foundKey = localKeys.find(k => String(k.code) === String(code));
    if (foundKey) {
        foundKey.isUsed = false;
        foundKey.usedBy = null;
        foundKey.username = '-';
        localStorage.setItem('generatedKeys', JSON.stringify(localKeys));
    }

    if (username && username !== '-') {
        let revokedUsers = JSON.parse(localStorage.getItem('revokedUsers') || '[]');
        if (!revokedUsers.includes(username)) revokedUsers.push(username);
        localStorage.setItem('revokedUsers', JSON.stringify(revokedUsers));

        let localUsers = JSON.parse(localStorage.getItem('users') || '[]');
        let userObj = localUsers.find(u => u.username === username);
        if (userObj) {
            userObj.isPremium = false;
            userObj.cancelledPremium = true;
            localStorage.setItem('users', JSON.stringify(localUsers));
        }

        let curUser = JSON.parse(localStorage.getItem('user'));
        if (curUser && curUser.username === username) {
            curUser.isPremium = false;
            curUser.cancelledPremium = true;
            localStorage.setItem('user', JSON.stringify(curUser));
        }

        addNotification(
            username,
            '⚠️',
            'Premium Üyeliğiniz İptal Edildi',
            `'${code}' kodlu Premium lisans anahtarınız yönetim kararıyla iptal edilmiştir.`,
            'Sayın kullanıcımız, hesabınızda aktif bulunan Premium Lisans Anahtarı yönetici tarafından iptal edilmiştir.'
        );
    }

    try {
        await fetch(`${ADMIN_API_BASE}/keys/revoke`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, userId })
        });
    } catch(e) {}

    showToast(`'${code}' kodlu Premium Key başarıyla iptal edildi! 🚫`, "warning", "Premium İptal");
    await loadKeys();
    await loadUsers();
    await loadStats();
}

async function grantUserPremiumAdmin(userId, username) {
    if (!confirm(`'${username}' kullanıcısına Premium üyelik tanımlamak istediğinize emin misiniz?`)) return;

    let revokedUsers = JSON.parse(localStorage.getItem('revokedUsers') || '[]');
    revokedUsers = revokedUsers.filter(u => u !== username);
    localStorage.setItem('revokedUsers', JSON.stringify(revokedUsers));

    let localUsers = JSON.parse(localStorage.getItem('users') || '[]');
    let userObj = localUsers.find(u => u.username === username || u.id === userId);
    if (userObj) {
        userObj.isPremium = true;
        userObj.cancelledPremium = false;
    } else {
        localUsers.push({ id: userId || Date.now().toString(), username: username, isPremium: true, role: 'user' });
    }
    localStorage.setItem('users', JSON.stringify(localUsers));

    let curUser = JSON.parse(localStorage.getItem('user'));
    if (curUser && (curUser.username === username || curUser.id === userId)) {
        curUser.isPremium = true;
        curUser.cancelledPremium = false;
        localStorage.setItem('user', JSON.stringify(curUser));
    }

    try {
        await fetch(`${ADMIN_API_BASE}/grant-premium/${userId || username}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: '1_Yıl' })
        });
    } catch(e) {}

    addNotification(
        username,
        '👑',
        'Tebrikler! Premium Üyeliğiniz Tanımlandı',
        'Yönetim ekibi tarafından hesabınıza 1 Yıllık Premium üyelik hediye edilmiştir.',
        'Sınırsız AI araç erişiminiz aktifleştirilmiştir. AI Tools evreninin tadını çıkarın!'
    );

    showToast(`'${username}' kullanıcısına Premium tanımlandı! 👑`, "success");
    await loadUsers();
    await loadKeys();
    await loadStats();
}

async function revokeUserPremiumAdmin(userId, username) {
    if (!confirm(`'${username}' kullanıcısının Premium üyeliğini iptal etmek istediğinize emin misiniz?`)) return;

    let revokedUsers = JSON.parse(localStorage.getItem('revokedUsers') || '[]');
    if (!revokedUsers.includes(username)) revokedUsers.push(username);
    localStorage.setItem('revokedUsers', JSON.stringify(revokedUsers));

    let localUsers = JSON.parse(localStorage.getItem('users') || '[]');
    let userObj = localUsers.find(u => u.username === username || u.id === userId);
    if (userObj) {
        userObj.isPremium = false;
        userObj.cancelledPremium = true;
        localStorage.setItem('users', JSON.stringify(localUsers));
    }

    let curUser = JSON.parse(localStorage.getItem('user'));
    if (curUser && (curUser.username === username || curUser.id === userId)) {
        curUser.isPremium = false;
        curUser.cancelledPremium = true;
        localStorage.setItem('user', JSON.stringify(curUser));
    }

    let localKeys = JSON.parse(localStorage.getItem('generatedKeys') || '[]');
    localKeys.forEach(k => {
        if (k.username === username || k.usedBy === userId) {
            k.isUsed = false;
            k.usedBy = null;
            k.username = '-';
        }
    });
    localStorage.setItem('generatedKeys', JSON.stringify(localKeys));

    try {
        await fetch(`${ADMIN_API_BASE}/revoke-premium/${userId || username}`, { method: 'DELETE' });
    } catch(e) {}

    addNotification(
        username,
        '⚠️',
        'Premium Üyeliğiniz İptal Edildi',
        'Hesabınıza tanımlı Premium üyelik yönetim kararıyla sonlandırılmıştır.',
        'Herhangi bir sorunuz varsa İletişim sayfasından tarafımıza ulaşabilirsiniz.'
    );

    showToast(`'${username}' kullanıcısının Premium üyeliği iptal edildi! 🚫`, "warning");
    await loadUsers();
    await loadKeys();
    await loadStats();
}

/* ============================================================================
   CANLI SOHBET ÜZERİNDEN DESTEK TALEBİ OLUŞTURMA (ADMİN)
   ============================================================================ */
function openCreateTicketModalFromChat() {
    if (!activeAdminChatReqId || !window.allLiveSupportRequests) {
        showToast("Lütfen önce aktif bir canlı sohbet seçiniz.", "warning");
        return;
    }
    const reqObj = window.allLiveSupportRequests.find(r => r.id === activeAdminChatReqId);
    if (!reqObj) return;

    document.getElementById('modal-ticket-user').value = `${reqObj.username} (${reqObj.email || '-'})`;
    document.getElementById('modal-ticket-subject').value = `Canlı Destek Görüşmesi (${reqObj.username})`;
    document.getElementById('modal-ticket-priority').value = "Normal";
    document.getElementById('modal-ticket-message').value = reqObj.messages && reqObj.messages.length > 0 
        ? `Kullanıcı canlı sohbet ilk mesajı: "${reqObj.messages[0].text}"`
        : '';

    document.getElementById('admin-create-ticket-modal').style.display = 'flex';
}

function closeCreateTicketModalFromChat() {
    document.getElementById('admin-create-ticket-modal').style.display = 'none';
}

async function saveAdminTicketFromChat() {
    if (!activeAdminChatReqId || !window.allLiveSupportRequests) return;
    const reqObj = window.allLiveSupportRequests.find(r => r.id === activeAdminChatReqId);
    if (!reqObj) return;

    const subject = document.getElementById('modal-ticket-subject').value.trim();
    const priority = document.getElementById('modal-ticket-priority').value;
    const message = document.getElementById('modal-ticket-message').value.trim();

    if (!subject || !message) {
        showToast("Lütfen konu başlığı ve açıklamayı doldurunuz.", "warning");
        return;
    }

    const ticketId = Math.floor(1000 + Math.random() * 9000).toString();
    const newTicket = {
        id: ticketId,
        username: reqObj.username,
        email: reqObj.email || '-',
        subject: subject,
        message: message,
        priority: priority,
        status: 'Açık',
        date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    let tickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
    tickets.unshift(newTicket);
    localStorage.setItem('supportTickets', JSON.stringify(tickets));

    // Send inbox notification to the user
    addNotification(
        reqObj.username,
        '🎫',
        `Destek Talebi Oluşturuldu (#${ticketId})`,
        `Temsilcimiz canlı sohbet sırasında sizin adınıza bir destek talebi oluşturdu.`,
        `Konu: ${subject} (${priority} Öncelik)\nAçıklama: ${message}`
    );

    // Also send system response message in the live chat log
    const systemChatMsg = `🎫 Temsilci sizin adınıza bir destek talebi oluşturdu! (Talep No: #${ticketId} | Öncelik: ${priority} | Konu: ${subject})`;
    try {
        await fetch('/api/live-support/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: activeAdminChatReqId, sender: 'admin', text: systemChatMsg })
        });
    } catch(e) {}

    closeCreateTicketModalFromChat();
    loadSupportTickets();
    loadStats();
    loadLiveSupportRequests();
    showToast(`Destek talebi (#${ticketId}) oluşturuldu ve 'Destek Talepleri' sekmesine eklendi! ✅`, "success", "Destek Talebi");
}

// Sekmeler Arası Anlık Senkronizasyon (Storage Event & Fast Polling)
window.addEventListener('storage', (e) => {
    if (sessionStorage.getItem('adminAuthed') === 'true') {
        loadLiveSupportRequests();
    }
});

setInterval(() => {
    if (sessionStorage.getItem('adminAuthed') === 'true') {
        loadLiveSupportRequests();
    }
}, 3000);