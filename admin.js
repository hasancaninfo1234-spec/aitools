/* Bu dosya, yönetici panelinin arka plan işlemlerini yönetme işini yapar. */
const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadModels();
    loadKeys();
    loadPendingTools();
    loadPendingDevs();
    loadDevelopers();
    loadUsers();
    
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

            alert("Model eklendi!");
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

            alert(`Yeni Key Üretildi: ${code}`);
            loadKeys();
            loadStats();
        };
    }
});

async function loadStats() {
    let pendingToolsCount = 0;
    let pendingDevsCount = 0;

    try {
        const pendingTools = JSON.parse(localStorage.getItem('pendingTools') || '[]');
        const pendingDevs = JSON.parse(localStorage.getItem('pendingDevs') || '[]');
        pendingToolsCount = pendingTools.length;
        pendingDevsCount = pendingDevs.length;

        const res = await fetch(`${API_BASE}/stats`).catch(() => null);
        if (res && res.ok) {
            const stats = await res.json();
            if(document.getElementById('stat-users')) document.getElementById('stat-users').innerText = stats.totalUsers;
            if(document.getElementById('stat-premium')) document.getElementById('stat-premium').innerText = stats.premiumUsers;
            if(document.getElementById('stat-tools')) document.getElementById('stat-tools').innerText = stats.totalTools;
            if(document.getElementById('stat-keys')) document.getElementById('stat-keys').innerText = stats.unusedKeys;
            if(document.getElementById('stat-pending')) document.getElementById('stat-pending').innerText = stats.pendingTools || pendingToolsCount;
            if(document.getElementById('stat-devs')) document.getElementById('stat-devs').innerText = stats.pendingDevs || pendingDevsCount;
            return;
        }
    } catch(e) {}

    if(document.getElementById('stat-pending')) document.getElementById('stat-pending').innerText = pendingToolsCount;
    if(document.getElementById('stat-devs')) document.getElementById('stat-devs').innerText = pendingDevsCount;
}

async function loadModels() {
    let tools = [];
    try {
        const res = await fetch(`${API_BASE}/tools`).catch(() => null);
        if(res && res.ok) {
            tools = await res.json();
        } else {
            tools = JSON.parse(localStorage.getItem('customTools') || '[]');
        }
    } catch(e) {
        tools = JSON.parse(localStorage.getItem('customTools') || '[]');
    }

    window.currentTools = tools; 
    const tbody = document.getElementById('models-tbody');
    if(!tbody) return;

    if(tools.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#64748b; padding:15px;">Model bulunamadı.</td></tr>`;
        return;
    }

    tbody.innerHTML = tools.map(t => `
        <tr>
            <td>${t.name}</td>
            <td>${t.category}</td>
            <td>
                <button class="edit-btn" onclick="openEditModal('${t.id}')">DÜZENLE</button>
                <button class="delete-btn" onclick="deleteModel('${t.id}')">SİL</button>
            </td>
        </tr>
    `).join('');
}

async function loadPendingTools() {
    let tools = [];
    try {
        const res = await fetch(`${API_BASE}/pending-tools`).catch(() => null);
        if (res && res.ok) {
            tools = await res.json();
        } else {
            tools = JSON.parse(localStorage.getItem('pendingTools') || '[]');
        }
    } catch(e) {
        tools = JSON.parse(localStorage.getItem('pendingTools') || '[]');
    }

    window.currentPendingTools = tools;
    const tbody = document.getElementById('pending-tools-tbody');
    if (!tbody) return;

    if (tools.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:15px;">Bekleyen araç önerisi yok.</td></tr>`;
        return;
    }

    tbody.innerHTML = tools.map(t => `
        <tr>
            <td>${t.name}</td>
            <td>${t.category}</td>
            <td><strong style="color:#10b981">${t.submittedBy || 'Anonim'}</strong></td>
            <td>
                <button class="edit-btn" style="background:#38bdf8; color:#000;" onclick="openReviewModal('${t.id}')">İNCELE</button>
            </td>
        </tr>
    `).join('');
}

