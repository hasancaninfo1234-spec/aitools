/*
 * ============================================================================
 * Proje Adı: AI Tools (Yapay Zeka Evreni)
 * Dosya: script.js
 * Açıklama: Ön yüz dinamik etkileşimleri, Toast bildirim sistemi ve canlı sidebar işlemleri.
 * ============================================================================
 */

const API_BASE = "";

let aktifKullanici = JSON.parse(localStorage.getItem('user')) || null;
let girisModuMu = true;
let butunAraclar = [];

/* ============================================================================
   SİTE İÇİ GELİŞMİŞ TOAST BİLDİRİM SİSTEMİ (NATIVE ALERT YERİNE)
   ============================================================================ */
function showToast(message, type = 'info', title = null, duration = 3800) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    let icon = 'ℹ️';
    let defaultTitle = 'Bilgi';
    
    if (type === 'success') {
        icon = '✅';
        defaultTitle = 'Başarılı';
    } else if (type === 'error') {
        icon = '❌';
        defaultTitle = 'Hata';
    } else if (type === 'warning') {
        icon = '⚠️';
        defaultTitle = 'Uyarı';
    } else if (type === 'purple') {
        icon = '🔮';
        defaultTitle = 'AI Evreni';
    }

    const toastTitle = title || defaultTitle;
    const toastEl = document.createElement('div');
    toastEl.className = `toast-notification toast-${type}`;

    toastEl.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-body">
            <div class="toast-title">
                <span>${toastTitle}</span>
                <button class="toast-close" onclick="closeToast(this.parentElement.parentElement.parentElement)">&times;</button>
            </div>
            <div class="toast-message">${message}</div>
        </div>
        <div class="toast-progress">
            <div class="toast-progress-bar" style="transition-duration: ${duration}ms;"></div>
        </div>
    `;

    container.appendChild(toastEl);

    requestAnimationFrame(() => {
        toastEl.classList.add('toast-show');
        const progressBar = toastEl.querySelector('.toast-progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
    });

    const timer = setTimeout(() => {
        closeToast(toastEl);
    }, duration);

    toastEl.dataset.timer = timer;
}

function closeToast(toastEl) {
    if (!toastEl || toastEl.classList.contains('toast-hide')) return;
    if (toastEl.dataset.timer) clearTimeout(parseInt(toastEl.dataset.timer));
    toastEl.classList.remove('toast-show');
    toastEl.classList.add('toast-hide');
    setTimeout(() => {
        if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
    }, 400);
}

// Window alert çağrılarını site içi Toast bildirim sistemi ile değiştiriyoruz
window.showToast = showToast;
window.alert = function(msg, type = null) {
    let inferredType = type || 'info';
    if (typeof msg === 'string') {
        if (msg.includes('Hata') || msg.includes('hata') || msg.includes('Yetkisiz') || msg.includes('⚠️')) inferredType = 'warning';
        if (msg.includes('başarılı') || msg.includes('Başarılı') || msg.includes('✅') || msg.includes('🎉')) inferredType = 'success';
        if (msg.includes('silindi') || msg.includes('Engellendi') || msg.includes('❌')) inferredType = 'error';
    }
    showToast(msg, inferredType);
};

/* ============================================================================
   SOL ALT TARAF WİDGET (CANLI SİSTEM & İPUCU KARTI)
   ============================================================================ */
const aiTips = [
    "💡 Midjourney v6 ile foto-gerçekçi çıktılar almak için prompt sonuna '--v 6.0 --style raw' ekleyin.",
    "💡 ChatGPT Plus'ta Custom GPT'ler oluşturarak özel çalışma asistanları elde edebilirsiniz.",
    "💡 Claude 3.5 Sonnet, karmaşık kod analizi ve uzun doküman özetlemede üstün performans sunar.",
    "💡 Gemini Advanced, Google Workspace entegrasyonu sayesinde belgelerinizi doğrudan analiz eder.",
    "💡 Karşılaştırma Laboratuvarımızı kullanarak ihtiyacınıza en uygun yapay zekayı anında belirleyebilirsiniz."
];
let currentTipIdx = 0;

function renderSidebarBottomWidget() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    let targetContainer = sidebar.querySelector('.premium-section');
    if (!targetContainer) {
        targetContainer = document.createElement('div');
        targetContainer.className = 'premium-section';
        sidebar.appendChild(targetContainer);
    }

    const user = JSON.parse(localStorage.getItem('user'));
    const isDev = user && user.isDev;
    const isPremium = user && user.isPremium;

    let badgeText = "👑 PRO Üyelik";
    let badgeTitle = "Sınırsız AI Araç Analizi";
    let btnText = "👑 Yükselt / Key Gir";

    if (isDev) {
        badgeText = "💻 Geliştirici Modu";
        badgeTitle = "Yeni Araç Yayınlama Yetkisi";
        btnText = "➕ Yeni Araç Ekle";
    } else if (isPremium) {
        badgeText = "👑 PRO Üye";
        badgeTitle = "Tüm Özellikler Aktif";
        btnText = "✨ Profilimi İncele";
    }

    targetContainer.innerHTML = `
        <div class="sidebar-bottom-widget">
            <!-- Canlı Sistem Durumu -->
            <div class="sidebar-status-card">
                <div class="status-pulse-dot"></div>
                <div class="status-info">
                    <span class="status-title">Sistem Çevrimiçi</span>
                    <span class="status-sub">%99.9 Sunucu Erişilebilirliği</span>
                </div>
            </div>

            <!-- Günün AI İpucu Kartı -->
            <div class="sidebar-tip-card">
                <div class="tip-header">
                    <span>Günün AI İpucu</span>
                    <div class="tip-controls">
                        <button onclick="prevAiTip(event)" title="Önceki İpucu">‹</button>
                        <button onclick="nextAiTip(event)" title="Sonraki İpucu">›</button>
                    </div>
                </div>
                <p id="sidebar-tip-text" class="tip-content">${aiTips[currentTipIdx]}</p>
            </div>

            <!-- PRO / Dev Banner -->
            <div class="sidebar-pro-card">
                <div class="pro-card-badge">${badgeText}</div>
                <div class="pro-card-title">${badgeTitle}</div>
                <button class="pro-card-btn" onclick="sidebarActionClick()">${btnText}</button>
            </div>
        </div>
    `;
}

function nextAiTip(e) {
    if (e) e.stopPropagation();
    currentTipIdx = (currentTipIdx + 1) % aiTips.length;
    const el = document.getElementById('sidebar-tip-text');
    if (el) el.innerText = aiTips[currentTipIdx];
}

function prevAiTip(e) {
    if (e) e.stopPropagation();
    currentTipIdx = (currentTipIdx - 1 + aiTips.length) % aiTips.length;
    const el = document.getElementById('sidebar-tip-text');
    if (el) el.innerText = aiTips[currentTipIdx];
}

function sidebarActionClick() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.isDev) {
        openSubmitToolModal();
    } else {
        window.location.href = 'profile.html';
    }
}

// Sayfa yüklendiğinde çalışacak ana fonksiyon
document.addEventListener('DOMContentLoaded', () => {
    console.log("Sayfa yüklendi, fonksiyonlar başlatılıyor...");
    
    // 1. SPLASH SCREEN KONTROLÜ
    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => { splash.style.display = 'none'; }, 500);
        }, 1500);
    }

    canvasAnimasyonunuBaslat(); // Arka plan animasyonu
    kullaniciDurumunuKontrolEt(); // Giriş yapmış mı?
    modelleriGetir(); // Veritabanından araçları çek
    filtreleriAyarla(); // Arama ve buton filtreleri
    mobilMenuyuAyarla(); // Mobil yan menü aç/kapat işlemleri
    aiAdvisorAyarla(); // Nova Asistan Formları
    gelistiriciButonlariniGuncelle();
    renderSidebarBottomWidget(); // Sol alt taraf widget'ı yükle

    // TEMA KONTROLÜ
    const temaSecici = document.getElementById('theme-selector');
    if (temaSecici) {
        const kaydedilenTema = localStorage.getItem('siteTheme') || 'dark';
        document.body.setAttribute('data-theme', kaydedilenTema);
        temaSecici.value = kaydedilenTema;
        
        temaSecici.addEventListener('change', (e) => {
            const yeniTema = e.target.value;
            document.body.setAttribute('data-theme', yeniTema);
            localStorage.setItem('siteTheme', yeniTema);
        });
    }
    
    const girisButonu = document.querySelector('#login-or-profile-btn');
    if(girisButonu) girisButonu.onclick = modalAc;

    const toggleAuthBtn = document.getElementById('toggle-auth');
    if (toggleAuthBtn) {
        toggleAuthBtn.onclick = (e) => {
            e.preventDefault();
            girisModuMu = !girisModuMu;
            document.getElementById('modal-title').innerText = girisModuMu ? "Giriş Yap" : "Kayıt Ol";
            document.getElementById('toggle-auth').innerText = girisModuMu ? "Hesabınız yok mu? Hemen Kayıt Olun" : "Zaten hesabınız var mı? Giriş Yapın";
            
            const passField = document.getElementById('auth-password');
            if(passField) {
                passField.style.display = girisModuMu ? 'block' : 'none';
            }
        };
    }

    const authSubmitBtn = document.getElementById('auth-submit-btn');
    if (authSubmitBtn) authSubmitBtn.onclick = girisYapVeyaKayitOl;
});


// ARKAPLAN ANİMASYONU (Sinir Ağı)
function canvasAnimasyonunuBaslat() {
    const canvas = document.getElementById('hero-canvas');
    if(!canvas) {
        console.log("Canvas bulunamadı usta, geçiyorum.");
        return;
    }
    const ctx = canvas.getContext('2d');
    let noktalar = [];
    const noktaSayisi = 80; // Hocam 80 nokta kasmıyor, ideal
    const maxMesafe = 150;

    const boyutlandir = () => { 
        canvas.width = window.innerWidth; 
        canvas.height = 600; 
    };
    window.addEventListener('resize', boyutlandir);
    boyutlandir();

    // Rastgele noktalar oluşturuyoruz
    for(let i=0; i < noktaSayisi; i++) {
        noktalar.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8
        });
    }

    function ciz() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for(let i=0; i < noktaSayisi; i++) {
            let n = noktalar[i];
            n.x += n.vx;
            n.y += n.vy;

            // Kenarlardan sekme mantığı (fizik kuralları :))
            if(n.x < 0 || n.x > canvas.width) n.vx *= -1;
            if(n.y < 0 || n.y > canvas.height) n.vy *= -1;

            ctx.fillStyle = "rgba(56, 189, 248, 0.8)";
            ctx.beginPath();
            ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
            ctx.fill();

            // Çizgileri çizdiriyoruz
            for(let j=i+1; j < noktaSayisi; j++) {
                let n2 = noktalar[j];
                let mesafe = Math.sqrt((n.x - n2.x)**2 + (n.y - n2.y)**2);

                if(mesafe < maxMesafe) {
                    ctx.strokeStyle = `rgba(56, 189, 248, ${1 - mesafe/maxMesafe})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(n.x, n.y);
                    ctx.lineTo(n2.x, n2.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(ciz); // Sürekli döngü
    }
    ciz();
}

