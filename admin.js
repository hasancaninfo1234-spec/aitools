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
    
    document.getElementById('add-form').onsubmit = async (e) => {
        e.preventDefault();
        const tool = {
            name: document.getElementById('add-name').value,
            category: document.getElementById('add-cat').value,
            description: document.getElementById('add-desc').value,
            specs: document.getElementById('add-specs').value,
            about: document.getElementById('add-about').value
        };
        await fetch(`${API_BASE}/tools`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(tool)
        });
        loadModels();
        e.target.reset();
    };

    document.getElementById('gen-key-btn').onclick = async () => {
        const type = document.getElementById('key-duration').value;
        const code = "AI-" + Math.random().toString(36).substr(2, 9).toUpperCase();
        await fetch(`${API_BASE}/keys`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ code, type })
        });
        loadKeys();
    };
});

async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/stats`);
        const stats = await res.json();
        document.getElementById('stat-users').innerText = stats.totalUsers;
        document.getElementById('stat-premium').innerText = stats.premiumUsers;
        document.getElementById('stat-tools').innerText = stats.totalTools;
        document.getElementById('stat-keys').innerText = stats.unusedKeys;
        if(document.getElementById('stat-pending')) {
            document.getElementById('stat-pending').innerText = stats.pendingTools || 0;
        }
        if(document.getElementById('stat-devs')) {
            document.getElementById('stat-devs').innerText = stats.pendingDevs || 0;
        }
    } catch (e) {
        console.error("İstatistikler alınamadı", e);
    }
}

async function loadModels() {
    const res = await fetch(`${API_BASE}/tools`);
    const tools = await res.json();
    window.currentTools = tools; 
    document.getElementById('models-tbody').innerHTML = tools.map(t => `
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
    const res = await fetch(`${API_BASE}/pending-tools`);
    const tools = await res.json();
    window.currentPendingTools = tools;
    document.getElementById('pending-tools-tbody').innerHTML = tools.map(t => `
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
    const res = await fetch(`${API_BASE}/pending-developers`);
    const devs = await res.json();
    document.getElementById('pending-devs-tbody').innerHTML = devs.map(d => `
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
    const res = await fetch(`${API_BASE}/developers`);
    const devs = await res.json();
    document.getElementById('developers-tbody').innerHTML = devs.map(d => `
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
    const res = await fetch(`${API_BASE}/keys`);
    const keys = await res.json();
    document.getElementById('keys-tbody').innerHTML = keys.map(k => `
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
    const res = await fetch(`${API_BASE}/users`);
    const users = await res.json();
    document.getElementById('users-tbody').innerHTML = users.map(u => {
        let actionBtn = '';
        if (u.isPremium) {
            const expDate = new Date(u.premiumExpiry).toLocaleDateString();
            actionBtn = `<button class="delete-btn" onclick="revokePremium('${u.id}')">PREMİUM İPTAL (${expDate})</button>`;
        } else {
            actionBtn = `
                <select id="duration-${u.id}" class="admin-input" style="width:auto; padding:4px; margin:0; display:inline-block;">
                    <option value="1_Saat">1 Saat</option>
                    <option value="7_Gün">7 Gün</option>
                    <option value="1_Ay">1 Ay</option>
                    <option value="1_Yıl" selected>1 Yıl</option>
                </select>
                <button class="edit-btn" style="background:#f59e0b; color:#000;" onclick="grantPremium('${u.id}')">PREMİUM YAP</button>
            `;
        }
        return `
            <tr>
                <td>${u.username}</td>
                <td>${u.role}</td>
                <td><strong style="color:${u.isPremium ? '#f59e0b' : '#94a3b8'}">${u.isPremium ? 'Aktif' : 'Yok'}</strong></td>
                <td>
                    ${actionBtn}
                    <button class="delete-btn" style="background:#ef4444;" onclick="deleteUser('${u.id}')">SİL</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function deleteModel(id) {
    if(confirm("Bu modeli silmek istediğinize emin misiniz?")) {
        await fetch(`${API_BASE}/tools/${id}`, { method: 'DELETE' });
        loadModels();
        loadStats();
    }
}

// --- ARAÇ İNCELEME MODALI ---
function openReviewModal(id) {
    const tool = window.currentPendingTools.find(t => String(t.id) === String(id));
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
    await fetch(`${API_BASE}/approve-tool/${id}`, { method: 'POST' });
    closeReviewModal();
    loadPendingTools();
    loadModels();
    loadStats();
}

async function confirmRejectTool() {
    const id = document.getElementById('review-id').value;
    if(confirm("Bu araç önerisini reddetmek istediğinize emin misiniz?")) {
        await fetch(`${API_BASE}/pending-tools/${id}`, { method: 'DELETE' });
        closeReviewModal();
        loadPendingTools();
        loadStats();
    }
}

// --- GELİŞTİRİCİ ONAY/RET ---
async function approveDev(id) {
    if(confirm("Bu kullanıcıyı Geliştirici yapmak istiyor musunuz?")) {
        await fetch(`${API_BASE}/approve-developer/${id}`, { method: 'POST' });
        loadPendingDevs();
        loadDevelopers();
        loadStats();
    }
}

async function rejectDev(id) {
    if(confirm("Bu başvuruyu reddetmek istediğinize emin misiniz?")) {
        await fetch(`${API_BASE}/reject-developer/${id}`, { method: 'DELETE' });
        loadPendingDevs();
        loadStats();
    }
}

async function revokeDev(id) {
    if(confirm("Bu kullanıcının Geliştirici yetkisini almak istediğinize emin misiniz?")) {
        await fetch(`${API_BASE}/revoke-developer/${id}`, { method: 'DELETE' });
        loadDevelopers();
        loadStats();
    }
}

async function deleteKey(id) {
    if(confirm("Bu keyi sildiğinizde kullanıcının yetkisi anında gider. Onaylıyor musunuz?")) {
        await fetch(`${API_BASE}/keys/${id}`, { method: 'DELETE' });
        loadKeys();
        loadStats();
        loadUsers();
    }
}

// --- PREMİUM YÖNETİMİ ---
async function grantPremium(id) {
    const typeSelect = document.getElementById('duration-' + id);
    const type = typeSelect ? typeSelect.value : '1_Yıl';
    
    if(confirm(`Bu kullanıcıya ${type.replace('_', ' ')} Premium tanımlamak istiyor musunuz?`)) {
        const res = await fetch(`${API_BASE}/grant-premium/${id}`, { 
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ type })
        });
        const data = await res.json();
        alert(data.message);
        loadUsers();
        loadKeys();
        loadStats();
    }
}

async function revokePremium(id) {
    if(confirm("Bu kullanıcının Premium üyeliğini anında iptal etmek istiyor musunuz?")) {
        await fetch(`${API_BASE}/revoke-premium/${id}`, { method: 'DELETE' });
        loadUsers();
        loadKeys();
        loadStats();
    }
}

// --- KULLANICI SİLME ---
async function deleteUser(id) {
    if(confirm("DİKKAT: Bu kullanıcıyı tamamen silmek istediğinize emin misiniz? (Tüm yetkileri ve premium süresi de silinir)")) {
        await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
        loadUsers();
        loadKeys();
        loadDevelopers();
        loadPendingDevs();
        loadStats();
    }
}

function openEditModal(id) {
    // String zorlaması ile ID tip uyuşmazlığını çözüyoruz
    const tool = window.currentTools.find(t => String(t.id) === String(id));
    if(!tool) return;
    
    document.getElementById('edit-id').value = tool.id;
    document.getElementById('edit-name').value = tool.name || '';
    document.getElementById('edit-category').value = tool.category || '';
    document.getElementById('edit-desc').value = tool.description || '';
    document.getElementById('edit-specs').value = Array.isArray(tool.specs) ? tool.specs.join('\n') : (tool.specs || '');
    document.getElementById('edit-about').value = tool.about || tool.longDescription || '';
    
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
    
    await fetch(`${API_BASE}/tools/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(updatedTool)
    });
    
    closeEditModal();
    loadModels();
}