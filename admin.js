/* Bu dosya, yönetici panelinin arka plan işlemlerini yönetme işini yapar. (Güncelleme: Canlı Destek Sunucu Modu) */
const API_BASE = '/api';

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
            fetch(`${API_BASE}/tools`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(tool)
            }).catch(() => null);

            let customTools = JSON.parse(localStorage.getItem('customTools') || '[]');
            customTools.push(tool);
            localStorage.setItem('customTools', JSON.stringify(customTools));

            showToast("Model sisteme başarıyla eklendi! ✅", "success");
            loadModels();
            loadStats();
            e.target.reset();
        };
    }

    const genKeyBtn = document.getElementById('gen-key-btn');
    if(genKeyBtn) {
        genKeyBtn.onclick = async () => {
            const typeSelect = document.getElementById('key-duration');
            const type = typeSelect ? typeSelect.value : '1_Yıl';
            const code = "AI-" + Math.random().toString(36).substr(2, 9).toUpperCase();
            
            fetch(`${API_BASE}/keys`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ code, type })
            }).catch(() => null);

            let localKeys = JSON.parse(localStorage.getItem('generatedKeys') || '[]');
            localKeys.push({ id: Date.now().toString(), code, type, isUsed: false, username: '-' });
            localStorage.setItem('generatedKeys', JSON.stringify(localKeys));

            showToast(`Yeni Premium Key Üretildi: ${code}`, "purple", "Premium Key Üretildi");
            loadKeys();
            loadStats();
        };
    }
});