// MOBİL MENÜ AÇMA / KAPATMA İŞLEMİ
function mobilMenuyuAyarla() {
    const mobileBtn = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const closeBtn = document.getElementById('sidebar-close');

    if (!sidebar) return;

    const openSidebar = () => {
        sidebar.classList.add('mobile-open');
        if (overlay) overlay.classList.add('active');
    };

    const closeSidebar = () => {
        sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
    };

    if (mobileBtn) mobileBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    const menuLinks = sidebar.querySelectorAll('.menu-item');
    menuLinks.forEach(link => {
        link.addEventListener('click', closeSidebar);
    });
}

// FİLTRELEME İŞLEMLERİ
function filtreleriAyarla() {
    const aramaKutusu = document.getElementById('search-input');
    const filtreButonlari = document.querySelectorAll('.filter-btn');
    const fiyatFiltresi = document.getElementById('pricing-filter');
    const siralamaFiltresi = document.getElementById('sort-filter');

    const filtreleriGuncelle = () => {
        const aktifKategori = document.querySelector('.filter-btn.active').dataset.category;
        const fiyat = fiyatFiltresi ? fiyatFiltresi.value : "Tümü";
        const siralama = siralamaFiltresi ? siralamaFiltresi.value : "varsayilan";
        aracFiltrleVeEkranaBas(aramaKutusu.value, aktifKategori, fiyat, siralama);
    };

    if(aramaKutusu) aramaKutusu.addEventListener('input', filtreleriGuncelle);
    if(fiyatFiltresi) fiyatFiltresi.addEventListener('change', filtreleriGuncelle);
    if(siralamaFiltresi) siralamaFiltresi.addEventListener('change', filtreleriGuncelle);

    filtreButonlari.forEach(btn => {
        btn.addEventListener('click', () => {
            filtreButonlari.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtreleriGuncelle();
        });
    });
}