async function loadPendingDevs() {
    let devs = [];
    try {
        const res = await fetch(`${API_BASE}/pending-developers`).catch(() => null);
        if (res && res.ok) {
            devs = await res.json();
        } else {
            devs = JSON.parse(localStorage.getItem('pendingDevs') || '[]');
        }
    } catch(e) {
        devs = JSON.parse(localStorage.getItem('pendingDevs') || '[]');
    }

    const tbody = document.getElementById('pending-devs-tbody');
    if (!tbody) return;

    if (devs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#64748b; padding:15px;">Bekleyen geliştirici başvurusu yok.</td></tr>`;
        return;
    }

    tbody.innerHTML = devs.map(d => `
        <tr>
            <td>${d.username}</td>
            <td>${d.email}</td>
            <td>
                <button class="edit-btn" style="background:#8b5cf6; color:#fff;" onclick="approveDev('${d.id}')">ONAYLA</button>
                <button class="delete-btn" onclick="rejectDev('${d.id}')">REDDET</button>
            </td>
        </tr>
    `).join('');
}

async function loadDevelopers() {
    let devs = [];
    try {
        const res = await fetch(`${API_BASE}/developers`).catch(() => null);
        if (res && res.ok) {
            devs = await res.json();
        } else {
            devs = JSON.parse(localStorage.getItem('approvedDevs') || '[]');
        }
    } catch(e) {
        devs = JSON.parse(localStorage.getItem('approvedDevs') || '[]');
    }

    const tbody = document.getElementById('developers-tbody');
    if (!tbody) return;

    if (devs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#64748b; padding:15px;">Mevcut geliştirici bulunmuyor.</td></tr>`;
        return;
    }

    tbody.innerHTML = devs.map(d => `
        <tr>
            <td>${d.username}</td>
            <td>${d.email}</td>
            <td>
                <button class="delete-btn" onclick="revokeDev('${d.id}')">YETKİYİ AL (SİL)</button>
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
        } else {
            keys = JSON.parse(localStorage.getItem('generatedKeys') || '[]');
        }
    } catch(e) {
        keys = JSON.parse(localStorage.getItem('generatedKeys') || '[]');
    }

    const tbody = document.getElementById('keys-tbody');
    if (!tbody) return;

    if (keys.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:15px;">Üretilmiş key bulunmuyor.</td></tr>`;
        return;
    }

    tbody.innerHTML = keys.map(k => `
        <tr>
            <td><code>${k.code}</code></td>
            <td>${k.type}</td>
            <td>${k.isUsed ? 'Kullanıldı' : 'Aktif'}</td>
            <td><strong style="color: #38bdf8">${k.isUsed ? k.username : '-'}</strong></td>
            <td><button class="delete-btn" onclick="deleteKey('${k.id}')">SİL</button></td>
        </tr>
    `).join('');
}

async function loadUsers() {
    let users = [];
    try {
        const res = await fetch(`${API_BASE}/users`).catch(() => null);
        if (res && res.ok) {
            users = await res.json();
        } else {
            const curUser = JSON.parse(localStorage.getItem('user'));
            if(curUser) users = [curUser];
        }
    } catch(e) {
        const curUser = JSON.parse(localStorage.getItem('user'));
        if(curUser) users = [curUser];
    }

    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:15px;">Kayıtlı kullanıcı bulunmuyor.</td></tr>`;
        return;
    }

    tbody.innerHTML = users.map(u => {
        let actionBtn = '';
        if (u.isPremium) {
            actionBtn = `<button class="delete-btn" onclick="revokePremium('${u.id}')">PREMİUM İPTAL</button>`;
        } else {
            actionBtn = `<button class="edit-btn" style="background:#f59e0b; color:#000;" onclick="grantPremium('${u.id}')">PREMİUM YAP</button>`;
        }
        return `
            <tr>
                <td>${u.username}</td>
                <td>${u.isDev ? 'Geliştirici' : 'Kullanıcı'}</td>
                <td><strong style="color:${u.isPremium ? '#f59e0b' : '#94a3b8'}">${u.isPremium ? 'Aktif' : 'Yok'}</strong></td>
                <td>
                    ${actionBtn}
                </td>
            </tr>
        `;
    }).join('');
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
    }

    closeReviewModal();
    loadPendingTools();
    loadModels();
    loadStats();
    alert("Araç önerisi onaylandı ve sisteme eklendi! ✅");
}

