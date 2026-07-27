/* Bu dosya, yönetici panelinin arka plan işlemlerini yönetme işini yapar. */
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

            alert("Model sisteme eklendi! ✅");
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

            alert(`Yeni Premium Key Üretildi: ${code}`);
            loadKeys();
            loadStats();
        };
    }
});

async function loadStats() {
    const pendingToolsLocal = JSON.parse(localStorage.getItem('pendingTools') || '[]');
    const pendingDevsLocal = JSON.parse(localStorage.getItem('pendingDevs') || '[]');
    
    let pendingToolsCount = pendingToolsLocal.length;
    let pendingDevsCount = pendingDevsLocal.length;

    try {
        const res = await fetch(`${API_BASE}/stats`).catch(() => null);
        if (res && res.ok) {
            const stats = await res.json();
            if(document.getElementById('stat-users')) document.getElementById('stat-users').innerText = stats.totalUsers || '1';
            if(document.getElementById('stat-premium')) document.getElementById('stat-premium').innerText = stats.premiumUsers || '0';
            if(document.getElementById('stat-tools')) document.getElementById('stat-tools').innerText = stats.totalTools || '194';
            if(document.getElementById('stat-keys')) document.getElementById('stat-keys').innerText = stats.unusedKeys || '0';
            if(document.getElementById('stat-pending')) document.getElementById('stat-pending').innerText = Math.max(stats.pendingTools || 0, pendingToolsCount);
            if(document.getElementById('stat-devs')) document.getElementById('stat-devs').innerText = Math.max(stats.pendingDevs || 0, pendingDevsCount);
        }
    } catch(e) {}

    if(document.getElementById('stat-pending')) document.getElementById('stat-pending').innerText = pendingToolsCount;
    if(document.getElementById('stat-devs')) document.getElementById('stat-devs').innerText = pendingDevsCount;
    
    if(document.getElementById('badge-devs')) document.getElementById('badge-devs').innerText = pendingDevsCount;
    if(document.getElementById('badge-tools')) document.getElementById('badge-tools').innerText = pendingToolsCount;
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
                <button class="edit-btn" style="background:#c084fc; color:#0f172a;" onclick="approveDev('${d.id}')">ONAYLA (YETKİLENDİR)</button>
                <button class="delete-btn" onclick="rejectDev('${d.id}')">REDDET</button>
            </td>
        </tr>
    `).join('');
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
        alert(`${username} kullanıcısının Geliştirici durumu güncellendi: ${curUser.isDev ? 'Geliştirici yapıldı ✅' : 'Kullanıcı yapıldı'}`);
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
    alert("Key başarıyla silindi! ✅");
}

function addNotification(targetUser, icon, title, message) {
    let notifs = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    notifs.unshift({
        id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        targetUser: targetUser || 'all',
        icon: icon || '🔔',
        title: title,
        message: message,
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

    if (toolToApprove) {
        let customTools = JSON.parse(localStorage.getItem('customTools') || '[]');
        customTools.push(toolToApprove);
        localStorage.setItem('customTools', JSON.stringify(customTools));

        // Bildirim Gönder
        addNotification(
            toolToApprove.submittedBy,
            '✅',
            'Araç Öneriniz Onaylandı!',
            `'${toolToApprove.name}' isimli yapay zeka aracı öneriniz onaylandı ve sitede yayınlandı! Katkınız için teşekkür ederiz.`
        );
    }

    closeReviewModal();
    loadPendingTools();
    loadModels();
    loadStats();
    alert("Araç önerisi onaylandı ve bildirim gönderildi! ✅");
}

async function confirmRejectTool() {
    const id = document.getElementById('review-id').value;
    if(!confirm("Bu araç önerisini reddetmek istediğinize emin misiniz?")) return;

    let pendingTools = JSON.parse(localStorage.getItem('pendingTools') || '[]');
    const toolToReject = pendingTools.find(t => String(t.id) === String(id));

    fetch(`${API_BASE}/pending-tools/${id}`, { method: 'DELETE' }).catch(() => null);

    pendingTools = pendingTools.filter(t => String(t.id) !== String(id));
    localStorage.setItem('pendingTools', JSON.stringify(pendingTools));

    if (toolToReject) {
        // Bildirim Gönder
        addNotification(
            toolToReject.submittedBy,
            '❌',
            'Araç Öneriniz Kabul Edilmedi',
            `'${toolToReject.name}' isimli yapay zeka aracı öneriniz yapılan inceleme sonucunda kabul edilmemiştir.`
        );
    }

    closeReviewModal();
    loadPendingTools();
    loadStats();
}

// --- GELİŞTİRİCİ ONAY/RET (E-POSTA VE KULLANICI ADI EŞLEŞTİRME) ---
async function approveDev(id) {
    if(!confirm("Bu kullanıcıyı Geliştirici yapmak istediğinize emin misiniz?")) return;

    fetch(`${API_BASE}/approve-developer/${id}`, { method: 'POST' }).catch(() => null);

    let pendingDevs = JSON.parse(localStorage.getItem('pendingDevs') || '[]');
    const devToApprove = pendingDevs.find(d => String(d.id) === String(id));
    pendingDevs = pendingDevs.filter(d => String(d.id) !== String(id));
    localStorage.setItem('pendingDevs', JSON.stringify(pendingDevs));

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

        // Bildirim Gönder
        addNotification(
            devToApprove.username,
            '🎉',
            'Geliştirici Başvurunuz Onaylandı!',
            'Tebrikler! Yönetim ekibimiz geliştirici başvurunuzu onayladı. Artık platforma yeni yapay zeka araçları ekleyebilirsiniz.'
        );
    }

    loadPendingDevs();
    loadDevelopers();
    loadUsers();
    loadStats();
    alert("Geliştirici başvurusu onaylandı ve bildirim gönderildi! 💻🎉");
}

async function rejectDev(id) {
    if(!confirm("Bu başvuruyu reddetmek istediğinize emin misiniz?")) return;

    let pendingDevs = JSON.parse(localStorage.getItem('pendingDevs') || '[]');
    const devToReject = pendingDevs.find(d => String(d.id) === String(id));

    fetch(`${API_BASE}/reject-developer/${id}`, { method: 'DELETE' }).catch(() => null);

    pendingDevs = pendingDevs.filter(d => String(d.id) !== String(id));
    localStorage.setItem('pendingDevs', JSON.stringify(pendingDevs));

    if (devToReject) {
        // Bildirim Gönder
        addNotification(
            devToReject.username,
            '❌',
            'Geliştirici Başvurunuz Onaylanmadı',
            'Geliştirici hesabınız için yaptığınız başvuru yapılan inceleme sonucunda maalesef kabul edilmemiştir.'
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
    alert("Model başarıyla güncellendi! ✅");
}