function aracFiltrleVeEkranaBas(arananKelime, kategori, fiyat = "Tümü", siralama = "varsayilan") {
    arananKelime = arananKelime.toLowerCase();
    
    // İngilizce kelimeleri Türkçeye bağlıyoruz (Hocam veritabanı İngilizce kaldı biraz)
    const kategoriSozlugu = {
        "Görsel": ["görsel", "images", "3d", "image", "design", "art", "photo"],
        "Metin": ["metin", "text", "language", "writing", "content", "email", "blog"],
        "Kod": ["kod", "coding", "developer", "sql", "code", "github"],
        "Ses/Video": ["ses/video", "video", "music", "audio", "voice", "speech", "podcast", "youtube"]
    };

    const filtrelenmisListe = butunAraclar.filter(arac => {
        const isimUyarMi = arac.name.toLowerCase().includes(arananKelime) || 
                             (arac.description && arac.description.toLowerCase().includes(arananKelime));
        
        let kategoriUyarMi = false;
        if (kategori === "Tümü") {
            kategoriUyarMi = true;
        } else if (kategori === "Favoriler") {
            const favs = JSON.parse(localStorage.getItem('favs') || '[]');
            kategoriUyarMi = favs.includes(arac.id.toString());
        } else if (kategoriSozlugu[kategori]) {
            const aracKat = arac.category ? arac.category.toLowerCase() : "";
            kategoriUyarMi = kategoriSozlugu[kategori].some(anahtarKelime => aracKat.includes(anahtarKelime));
        } else {
            kategoriUyarMi = arac.category === kategori;
        }
        
        let fiyatUyarMi = true;
        if (fiyat !== "Tümü") {
            const aracFiyati = arac.price ? arac.price.toLowerCase() : "";
            if(fiyat === "Ücretsiz") fiyatUyarMi = aracFiyati.includes("free") || aracFiyati.includes("ücretsiz");
            else if(fiyat === "Freemium") fiyatUyarMi = aracFiyati.includes("freemium");
            else if(fiyat === "Ücretli") fiyatUyarMi = aracFiyati.includes("paid") || aracFiyati.includes("ücretli");
        }

        return isimUyarMi && kategoriUyarMi && fiyatUyarMi;
    });
    
    if (siralama === "puan-azalan") {
        filtrelenmisListe.sort((a, b) => {
            const aPuani = a.reviews && a.reviews.length > 0 ? a.reviews.reduce((t, r) => t + r.rating, 0) / a.reviews.length : 0;
            const bPuani = b.reviews && b.reviews.length > 0 ? b.reviews.reduce((t, r) => t + r.rating, 0) / b.reviews.length : 0;
            return bPuani - aPuani;
        });
    } else if (siralama === "isim-azalan") {
        filtrelenmisListe.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    ekranaAraclariBas(filtrelenmisListe);
}

function ekranaAraclariBas(araclarListe) {
    const kutu = document.getElementById('tools-container');
    if (!kutu) return;
    if(araclarListe.length === 0) {
        kutu.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 1.1rem;">Aradığınız kriterlere uygun araç bulunamadı.</p>`;
        return;
    }
    
    const favs = JSON.parse(localStorage.getItem('favs') || '[]');

    kutu.innerHTML = araclarListe.map(arac => {
        const isFav = favs.includes(arac.id.toString());
        return `
        <div class="card" style="position: relative;">
            <div class="fav-btn-icon ${isFav ? 'favorited' : ''}" onclick="toggleFavorite(event, '${arac.id}')">
                ${isFav ? '❤️' : '🤍'}
            </div>
            <div>
                <span style="color:var(--primary-color); font-size:0.7rem; font-weight:800; text-transform:uppercase;">${arac.category}</span>
                <h3 style="margin:10px 0; font-size:1.4rem; color: var(--text-color);">${arac.name}</h3>
                <p style="color:var(--text-muted); font-size:0.9rem; line-height:1.5;">${arac.description}</p>
            </div>
            <a href="details.html?id=${arac.id}" class="details-link">DETAYLARI GÖR</a>
        </div>
    `}).join('');
}

function toggleFavorite(event, id) {
    event.preventDefault(); 
    event.stopPropagation();
    let favs = JSON.parse(localStorage.getItem('favs') || '[]');
    if(favs.includes(id.toString())) {
        favs = favs.filter(fId => fId !== id.toString());
    } else {
        favs.push(id.toString());
    }
    localStorage.setItem('favs', JSON.stringify(favs));
    
    // Eğer o an favoriler sekmesindeyse, yeniden filtrele ki giden gitsin
    const aktifKategori = document.querySelector('.filter-btn.active').dataset.category;
    if(aktifKategori === 'Favoriler') {
        const aramaKutusu = document.getElementById('search-input');
        aracFiltrleVeEkranaBas(aramaKutusu.value, "Favoriler");
    } else {
        // Değilse sadece butonu güncelle
        const btn = event.currentTarget;
        if(favs.includes(id.toString())) {
            btn.classList.add('favorited');
            btn.innerHTML = '❤️';
        } else {
            btn.classList.remove('favorited');
            btn.innerHTML = '🤍';
        }
    }
}

// VERİTABANINDAN (API'DEN) VERİLERİ ÇEKİYORUZ
async function modelleriGetir() {
    try {
        let localCustom = JSON.parse(localStorage.getItem('customTools') || '[]');
        let cachedTools = JSON.parse(localStorage.getItem('cachedTools') || '[]');
        let tools = cachedTools;

        let cevap = await fetch(`/api/tools?t=` + Date.now()).catch(() => null);
        if (!cevap || !cevap.ok) {
            cevap = await fetch(`tools.json`).catch(() => null);
        }
        if (cevap && cevap.ok) {
            tools = await cevap.json();
            try { localStorage.setItem('cachedTools', JSON.stringify(tools)); } catch(e) {}
        }

        const combined = [...tools, ...localCustom];
        butunAraclar = Array.from(new Map(combined.map(item => [String(item.id || item.name), item])).values());
        console.log(butunAraclar.length + " tane araç yüklendi.");
        uiEfektleriniBaslat(butunAraclar);
        ekranaAraclariBas(butunAraclar);
        spotlightGuncelle(butunAraclar);
    } catch (hata) { 
        console.error("Hocam api çöktü galiba, modeller yüklenemedi:", hata); 
    }
}

function uiEfektleriniBaslat(araclar) {
    // 1. İstatistik Çubuğu
    const statTools = document.getElementById('stat-tools');
    const statCats = document.getElementById('stat-cats');
    const statReviews = document.getElementById('stat-reviews');

    if (statTools && statCats && statReviews && araclar.length > 0) {
        const categories = new Set(araclar.map(a => a.category).filter(c => c));
        let reviewCount = 0;
        araclar.forEach(a => { if (a.reviews) reviewCount += a.reviews.length; });

        sayiAnimasyonu(statTools, araclar.length, 1500);
        sayiAnimasyonu(statCats, categories.size, 1500);
        sayiAnimasyonu(statReviews, reviewCount > 0 ? reviewCount : 150, 1500); 
    }

    // 2. Günün Aracı (Spotlight)
    const spotlightContainer = document.getElementById('spotlight-container');
    if (spotlightContainer && araclar.length > 0) {
        let puanliAraclar = araclar.filter(a => a.reviews && a.reviews.length > 0);
        let secilenArac;
        
        if (puanliAraclar.length > 0) {
            secilenArac = puanliAraclar[Math.floor(Math.random() * puanliAraclar.length)];
        } else {
            const unluAraclar = ["ChatGPT", "Midjourney", "Claude", "GitHub Copilot", "DALL-E"];
            const yedekler = araclar.filter(a => unluAraclar.some(u => a.name.toLowerCase().includes(u.toLowerCase())));
            secilenArac = yedekler.length > 0 ? yedekler[Math.floor(Math.random() * yedekler.length)] : araclar[0];
        }

        if (secilenArac) {
            document.getElementById('spotlight-cat').innerText = secilenArac.category || 'AI';
            document.getElementById('spotlight-title').innerText = secilenArac.name;
            document.getElementById('spotlight-desc').innerText = secilenArac.description || '';
            document.getElementById('spotlight-link').href = `details.html?id=${secilenArac.id}`;
            spotlightContainer.style.display = 'block';
            
            const aramaKutusu = document.getElementById('search-input');
            if (aramaKutusu) {
                aramaKutusu.addEventListener('input', (e) => {
                    if (e.target.value.trim().length > 0) {
                        spotlightContainer.style.display = 'none';
                    } else {
                        spotlightContainer.style.display = 'block';
                    }
                });
            }
        }
    }
}

function sayiAnimasyonu(element, hedefSayi, sure) {
    let baslangic = 0;
    const adimSayisi = 30;
    const sureAdimi = sure / adimSayisi;
    const artis = hedefSayi / adimSayisi;
    
    let timer = setInterval(() => {
        baslangic += artis;
        if (baslangic >= hedefSayi) {
            clearInterval(timer);
            element.innerText = hedefSayi + "+";
        } else {
            element.innerText = Math.floor(baslangic);
        }
    }, sureAdimi);
}

// AI ADVISOR TAVSİYE FONKSİYONLARI
function aiAdvisorAyarla() {
    const msgContainer = document.getElementById('advisor-messages');
    if (!msgContainer) return;
    
    // Event delegation: Dynamically works for all present and future option buttons
    msgContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.advisor-option-btn');
        if (!btn) return;
        
        const kategori = btn.dataset.ask;
        if (!kategori) return; // Ignore buttons like Canlı Desteğe Bağlan which use onclick
        
        const btnText = btn.innerText;

        // Add user selection bubble
        msgContainer.innerHTML += `
            <div style="background: rgba(56, 189, 248, 0.2); border: 1px solid rgba(56, 189, 248, 0.35); padding: 10px 15px; border-radius: 15px 15px 0 15px; color: #fff; font-size: 0.9rem; max-width: 85%; align-self: flex-end; margin-left: auto; margin-top: 10px;">
                ${btnText}
            </div>
        `;

        // Hide main options list temporarily
        const optionsBox = document.getElementById('advisor-options');
        if (optionsBox) optionsBox.style.display = 'none';

        // Typing indicator
        const yaziyorId = 'typing-' + Date.now();
        msgContainer.innerHTML += `
            <div id="${yaziyorId}" style="background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 15px 15px 15px 0; color: #94a3b8; font-size: 0.9rem; max-width: 85%; margin-top: 10px;">
                Nova Düşünüyor...
            </div>
        `;
        msgContainer.scrollTop = msgContainer.scrollHeight;

        setTimeout(() => {
            const typingEl = document.getElementById(yaziyorId);
            if (typingEl) typingEl.remove();

            const kategoriSozlugu = {
                "Görsel": ["görsel", "images", "3d", "image", "design", "art", "photo"],
                "Metin": ["metin", "text", "language", "writing", "content", "email", "blog"],
                "Kod": ["kod", "coding", "developer", "sql", "code", "github"],
                "Ses/Video": ["ses/video", "video", "music", "audio", "voice", "speech", "podcast", "youtube"]
            };

            let uygunAraclar = butunAraclar.filter(arac => {
                if (kategoriSozlugu[kategori]) {
                    const aracKat = arac.category ? arac.category.toLowerCase() : "";
                    return kategoriSozlugu[kategori].some(kelime => aracKat.includes(kelime));
                }
                return false;
            });

            let cevapMesaji = "";
            if (uygunAraclar.length > 0) {
                const secilen = uygunAraclar[Math.floor(Math.random() * Math.min(uygunAraclar.length, 4))];
                cevapMesaji = `✨ Sana harika bir önerim var! <b>${secilen.name}</b> aracı tam aradığın yeteneklere sahip.<br><span style="color:#cbd5e1; font-size:0.85rem; display:block; margin-top:4px;">${secilen.description || ''}</span><br>
                <a href="details.html?id=${secilen.id}" style="color: #38bdf8; text-decoration: none; font-weight: bold; background: rgba(56,189,248,0.15); padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(56,189,248,0.3); display: inline-block; margin-top: 5px;">Hemen İncele ↗</a>`;
            } else {
                cevapMesaji = "Bu kategoride henüz sistemimizde kayıtlı bir araç bulunmuyor.";
            }

            msgContainer.innerHTML += `
                <div style="background: rgba(255,255,255,0.05); padding: 12px 15px; border-radius: 15px 15px 15px 0; color: #e2e8f0; font-size: 0.9rem; max-width: 85%; margin-top: 10px;">
                    ${cevapMesaji}
                </div>
                <div style="margin-top: 10px; text-align: center;">
                    <button onclick="resetAdvisorOptions()" style="background: rgba(56,189,248,0.1); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); padding: 6px 14px; border-radius: 10px; font-size: 0.8rem; font-weight: 700; cursor: pointer;">🔄 Başka Bir Seçenek Dene</button>
                </div>
            `;
            msgContainer.scrollTop = msgContainer.scrollHeight;
        }, 800);
    });
}

