const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    loadModels();
    loadKeys();
    
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

async function deleteModel(id) {
    if(confirm("Bu modeli silmek istediğinize emin misiniz?")) {
        await fetch(`${API_BASE}/tools/${id}`, { method: 'DELETE' });
        loadModels();
    }
}

async function deleteKey(id) {
    if(confirm("Bu keyi sildiğinizde kullanıcının yetkisi anında gider. Onaylıyor musunuz?")) {
        await fetch(`${API_BASE}/keys/${id}`, { method: 'DELETE' });
        loadKeys();
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