async function confirmRejectTool() {
    const id = document.getElementById('review-id').value;
    if(!confirm("Bu araç önerisini reddetmek istediğinize emin misiniz?")) return;

    fetch(`${API_BASE}/pending-tools/${id}`, { method: 'DELETE' }).catch(() => null);

    let pendingTools = JSON.parse(localStorage.getItem('pendingTools') || '[]');
    pendingTools = pendingTools.filter(t => String(t.id) !== String(id));
    localStorage.setItem('pendingTools', JSON.stringify(pendingTools));

    closeReviewModal();
    loadPendingTools();
    loadStats();
}

// --- GELİŞTİRİCİ ONAY/RET ---
async function approveDev(id) {
    if(!confirm("Bu kullanıcıyı Geliştirici yapmak istiyor musunuz?")) return;

    fetch(`${API_BASE}/approve-developer/${id}`, { method: 'POST' }).catch(() => null);

    let pendingDevs = JSON.parse(localStorage.getItem('pendingDevs') || '[]');
    const devToApprove = pendingDevs.find(d => String(d.id) === String(id));
    pendingDevs = pendingDevs.filter(d => String(d.id) !== String(id));
    localStorage.setItem('pendingDevs', JSON.stringify(pendingDevs));

    if (devToApprove) {
        let devs = JSON.parse(localStorage.getItem('approvedDevs') || '[]');
        devs.push(devToApprove);
        localStorage.setItem('approvedDevs', JSON.stringify(devs));

        // Eğer mevcut kullanıcı ise isDev yetkisini ver
        let curUser = JSON.parse(localStorage.getItem('user'));
        if (curUser) {
            curUser.isDev = true;
            localStorage.setItem('user', JSON.stringify(curUser));
        }
    }

    loadPendingDevs();
    loadDevelopers();
    loadStats();
    alert("Geliştirici başvurusu onaylandı! Artık araç ekleyebilir. 💻✅");
}

async function rejectDev(id) {
    if(!confirm("Bu başvuruyu reddetmek istediğinize emin misiniz?")) return;

    fetch(`${API_BASE}/reject-developer/${id}`, { method: 'DELETE' }).catch(() => null);

    let pendingDevs = JSON.parse(localStorage.getItem('pendingDevs') || '[]');
    pendingDevs = pendingDevs.filter(d => String(d.id) !== String(id));
    localStorage.setItem('pendingDevs', JSON.stringify(pendingDevs));

    loadPendingDevs();
    loadStats();
}

async function revokeDev(id) {
    if(!confirm("Bu kullanıcının Geliştirici yetkisini almak istediğinize emin misiniz?")) return;

    fetch(`${API_BASE}/revoke-developer/${id}`, { method: 'DELETE' }).catch(() => null);

    let approvedDevs = JSON.parse(localStorage.getItem('approvedDevs') || '[]');
    approvedDevs = approvedDevs.filter(d => String(d.id) !== String(id));
    localStorage.setItem('approvedDevs', JSON.stringify(approvedDevs));

    let curUser = JSON.parse(localStorage.getItem('user'));
    if (curUser) {
        curUser.isDev = false;
        localStorage.setItem('user', JSON.stringify(curUser));
    }

    loadDevelopers();
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
    alert("Model güncellendi!");
}