function resetAdvisorOptions() {
    const optionsBox = document.getElementById('advisor-options');
    if (optionsBox) {
        optionsBox.style.display = 'flex';
        optionsBox.scrollIntoView({ behavior: 'smooth' });
    }
}

function spotlightGuncelle(araclar) {
    const populerKutu = document.getElementById('popular-tools-container');
    const populerBolum = document.getElementById('popular-section');
    if (!populerKutu || !populerBolum) return;

    let puanliAraclar = araclar.filter(a => a.reviews && a.reviews.length > 0);
    
    puanliAraclar.sort((a, b) => {
        const aPuani = a.reviews.reduce((toplam, r) => toplam + r.rating, 0);
        const bPuani = b.reviews.reduce((toplam, r) => toplam + r.rating, 0);
        return bPuani - aPuani;
    });

    let enIyiAraclar = puanliAraclar.slice(0, 4);

    // Yeterli veri yoksa popülerleri manuel ekliyoruz çaktırmayın :D
    if (enIyiAraclar.length < 4) {
        const unluAraclar = ["ChatGPT", "Midjourney", "Claude", "GitHub Copilot", "DALL-E"];
        const yedekAraclar = araclar.filter(a => unluAraclar.some(isim => a.name.toLowerCase().includes(isim.toLowerCase())));
        
        for (let yedek of yedekAraclar) {
            if (enIyiAraclar.length >= 4) break;
            if (!enIyiAraclar.find(a => a.id === yedek.id)) {
                enIyiAraclar.push(yedek);
            }
        }
    }

    if (enIyiAraclar.length > 0) {
        populerBolum.style.display = 'block';
        const favs = JSON.parse(localStorage.getItem('favs') || '[]');
        
        populerKutu.innerHTML = enIyiAraclar.map(arac => {
            let yildizHtml = "";
            if (arac.reviews && arac.reviews.length > 0) {
                const ortalama = arac.reviews.reduce((t, r) => t + r.rating, 0) / arac.reviews.length;
                yildizHtml = `<div style="color: #fbbf24; font-size: 0.8rem; margin-top: 5px;">⭐ ${ortalama.toFixed(1)} (${arac.reviews.length} Yorum)</div>`;
            }

            const isFav = favs.includes(arac.id.toString());

            return `
            <div class="card popular-card" style="position: relative; overflow: hidden;">
                <div style="position: absolute; top: -15px; right: -25px; background: #f59e0b; color: #000; font-weight: bold; padding: 20px 30px 5px 30px; transform: rotate(45deg); font-size: 0.7rem; z-index: 10;">POPÜLER</div>
                <div class="fav-btn-icon ${isFav ? 'favorited' : ''}" onclick="toggleFavorite(event, '${arac.id}')" style="top: 15px; right: 50px;">
                    ${isFav ? '❤️' : '🤍'}
                </div>
                <div>
                    <span style="color:#f59e0b; font-size:0.7rem; font-weight:800; text-transform:uppercase;">${arac.category || 'AI'}</span>
                    <h3 style="margin:10px 0; font-size:1.4rem; color: var(--text-color);">${arac.name}</h3>
                    <p style="color:var(--text-muted); font-size:0.9rem; line-height:1.5;">${arac.description ? arac.description.substring(0, 80) + '...' : ''}</p>
                    ${yildizHtml}
                </div>
                <a href="details.html?id=${arac.id}" class="details-link" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-color: rgba(245, 158, 11, 0.3);">DETAYLARI GÖR</a>
            </div>
            `;
        }).join('');
    } else {
        populerBolum.style.display = 'none';
    }
}