async function loadStats() {
    const pendingToolsLocal = JSON.parse(localStorage.getItem('pendingTools') || '[]');
    const pendingDevsLocal = JSON.parse(localStorage.getItem('pendingDevs') || '[]');
    const supportTicketsLocal = JSON.parse(localStorage.getItem('supportTickets') || '[]');
    const customToolsLocal = JSON.parse(localStorage.getItem('customTools') || '[]');
    const generatedKeysLocal = JSON.parse(localStorage.getItem('generatedKeys') || '[]');
    const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    let pendingToolsCount = pendingToolsLocal.length;
    let pendingDevsCount = pendingDevsLocal.length;
    let openTicketsCount = supportTicketsLocal.filter(t => t.status !== 'Çözüldü').length;

    let usersCount = Math.max(localUsers.length, 1);
    let premiumCount = localUsers.filter(u => u.isPremium).length;
    let toolsCount = 194 + customToolsLocal.length;
    let unusedKeysCount = generatedKeysLocal.filter(k => !k.isUsed).length;

    try {
        const res = await fetch(`${API_BASE}/stats`).catch(() => null);
        if (res && res.ok) {
            const stats = await res.json();
            if (stats.totalUsers !== undefined) usersCount = stats.totalUsers;
            if (stats.premiumUsers !== undefined) premiumCount = stats.premiumUsers;
            if (stats.totalTools !== undefined) toolsCount = stats.totalTools;
            if (stats.unusedKeys !== undefined) unusedKeysCount = stats.unusedKeys;
            pendingToolsCount = Math.max(stats.pendingTools || 0, pendingToolsCount);
            pendingDevsCount = Math.max(stats.pendingDevs || 0, pendingDevsCount);
        }
    } catch(e) {}

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

async function loadModels() {
    let tools = [];
    try {
        const res = await fetch(`${API_BASE}/tools`).catch(() => null);
        if(res && res.ok) {
            tools = await res.json();
        }
    } catch(e) {}

    const localCustom = JSON.parse(localStorage.getItem('customTools') || '[]');
    tools = [...tools, ...localCustom];

    const uniqueTools = Array.from(new Map(tools.map(item => [item.id || item.name, item])).values());
    window.currentTools = uniqueTools; 
    
    const tbody = document.getElementById('models-tbody');
    if(!tbody) return;

    if(uniqueTools.length === 0) {
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

async function loadPendingTools() {
    let apiTools = [];
    try {
        const res = await fetch(`${API_BASE}/pending-tools`).catch(() => null);
        if (res && res.ok) {
            apiTools = await res.json();
        }
    } catch(e) {}

    const localTools = JSON.parse(localStorage.getItem('pendingTools') || '[]');
    const combined = [...apiTools, ...localTools];
    const uniqueTools = Array.from(new Map(combined.map(item => [String(item.id), item])).values());

    window.currentPendingTools = uniqueTools;
    const tbody = document.getElementById('pending-tools-tbody');
    if (!tbody) return;

    if (uniqueTools.length === 0) {
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

async function loadPendingDevs() {
    let apiDevs = [];
    try {
        const res = await fetch(`${API_BASE}/pending-developers`).catch(() => null);
        if (res && res.ok) {
            apiDevs = await res.json();
        }
    } catch(e) {}

    const localDevs = JSON.parse(localStorage.getItem('pendingDevs') || '[]');
    const combined = [...apiDevs, ...localDevs];
    const uniqueDevs = Array.from(new Map(combined.map(item => [String(item.id), item])).values());

    const tbody = document.getElementById('pending-devs-tbody');
    if (!tbody) return;

    if (uniqueDevs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:15px;">Bekleyen geliştirici başvurusu yok.</td></tr>`;
        return;
    }

    tbody.innerHTML = uniqueDevs.map(d => `
        <tr>
            <td><strong>${d.username}</strong></td>
            <td><code style="color:#c084fc;">${d.email}</code></td>
            <td><span style="color:#64748b; font-size:0.82rem;">${d.date || 'Bugün'}</span></td>
            <td>
                <button class="edit-btn" style="background:#c084fc; color:#0f172a;" onclick="approveDev('${d.id}')">ONAYLA</button>
                <button class="delete-btn" onclick="rejectDev('${d.id}')">REDDET</button>
            </td>
        </tr>
    `).join('');
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

    // Bildirim gönder
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

async function loadDevelopers() {
    let apiDevs = [];
    try {
        const res = await fetch(`${API_BASE}/developers`).catch(() => null);
        if (res && res.ok) {
            apiDevs = await res.json();
        }
    } catch(e) {}

    const localDevs = JSON.parse(localStorage.getItem('approvedDevs') || '[]');
    const combined = [...apiDevs, ...localDevs];
    const uniqueDevs = Array.from(new Map(combined.map(item => [String(item.id || item.username), item])).values());

    const tbody = document.getElementById('developers-tbody');
    if (!tbody) return;

    if (uniqueDevs.length === 0) {
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

async function loadKeys() {
    let keys = [];
    try {
        const res = await fetch(`${API_BASE}/keys`).catch(() => null);
        if (res && res.ok) {
            keys = await res.json();
        }
    } catch(e) {}

    const localKeys = JSON.parse(localStorage.getItem('generatedKeys') || '[]');
    keys = [...keys, ...localKeys];
    const uniqueKeys = Array.from(new Map(keys.map(item => [String(item.code), item])).values());

    const tbody = document.getElementById('keys-tbody');
    if (!tbody) return;

    if (uniqueKeys.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:15px;">Üretilmiş key bulunmuyor.</td></tr>`;
        return;
    }

    tbody.innerHTML = uniqueKeys.map(k => `
        <tr>
            <td><code>${k.code}</code></td>
            <td>${k.type}</td>
            <td><span style="color:${k.isUsed ? '#f87171' : '#4ade80'}; font-weight:700;">${k.isUsed ? 'Kullanıldı' : 'Aktif'}</span></td>
            <td><strong style="color: #38bdf8">${k.isUsed ? k.username : '-'}</strong></td>
            <td><button class="delete-btn" onclick="deleteKey('${k.code}', '${k.id || ''}')">SİL</button></td>
        </tr>
    `).join('');
}

async function loadUsers() {
    let users = [];
    try {
        const res = await fetch(`${API_BASE}/users`).catch(() => null);
        if (res && res.ok) {
            users = await res.json();
        }
    } catch(e) {}

    const curUser = JSON.parse(localStorage.getItem('user'));
    if(curUser) users.push(curUser);

    const uniqueUsers = Array.from(new Map(users.map(item => [String(item.username), item])).values());

    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    if (uniqueUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:15px;">Kayıtlı kullanıcı bulunmuyor.</td></tr>`;
        return;
    }

    tbody.innerHTML = uniqueUsers.map(u => `
        <tr>
            <td><strong>${u.username}</strong> ${u.email ? `<span style="color:#64748b; font-size:0.8rem;">(${u.email})</span>` : ''}</td>
            <td><span style="color:${u.isDev ? '#c084fc' : '#94a3b8'}; font-weight:700;">${u.isDev ? '💻 Developer' : '👤 Kullanıcı'}</span></td>
            <td><strong style="color:${u.isPremium ? '#fbbf24' : '#94a3b8'}">${u.isPremium ? '👑 Premium' : 'Standart'}</strong></td>
            <td>
                <button class="edit-btn" style="background:#c084fc; color:#0f172a;" onclick="toggleUserDev('${u.username}')">${u.isDev ? 'Dev Yetkisini Al' : 'Dev Yetkisi Ver'}</button>
            </td>
        </tr>
    `).join('');
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
    
    fetch(`${API_BASE}/tools/${id}`, { method: 'DELETE' }).catch(() => null);
    
    let customTools = JSON.parse(localStorage.getItem('customTools') || '[]');
    customTools = customTools.filter(t => String(t.id) !== String(id));
    localStorage.setItem('customTools', JSON.stringify(customTools));

    loadModels();
    loadStats();
}

async function deleteKey(code, id) {
    if(!confirm(`'${code}' kodlu keyi silmek istediğinize emin misiniz?`)) return;

    fetch(`${API_BASE}/keys/${id || code}`, { method: 'DELETE' }).catch(() => null);

    let localKeys = JSON.parse(localStorage.getItem('generatedKeys') || '[]');
    localKeys = localKeys.filter(k => 
        String(k.code) !== String(code) && 
        (!id || String(k.id) !== String(id))
    );
    localStorage.setItem('generatedKeys', JSON.stringify(localKeys));

    loadKeys();
    loadStats();
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
    fetch(`${API_BASE}/approve-tool/${id}`, { method: 'POST' }).catch(() => null);

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

    fetch(`${API_BASE}/pending-tools/${id}`, { method: 'DELETE' }).catch(() => null);

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

    fetch(`${API_BASE}/approve-developer/${id}`, { method: 'POST' }).catch(() => null);

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

    fetch(`${API_BASE}/reject-developer/${id}`, { method: 'DELETE' }).catch(() => null);

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

    fetch(`${API_BASE}/revoke-developer/${id}`, { method: 'DELETE' }).catch(() => null);

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

    fetch(`${API_BASE}/tools/${id}`, {
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
    try {
        await fetch('/api/live-support/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
    } catch(e) {}

    showToast("Canlı destek talebi reddedildi.", "info");
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
        } else {
            showToast("Sunucu hatası! Tekrar deneyin.", "error");
        }
    } catch(e) {
        showToast("Sunucuya bağlanılamadı!", "error");
    }
    setTimeout(loadLiveSupportRequests, 500);
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