// GİRİŞ / ÇIKIŞ / PREMİUM İŞLEMLERİ
async function girisYapVeyaKayitOl() {
    const kAdi = document.getElementById('auth-username').value;
    let sifre = document.getElementById('auth-password').value;
    
    if (!girisModuMu && !sifre) sifre = "none"; // Kayıt modundaysa ve şifre girilmediyse
    
    if(!kAdi) { showToast("Lütfen kullanıcı adınızı giriniz.", "warning"); return; }

    const urlYolu = girisModuMu ? '/login' : '/register';
    
    try {
        const cevap = await fetch(`${API_BASE}${urlYolu}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: kAdi, password: sifre })
        });
        const gelenVeri = await cevap.json();
        
        if (cevap.ok) {
            aktifKullanici = gelenVeri.user;
            localStorage.setItem('user', JSON.stringify(aktifKullanici));
            modalKapat();
            kullaniciDurumunuKontrolEt();
            console.log("Giriş başarılı hocam.");
        } else {
            showToast(gelenVeri.message || "Giriş işlemi başarısız.", "error");
        }
    } catch (hata) { 
        // Sunucu yoksa LocalStorage ile Front-end simülasyonu yap
        console.log("Sunucuya bağlanılamadı, Frontend modunda giriş yapılıyor.");
        aktifKullanici = { id: Date.now().toString(), username: kAdi, password: sifre };
        localStorage.setItem('user', JSON.stringify(aktifKullanici));
        modalKapat();
        kullaniciDurumunuKontrolEt();
    }
}

async function kullaniciDurumunuKontrolEt() {
    const kullaniciArayuzu = document.getElementById('auth-ui');
    if(!kullaniciArayuzu) return;

    if (!aktifKullanici) {
        kullaniciArayuzu.innerHTML = `
            <a href="profile.html" class="auth-btn" id="header-profile-btn" style="background: rgba(56,189,248,0.1); border-color: #38bdf8; color: #38bdf8; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">👤 Profilim</a>
            <button class="auth-btn" id="login-or-profile-btn" onclick="modalAc()">🔑 Giriş Yap</button>
        `;
        return;
    }

    // Eşleşmiş onaylı geliştirici durumunu kontrol et
    const approvedDevs = JSON.parse(localStorage.getItem('approvedDevs') || '[]');
    const isApproved = approvedDevs.some(d => 
        (d.email && aktifKullanici.email && d.email.toLowerCase() === aktifKullanici.email.toLowerCase()) ||
        (d.username && d.username.toLowerCase() === aktifKullanici.username.toLowerCase())
    );

    if (isApproved && !aktifKullanici.isDev) {
        aktifKullanici.isDev = true;
        aktifKullanici.showDevCongratulation = true;
        localStorage.setItem('user', JSON.stringify(aktifKullanici));
    }

    // Tebrikler modalı kontrolü
    if (aktifKullanici.showDevCongratulation) {
        const devModal = document.getElementById('dev-congrats-modal');
        if (devModal) devModal.style.display = 'flex';
    }
    
    kullaniciArayuzu.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
            <span style="color:#fff; font-size:0.9rem;">Selam, <b>${aktifKullanici.username}</b> ${aktifKullanici.isDev ? '<span style="color:#c084fc; font-size:0.75rem; font-weight:700; background:rgba(192,132,252,0.15); padding:2px 8px; border-radius:10px; border:1px solid rgba(192,132,252,0.3);">💻 DEV</span>' : ''}</span>
            <a href="inbox.html" class="auth-btn" style="position: relative; background: rgba(192,132,252,0.1); border-color: rgba(192,132,252,0.4); color: #c084fc; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                🔔 Gelen Kutusu <span id="inbox-badge" style="background:#ef4444; color:#fff; font-size:0.7rem; font-weight:800; padding:1px 6px; border-radius:10px; display:none;">0</span>
            </a>
            <a href="profile.html" class="auth-btn" style="background: rgba(56,189,248,0.1); border-color: #38bdf8; color: #38bdf8; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">👤 Profilim</a>
            <button class="auth-btn" onclick="cikisYap()" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05); padding: 9px 13px;">Çıkış</button>
        </div>
    `;

    setTimeout(updateInboxBadge, 100);
    gelistiriciButonlariniGuncelle();
}

function gelistiriciButonlariniGuncelle() {
    const devContainer = document.getElementById('dev-action-container');
    if (!devContainer) return;

    let user = null;
    try { user = JSON.parse(localStorage.getItem('user')); } catch(e) {}

    const approvedDevs = JSON.parse(localStorage.getItem('approvedDevs') || '[]');
    const isApproved = user && approvedDevs.some(d => 
        (d.email && user.email && d.email.toLowerCase() === user.email.toLowerCase()) ||
        (d.username && d.username.toLowerCase() === user.username.toLowerCase())
    );

    const isDeveloper = (user && user.isDev) || isApproved;

    if (isDeveloper) {
        devContainer.innerHTML = `
            <button class="auth-btn" style="background: rgba(34, 197, 94, 0.15); border-color: rgba(34, 197, 94, 0.4); color: #4ade80; padding: 6px 14px; font-size: 0.85rem; font-weight:700;" onclick="openSubmitToolModal()">➕ Araç Ekle</button>
        `;
    } else {
        devContainer.innerHTML = `
            <button class="auth-btn" style="background: rgba(139, 92, 246, 0.15); border-color: rgba(139, 92, 246, 0.4); color: #c084fc; padding: 6px 14px; font-size: 0.85rem; font-weight:700;" onclick="openDevRequestModal()">💻 Geliştirici Ol</button>
        `;
    }
}

function submitSupportTicket(e) {
    if(e && e.preventDefault) e.preventDefault();
    const subjectEl = document.getElementById('ticket-subject');
    const priorityEl = document.getElementById('ticket-priority');
    const messageEl = document.getElementById('ticket-message');

    if(!subjectEl || !messageEl) return;

    const subject = subjectEl.value.trim();
    const priority = priorityEl ? priorityEl.value : 'Normal';
    const message = messageEl.value.trim();

    if(!subject || !message) {
        showToast("Lütfen tüm zorunlu alanları doldurunuz.", "warning");
        return;
    }

    const user = JSON.parse(localStorage.getItem('user')) || { username: 'Misafir' };

    const ticket = {
        id: 'TKT-' + Math.floor(1000 + Math.random() * 9000),
        username: user.username,
        email: user.email || '-',
        subject: subject,
        priority: priority,
        message: message,
        status: 'Açık',
        date: new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    let tickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
    tickets.unshift(ticket);
    localStorage.setItem('supportTickets', JSON.stringify(tickets));

    // Bildirim ekle
    let notifs = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    notifs.unshift({
        id: 'notif-' + Date.now(),
        targetUser: user.username,
        icon: '💬',
        title: `Destek Talebi Oluşturuldu (#${ticket.id})`,
        message: `'${subject}' konulu destek talebiniz başarıyla alındı. Yönetici ekibimiz en kısa sürede talebinizi inceleyecektir.`,
        date: ticket.date,
        isRead: false
    });
    localStorage.setItem('userNotifications', JSON.stringify(notifs));

    showToast(`Destek talebiniz oluşturuldu! (Talep No: #${ticket.id})`, "success", "Destek Talebi Alındı");
    if(e && e.target && e.target.reset) e.target.reset();
}

// GELEN KUTUSU (INBOX) YÖNETİMİ
function getActiveUserNotifications() {
    const allNotifs = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    if (!aktifKullanici) return [];
    return allNotifs.filter(n => 
        n.targetUser === 'all' || 
        n.targetUser === aktifKullanici.username || 
        (aktifKullanici.email && n.targetUser === aktifKullanici.email)
    );
}

function updateInboxBadge() {
    const notifs = getActiveUserNotifications();
    const unreadCount = notifs.filter(n => !n.isRead).length;
    const badge = document.getElementById('inbox-badge');
    if (badge) {
        if (unreadCount > 0) {
            badge.innerText = unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

function openInboxModal() {
    const modal = document.getElementById('inbox-modal');
    if (!modal) return;
    renderInboxList();
    modal.style.display = 'flex';
}

function closeInboxModal() {
    const modal = document.getElementById('inbox-modal');
    if (modal) modal.style.display = 'none';
    updateInboxBadge();
}

function renderInboxList() {
    const listEl = document.getElementById('inbox-list');
    if (!listEl) return;
    const notifs = getActiveUserNotifications();

    if (notifs.length === 0) {
        listEl.innerHTML = `
            <div style="text-align:center; padding:30px 10px; color:#64748b;">
                <div style="font-size:2rem; margin-bottom:8px;">📭</div>
                Gelen kutunuzda henüz bildirim bulunmuyor.
            </div>
        `;
        return;
    }

    listEl.innerHTML = notifs.map(n => `
        <div style="background: ${n.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(192,132,252,0.08)'}; border: 1px solid ${n.isRead ? 'rgba(255,255,255,0.05)' : 'rgba(192,132,252,0.25)'}; padding: 12px 15px; border-radius: 12px; position: relative;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <strong style="font-size: 0.9rem; color: #fff; display: flex; align-items: center; gap: 6px;">${n.icon} ${n.title}</strong>
                <span style="font-size: 0.72rem; color: #64748b;">${n.date}</span>
            </div>
            <p style="font-size: 0.83rem; color: #cbd5e1; line-height: 1.4; margin: 0;">${n.message}</p>
        </div>
    `).join('');
}

function markAllNotificationsRead() {
    let allNotifs = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    if (aktifKullanici) {
        allNotifs = allNotifs.map(n => {
            if (n.targetUser === 'all' || n.targetUser === aktifKullanici.username || (aktifKullanici.email && n.targetUser === aktifKullanici.email)) {
                return { ...n, isRead: true };
            }
            return n;
        });
        localStorage.setItem('userNotifications', JSON.stringify(allNotifs));
    }
    renderInboxList();
    updateInboxBadge();
}

function clearNotifications() {
    let allNotifs = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    if (aktifKullanici) {
        allNotifs = allNotifs.filter(n => 
            n.targetUser !== 'all' && 
            n.targetUser !== aktifKullanici.username && 
            (!aktifKullanici.email || n.targetUser !== aktifKullanici.email)
        );
        localStorage.setItem('userNotifications', JSON.stringify(allNotifs));
    }
    renderInboxList();
    updateInboxBadge();
}

function dismissDevCongrats() {
    if (aktifKullanici) {
        aktifKullanici.showDevCongratulation = false;
        localStorage.setItem('user', JSON.stringify(aktifKullanici));
    }
    const modal = document.getElementById('dev-congrats-modal');
    if(modal) modal.style.display = 'none';
    openSubmitToolModal();
}

function profilTikla() {
    window.location.href = 'profile.html';
}

function modalAc() { document.getElementById('auth-modal').style.display = 'flex'; }
function modalKapat() { document.getElementById('auth-modal').style.display = 'none'; }
function cikisYap() { 
    localStorage.removeItem('user'); 
    location.reload(); 
    console.log("Çıkış yapıldı.");
}

// SOHBET BOTU (NOVA) VE KARŞILAŞTIRMA MANTIĞI
document.addEventListener('DOMContentLoaded', () => {
    // Karşılaştırma Butonu
    const karsilastirButonu = document.querySelector('.compare-btn');
    if(karsilastirButonu) {
        karsilastirButonu.addEventListener('click', () => {
            window.location.href = 'compare.html';
        });
    }

    // Bot HTML Elementlerini yakalıyoruz
    const botAcmaButonu = document.getElementById('advisor-toggle');
    const botPenceresi = document.getElementById('advisor-window');
    const botKapatButonu = document.getElementById('advisor-close');
    const gonderButonu = document.getElementById('advisor-send');
    const mesajKutusu = document.getElementById('advisor-input');
    const mesajlarEkrani = document.getElementById('advisor-messages');

    if(botAcmaButonu) {
        botAcmaButonu.addEventListener('click', () => {
            botPenceresi.style.display = botPenceresi.style.display === 'none' ? 'flex' : 'none';
        });
    }

    if(botKapatButonu) {
        botKapatButonu.addEventListener('click', () => {
            botPenceresi.style.display = 'none';
        });
    }

    // Bota mesaj gönderme fonksiyonu (NOVA AKILLI YANITLAR)
    async function mesajGonder() {
        if(!mesajKutusu) return;
        const kullaniciMesaji = mesajKutusu.value.trim();
        if(!kullaniciMesaji) return;

        if (activeLiveSupportReq && activeLiveSupportReq.status === 'accepted') {
            sendUserLiveChatMessage(kullaniciMesaji);
            mesajKutusu.value = '';
            return;
        }

        mesajlarEkrani.innerHTML += `<div style="background: rgba(56,189,248,0.1); padding: 10px 15px; border-radius: 15px 15px 0 15px; color: #fff; font-size: 0.9rem; max-width: 85%; align-self: flex-end; margin-left: auto;">${kullaniciMesaji}</div>`;
        mesajKutusu.value = '';
        mesajlarEkrani.scrollTop = mesajlarEkrani.scrollHeight;

        const yukleniyorId = 'yukleniyor-' + Date.now();
        mesajlarEkrani.innerHTML += `<div id="${yukleniyorId}" style="background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 15px 15px 15px 0; color: #94a3b8; font-size: 0.9rem; max-width: 85%;">Nova Düşünüyor...</div>`;
        mesajlarEkrani.scrollTop = mesajlarEkrani.scrollHeight;

        const lowerMsg = kullaniciMesaji.toLowerCase();
        let akilliCevap = null;

        // GELİŞTİRİCİ SORGULARI
        if (lowerMsg.includes('geliştirici') || lowerMsg.includes('gelistirici')) {
            if (lowerMsg.includes('nasıl') || lowerMsg.includes('olunur') || lowerMsg.includes('olma')) {
                akilliCevap = "💻 **Geliştirici Nasıl Olunur?**\nÜst barda yer alan **'💻 Geliştirici Ol'** butonuna tıklayarak e-posta adresiniz ile başvuru yapabilirsiniz. Yönetici başvurunuzu onayladığında hesabınız geliştirici yetkisine kavuşur ve araç ekleyebilirsiniz!";
            } else if (lowerMsg.includes('durum') || lowerMsg.includes('onay') || lowerMsg.includes('başvuru')) {
                const user = JSON.parse(localStorage.getItem('user'));
                if (!user) {
                    akilliCevap = "Başvurunuzu sorgulamak için lütfen önce giriş yapın kanka!";
                } else if (user.isDev) {
                    akilliCevap = `🎉 Tebrikler **${user.username}**! Geliştirici başvurunuz onaylanmış. Üst bardaki **'➕ Araç Ekle'** butonunu kullanarak yeni araçlar yayınlayabilirsiniz!`;
                } else {
                    const pendingDevs = JSON.parse(localStorage.getItem('pendingDevs') || '[]');
                    const isPending = pendingDevs.some(d => (user.email && d.email === user.email) || d.username === user.username);
                    if (isPending) {
                        akilliCevap = `⏳ Sayın **${user.username}**, geliştirici başvurunuz şu anda yönetim panelinde inceleme aşamasındadır. En kısa sürede onaylanacaktır!`;
                    } else {
                        akilliCevap = `Henüz aktif bir geliştirici başvurunuz bulunmuyor. Üst bardaki **'💻 Geliştirici Ol'** butonundan e-posta adresinizle hemen başvurabilirsiniz.`;
                    }
                }
            } else {
                akilliCevap = "💻 **Geliştirici Modu:** Kendi yapay zeka araçlarınızı platformumuzda yayınlamanıza olanak tanır. Üst bardaki **'💻 Geliştirici Ol'** butonundan başvurabilirsiniz!";
            }
        } 
        // ARAÇ EKLEME SORGULARI
        else if (lowerMsg.includes('araç ekle') || lowerMsg.includes('arac ekle') || lowerMsg.includes('model ekle')) {
            akilliCevap = "➕ **Araç Ekleme:** Sadece onaylı Geliştiriciler araç ekleyebilir. Geliştiriciyseniz üst bardaki **'➕ Araç Ekle'** butonuna tıklayarak yeni yapay zeka araçları önerebilirsiniz!";
        }
        // PREMIUM & KEY SORGULARI
        else if (lowerMsg.includes('premium') || lowerMsg.includes('key')) {
            akilliCevap = "👑 **Premium Üyelik:** Profil sayfanızdaki **'🔑 Premium Key Aktifleştir'** alanına lisans kodunuzu girerek tüm gelişmiş AI araçlarına erişim sağlayabilirsiniz!";
        }
        // DESTEK TALEBİ & İLETİŞİM SORGULARI (NOVA DESTEK TAKİP MOTORU)
        else if (lowerMsg.includes('destek') || lowerMsg.includes('talep') || lowerMsg.includes('iletişim') || lowerMsg.includes('iletisim') || lowerMsg.includes('ulaş') || lowerMsg.includes('ulas') || lowerMsg.includes('sorun') || lowerMsg.includes('tkt')) {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                akilliCevap = "🔑 **Destek Talebi Sorgulama:**\nTaleplerinizi incelemek için lütfen önce hesabınıza giriş yapınız!";
            } else {
                const tickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
                const userTickets = tickets.filter(t => t.username === user.username);
                const notifs = JSON.parse(localStorage.getItem('userNotifications') || '[]');

                // Belirli bir talep numarası arandı mı?
                const searchedIdMatch = kullaniciMesaji.match(/tkt-?\d+/i);
                let searchedTicket = null;
                if (searchedIdMatch) {
                    const rawId = searchedIdMatch[0].toUpperCase().replace('TKT', 'TKT-');
                    searchedTicket = userTickets.find(t => t.id.toUpperCase() === rawId || t.id.toUpperCase() === rawId.replace('-', ''));
                }

                if (searchedTicket) {
                    const isSolved = searchedTicket.status === 'Çözüldü';
                    const replyNotif = notifs.find(n => n.targetUser === user.username && n.title && n.title.includes(`#${searchedTicket.id}`));
                    const replyText = replyNotif && replyNotif.adminNote ? replyNotif.adminNote : 'Talebiniz incelenmiş ve gerekli işlem sağlanmıştır.';

                    akilliCevap = `🎫 **Talep Detayı (#${searchedTicket.id}):**\n• Konu: **${searchedTicket.subject}**\n• Öncelik: *${searchedTicket.priority}*\n• Durum: **${searchedTicket.status}** (${searchedTicket.date})\n• Mesajınız: "${searchedTicket.message}"\n\n${isSolved ? `🛡️ **Yönetici Yanıtı:**\n"${replyText}"` : '⏳ Talebiniz şu anda yöneticilerimiz tarafından incelenmektedir.'}\n\n👉 Detaylı takip için [Destek Taleplerim (tickets.html)](tickets.html) sayfasını ziyaret edebilirsiniz.`;
                } else if (userTickets.length > 0) {
                    let ticketSummaryList = userTickets.slice(0, 3).map(t => {
                        const isSolved = t.status === 'Çözüldü';
                        const statusBadge = isSolved ? '✓ Çözüldü' : '⏳ İncelemede';
                        return `• **#${t.id}** - ${t.subject} (${statusBadge})`;
                    }).join('\n');

                    akilliCevap = `🎫 **Sisteme Kayıtlı Destek Talepleriniz (${userTickets.length} Adet):**\n\n${ticketSummaryList}\n\n${userTickets.length > 3 ? '*...ve diğer talepleriniz*\n\n' : ''}👉 Tüm taleplerinizi görüntülemek, durumlarını sorgulamak ve yönetici yanıtlarını incelemek için **[Destek Taleplerim (tickets.html)](tickets.html)** sayfasını açabilirsiniz!`;
                } else {
                    akilliCevap = "💬 **Destek Talebi Bulunamadı:**\nHenüz oluşturulmuş bir destek talebiniz bulunmuyor. Bir sorunuz veya probleminiz varsa **[İletişim & Destek Formu](iletisim.html)** üzerinden hızlıca talep gönderebilirsiniz!";
                }
            }
        }

        try {
            const cevap = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: kullaniciMesaji, toolsContext: butunAraclar })
            }).catch(() => null);

            let botCevabi = akilliCevap;
            if (cevap && cevap.ok) {
                const gelenVeri = await cevap.json();
                botCevabi = gelenVeri.response || akilliCevap;
            }

            if (!botCevabi) {
                botCevabi = "Size nasıl yardımcı olabilirim? Geliştirici başvuruları, araç ekleme, Premium key aktifleştirme veya yapay zeka araçları hakkında dilediğinizi sorabilirsiniz!";
            }

            const yukleniyorDivi = document.getElementById(yukleniyorId);
            if(yukleniyorDivi) yukleniyorDivi.remove();
            
            mesajlarEkrani.innerHTML += `<div style="background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 15px 15px 15px 0; color: #e2e8f0; font-size: 0.9rem; max-width: 85%; white-space: pre-wrap;">${botCevabi}</div>`;
            
        } catch (hata) {
            const yukleniyorDivi = document.getElementById(yukleniyorId);
            if(yukleniyorDivi) yukleniyorDivi.remove();
            
            const fallbackMsg = akilliCevap || "Size nasıl yardımcı olabilirim? Geliştirici başvuruları, araç ekleme veya yapay zeka araçları hakkında sorular sorabilirsiniz!";
            mesajlarEkrani.innerHTML += `<div style="background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 15px 15px 15px 0; color: #e2e8f0; font-size: 0.9rem; max-width: 85%; white-space: pre-wrap;">${fallbackMsg}</div>`;
        }
        mesajlarEkrani.scrollTop = mesajlarEkrani.scrollHeight;
    }

    if(gonderButonu) {
        gonderButonu.addEventListener('click', mesajGonder);
    }

    if(mesajKutusu) {
        mesajKutusu.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') mesajGonder();
        });
    }
});

// GELİŞTİRİCİ BAŞVURU VE ARAÇ EKLEME MODAL FONKSİYONLARI
function openDevRequestModal() {
    const modal = document.getElementById('dev-request-modal');
    if(modal) modal.style.display = 'flex';
}
function closeDevRequestModal() {
    const modal = document.getElementById('dev-request-modal');
    if(modal) modal.style.display = 'none';
}
function submitDevRequest() {
    const emailInput = document.getElementById('dev-email');
    const email = emailInput ? emailInput.value.trim() : '';
    if(!email) { showToast("Lütfen geçerli bir e-posta adresi giriniz.", "warning"); return; }

    const user = JSON.parse(localStorage.getItem('user')) || { username: 'Anonim' };
    const devRequest = {
        id: Date.now().toString(),
        userId: user.id || Date.now().toString(),
        username: user.username || 'Kullanıcı',
        email: email,
        date: new Date().toLocaleDateString('tr-TR')
    };

    fetch('/api/dev-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(devRequest)
    }).catch(() => null);

    const pendingDevs = JSON.parse(localStorage.getItem('pendingDevs') || '[]');
    pendingDevs.push(devRequest);
    localStorage.setItem('pendingDevs', JSON.stringify(pendingDevs));

    showToast("Geliştirici başvurunuz yöneticiye iletildi! İnceleme sonrasında bilgilendirileceksiniz.", "success", "Başvuru Gönderildi");
    closeDevRequestModal();
    if(emailInput) emailInput.value = '';
}

function openSubmitToolModal() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        showToast("Araç ekleyebilmek için lütfen önce giriş yapınız.", "info");
        modalAc();
        return;
    }
    if (!user.isDev) {
        showToast("Yalnızca onaylı Geliştiriciler yeni araç ekleyebilir. Lütfen önce başvuru yapınız.", "warning", "Geliştirici Hesabı Gerekli");
        openDevRequestModal();
        return;
    }
    const modal = document.getElementById('submit-tool-modal');
    if(modal) modal.style.display = 'flex';
}
function closeSubmitToolModal() {
    const modal = document.getElementById('submit-tool-modal');
    if(modal) modal.style.display = 'none';
}
function submitNewTool() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.isDev) {
        showToast("Yalnızca onaylı Geliştiriciler yeni araç ekleyebilir.", "warning", "Yetki Kısıtlaması");
        closeSubmitToolModal();
        openDevRequestModal();
        return;
    }

    const name = document.getElementById('st-name').value.trim();
    const cat = document.getElementById('st-category').value;
    const url = document.getElementById('st-url').value.trim();
    const desc = document.getElementById('st-desc').value.trim();

    if(!name || !url || !desc) { showToast("Lütfen tüm zorunlu alanları doldurunuz.", "warning"); return; }

    const newTool = {
        id: Date.now().toString(),
        name: name,
        category: cat,
        url: url,
        description: desc,
        submittedBy: user.username,
        date: new Date().toLocaleDateString('tr-TR')
    };

    fetch('/api/pending-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTool)
    }).catch(() => null);

    const pendingTools = JSON.parse(localStorage.getItem('pendingTools') || '[]');
    pendingTools.push(newTool);
    localStorage.setItem('pendingTools', JSON.stringify(pendingTools));

    showToast("Araç öneriniz başarıyla yöneticiye gönderildi!", "success", "Öneri Gönderildi");
    closeSubmitToolModal();
    document.getElementById('st-name').value = '';
    document.getElementById('st-url').value = '';
    document.getElementById('st-desc').value = '';
}

// PREMİUM OLMAYAN KULLANICILAR İÇİN PERİYODİK PROMOSYON POP-UP KONTROLÜ
function checkPeriodicPremiumPromo() {
    let curUser = null;
    try { curUser = JSON.parse(localStorage.getItem('user')); } catch(e) {}

    // Eğer kullanıcı Premium ise pop-up çıkarma!
    if (curUser && curUser.isPremium && !curUser.cancelledPremium) return;

    // Oturumda 3 dakikada bir kontrol et
    const lastShown = sessionStorage.getItem('premiumPromoShownAt');
    const now = Date.now();
    if (!lastShown || (now - parseInt(lastShown)) > 180000) {
        const modal = document.getElementById('premium-promo-modal');
        if (modal) modal.style.display = 'flex';
        sessionStorage.setItem('premiumPromoShownAt', now.toString());
    }
}

function closePremiumPromoModal() {
    const modal = document.getElementById('premium-promo-modal');
    if (modal) modal.style.display = 'none';
}

setTimeout(checkPeriodicPremiumPromo, 4000);
setInterval(checkPeriodicPremiumPromo, 60000);

/* ============================================================================
   CANLI DESTEK SİSTEMİ (KULLANICI TARAFI)
   ============================================================================ */
let activeLiveSupportReq = null;
let liveSupportPollTimer = null;

async function requestLiveSupport() {
    const user = JSON.parse(localStorage.getItem('user')) || { username: 'Misafir Kullanıcı' };

    // Önce sunucuda bu kullanıcının aktif talebi var mı diye bak
    try {
        const checkRes = await fetch('/api/live-support/requests');
        if (checkRes.ok) {
            const allReqs = await checkRes.json();
            const existing = allReqs.find(r => r.username === user.username && (r.status === 'waiting' || r.status === 'accepted'));
            if (existing) {
                activeLiveSupportReq = existing;
                setupLiveChatUserUI();
                showToast("Zaten aktif bir canlı destek talebiniz var. Onay bekleniyor...", "info", "Canlı Destek");
                if (liveSupportPollTimer) clearInterval(liveSupportPollTimer);
                liveSupportPollTimer = setInterval(pollUserLiveSupport, 2000);
                return;
            }
        }
    } catch(e) {}

    // Sunucuda talep oluştur
    try {
        const res = await fetch('/api/live-support/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: user.username,
                email: user.email || '-',
                initialMessage: 'Kullanıcı canlı destek talep etti.'
            })
        });
        
        if (res.ok) {
            const data = await res.json();
            activeLiveSupportReq = data.request;
        } else {
            // Server erişilemez, yerel yedek
            activeLiveSupportReq = {
                id: 'LIVE-' + Date.now(),
                username: user.username,
                email: user.email || '-',
                status: 'waiting',
                date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                messages: []
            };
        }
    } catch(e) {
        activeLiveSupportReq = {
            id: 'LIVE-' + Date.now(),
            username: user.username,
            email: user.email || '-',
            status: 'waiting',
            date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            messages: []
        };
    }

    setupLiveChatUserUI();
    showToast("Canlı destek talebiniz yöneticiye iletildi. Onay bekleniyor...", "info", "Canlı Destek");

    if (liveSupportPollTimer) clearInterval(liveSupportPollTimer);
    liveSupportPollTimer = setInterval(pollUserLiveSupport, 2000);
}

function setupLiveChatUserUI() {
    const titleEl = document.getElementById('advisor-title');
    const optionsEl = document.getElementById('advisor-options');
    const bannerEl = document.getElementById('advisor-live-banner');
    const endBtn = document.getElementById('advisor-live-end-btn');
    const windowEl = document.getElementById('advisor-window');
    
    if (windowEl) windowEl.style.display = 'flex';
    if (optionsEl) optionsEl.style.display = 'none';
    if (bannerEl) bannerEl.style.display = 'none';
    if (endBtn) endBtn.style.display = 'inline-block';

    if (activeLiveSupportReq.status === 'waiting') {
        if (titleEl) titleEl.innerHTML = `⏳ Canlı Destek (Onay Bekleniyor...)`;
        renderUserLiveChatMessages([
            { sender: 'system', text: "⏳ Canlı destek talebiniz yöneticiye iletildi. Müşteri Temsilcisi (Admin) onayladığında sohbet burada başlayacaktır." }
        ]);
    } else if (activeLiveSupportReq.status === 'accepted') {
        if (titleEl) titleEl.innerHTML = `🟢 Canlı Destek (Admin Bağlandı)`;
        renderUserLiveChatMessages(activeLiveSupportReq.messages || []);
    }
}

async function pollUserLiveSupport() {
    if (!activeLiveSupportReq) return;

    let requests = JSON.parse(localStorage.getItem('liveSupportRequests') || '[]');
    let reqFromApi = null;
    
    try {
        const res = await fetch('/api/live-support/requests').catch(() => null);
        if (res && res.ok) {
            const apiReqs = await res.json();
            reqFromApi = apiReqs.find(r => r.id === activeLiveSupportReq.id);
        }
    } catch(e) {}

    const req = reqFromApi || requests.find(r => r.id === activeLiveSupportReq.id);
    if (!req) return;

    const prevStatus = activeLiveSupportReq.status;
    const prevMsgCount = (activeLiveSupportReq.messages || []).length;
    activeLiveSupportReq = req;

    const titleEl = document.getElementById('advisor-title');

    if (req.status === 'accepted') {
        if (prevStatus === 'waiting') {
            if (titleEl) titleEl.innerHTML = `🟢 Canlı Destek (Admin Bağlandı)`;
            showToast("Admin canlı desteğe bağlandı! Konuşmaya başlayabilirsiniz.", "success", "Canlı Destek");
        }
        
        const newMsgCount = (req.messages || []).length;
        if (newMsgCount !== prevMsgCount || prevStatus === 'waiting') {
            renderUserLiveChatMessages(req.messages || []);
        }
    } else if (req.status === 'rejected') {
        clearInterval(liveSupportPollTimer);
        const username = req.username || (JSON.parse(localStorage.getItem('user')) || {}).username || 'Kullanıcı';
        addNotification(
            username,
            '🙏',
            'Canlı Destek İptal Edildi - Özür Dileriz',
            'Yoğunluk nedeniyle canlı destek talebiniz şu anda karşılanamadı.',
            'Sayın kullanıcımız, temsilcilerimizin anlık yoğunluğu sebebiyle canlı destek talebiniz şu anda iptal edilmiştir. Yaşanan aksaklık ve gecikme nedeniyle özür dileriz. Sorularınız için İletişim sayfasındaki formu kullanabilir veya Gelen Kutunuz üzerinden bizlere ulaşabilirsiniz.'
        );
        showToast("Canlı destek talebiniz kabul edilemedi. Özür mesajı Gelen Kutunuza iletildi.", "warning", "Canlı Destek");
        showLiveSupportRejectedModal();
        endUserLiveSupport();
    } else if (req.status === 'ended') {
        clearInterval(liveSupportPollTimer);
        showToast("Canlı destek sohbeti sonlandırıldı.", "info", "Canlı Destek");
        endUserLiveSupport();
    }
}

function showLiveSupportRejectedModal() {
    let existingModal = document.getElementById('live-support-rejected-modal');
    if (!existingModal) {
        existingModal = document.createElement('div');
        existingModal.id = 'live-support-rejected-modal';
        existingModal.className = 'modal-overlay';
        existingModal.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 99999; padding: 20px; background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(12px); align-items: center; justify-content: center;';
        existingModal.innerHTML = `
            <div style="width: 100%; max-width: 500px; background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid rgba(239, 68, 68, 0.5); box-shadow: 0 0 50px rgba(239, 68, 68, 0.25); text-align: center; border-radius: 24px; padding: 35px 25px; color: #fff;">
                <div style="font-size: 3.8rem; margin-bottom: 12px; filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.5));">🙏</div>
                <h3 style="color: #f87171; font-size: 1.5rem; font-weight: 800; margin-bottom: 10px;">Canlı Destek Talebi İptal Edildi</h3>
                <p style="color: #cbd5e1; font-size: 0.92rem; margin-bottom: 22px; line-height: 1.6;">
                    Sayın kullanıcımız, temsilcilerimizin anlık yoğunluğu sebebiyle canlı destek talebiniz şu anda karşılanamamıştır. Yaşanan aksaklık ve gecikme nedeniyle özür dileriz.
                </p>
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 14px; padding: 14px; text-align: left; margin-bottom: 24px; color: #e2e8f0; font-size: 0.85rem;">
                    💡 <strong>Ne Yapabilirsiniz?</strong><br>
                    • Sorularınızı ve taleplerinizi <strong>İletişim Formu</strong> üzerinden bizlere iletebilirsiniz.<br>
                    • Yöneticilerimizin cevabı Gelen Kutunuza (inbox.html) otomatik ulaştırılacaktır.
                </div>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <a href="inbox.html" style="background: linear-gradient(135deg, #38bdf8, #0284c7); color: #0f172a; text-decoration: none; padding: 12px 22px; border-radius: 12px; font-weight: 800; font-size: 0.9rem; display: inline-block;">📥 Gelen Kutuma Git</a>
                    <button onclick="document.getElementById('live-support-rejected-modal').style.display='none';" style="background: rgba(255,255,255,0.08); color: #94a3b8; border: 1px solid rgba(255,255,255,0.15); padding: 12px 20px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer;">Anladım</button>
                </div>
            </div>
        `;
        document.body.appendChild(existingModal);
    } else {
        existingModal.style.display = 'flex';
    }
}

function renderUserLiveChatMessages(messages) {
    const msgContainer = document.getElementById('advisor-messages');
    if (!msgContainer) return;

    msgContainer.innerHTML = messages.map(m => {
        if (m.sender === 'system') {
            return `<div style="background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 10px; color: #94a3b8; font-size: 0.8rem; text-align: center; margin: 5px 0;">${m.text}</div>`;
        } else if (m.sender === 'user') {
            return `<div style="background: rgba(56,189,248,0.2); border: 1px solid rgba(56,189,248,0.3); padding: 8px 12px; border-radius: 12px 12px 0 12px; color: #fff; font-size: 0.88rem; max-width: 85%; align-self: flex-end; margin-left: auto;">${m.text}</div>`;
        } else { // admin
            return `<div style="background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); padding: 8px 12px; border-radius: 12px 12px 12px 0; color: #e2e8f0; font-size: 0.88rem; max-width: 85%;">
                <div style="font-size: 0.72rem; color: #4ade80; font-weight: bold; margin-bottom: 3px;">🛡️ Temsilci (Admin) (${m.time || ''})</div>
                ${m.text}
            </div>`;
        }
    }).join('');

    msgContainer.scrollTop = msgContainer.scrollHeight;
}

async function sendUserLiveChatMessage(text) {
    if (!activeLiveSupportReq || activeLiveSupportReq.status !== 'accepted') return;

    const msgObj = {
        id: 'msg-' + Date.now(),
        sender: 'user',
        text: text,
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    if (!activeLiveSupportReq.messages) activeLiveSupportReq.messages = [];
    activeLiveSupportReq.messages.push(msgObj);

    let requests = JSON.parse(localStorage.getItem('liveSupportRequests') || '[]');
    let idx = requests.findIndex(r => r.id === activeLiveSupportReq.id);
    if (idx !== -1) {
        requests[idx] = activeLiveSupportReq;
        localStorage.setItem('liveSupportRequests', JSON.stringify(requests));
        window.dispatchEvent(new Event('storage'));
    }

    fetch('/api/live-support/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeLiveSupportReq.id, sender: 'user', text: text })
    }).catch(() => null);

    renderUserLiveChatMessages(activeLiveSupportReq.messages);
}

function endUserLiveSupport() {
    if (liveSupportPollTimer) clearInterval(liveSupportPollTimer);
    if (activeLiveSupportReq) {
        fetch('/api/live-support/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: activeLiveSupportReq.id })
        }).catch(() => null);

        let requests = JSON.parse(localStorage.getItem('liveSupportRequests') || '[]');
        let idx = requests.findIndex(r => r.id === activeLiveSupportReq.id);
        if (idx !== -1) {
            requests[idx].status = 'ended';
            localStorage.setItem('liveSupportRequests', JSON.stringify(requests));
        }
    }

    activeLiveSupportReq = null;

    const titleEl = document.getElementById('advisor-title');
    const optionsEl = document.getElementById('advisor-options');
    const bannerEl = document.getElementById('advisor-live-banner');
    const endBtn = document.getElementById('advisor-live-end-btn');
    const msgContainer = document.getElementById('advisor-messages');

    if (titleEl) titleEl.innerHTML = `✨ Nova Asistan`;
    if (optionsEl) optionsEl.style.display = 'flex';
    if (bannerEl) bannerEl.style.display = 'flex';
    if (endBtn) endBtn.style.display = 'none';

    if (msgContainer) {
        msgContainer.innerHTML = `
            <div id="advisor-live-banner" style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); padding: 8px 10px; border-radius: 10px; font-size: 0.76rem; color: #38bdf8; display: flex; align-items: center; justify-content: space-between;">
                <span>💬 İşinizi çözemediniz mi?</span>
                <button onclick="requestLiveSupport()" style="background: #38bdf8; color: #0f172a; border: none; border-radius: 6px; padding: 3px 8px; font-weight: 800; font-size: 0.72rem; cursor: pointer;">Canlı Desteğe Geç</button>
            </div>
            <div id="advisor-intro" style="background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 15px 15px 15px 0; color: #e2e8f0; font-size: 0.9rem; max-width: 85%;">
                Selam! Ne tarz bir yapay zeka arıyorsunuz? Size yardımcı olabilirim.
            </div>
            <div id="advisor-options" style="display: flex; flex-direction: column; gap: 8px; margin-top: 5px;">
                <button class="advisor-option-btn" data-ask="Metin">📝 Metin Yazmak İstiyorum</button>
                <button class="advisor-option-btn" data-ask="Görsel">🎨 Görsel Çizmek İstiyorum</button>
                <button class="advisor-option-btn" data-ask="Kod">💻 Kod Yazmak İstiyorum</button>
                <button class="advisor-option-btn" data-ask="Ses/Video">🎬 Ses/Video Üretmek İstiyorum</button>
                <button class="advisor-option-btn" onclick="requestLiveSupport()" style="background: rgba(56,189,248,0.12); border-color: rgba(56,189,248,0.4); color: #38bdf8; font-weight:700;">🎧 Canlı Desteğe Bağlan</button>
            </div>
        `;
    }
}