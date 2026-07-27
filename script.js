/*
 * ============================================================================
 * Proje Adı: AI Tools (Yapay Zeka Evreni)
 * Dosya: script.js
 * Hazırlayan: Bilgisayar Programcılığı Öğrencisi
 * Açıklama: Bu kodlar sitenin ön yüzündeki dinamik işlemleri yapar.
 * Not: Hocam canvas animasyonunu internetten bakarak uyarladım, çok güzel oldu :)
 * ============================================================================
 */

const API_BASE = "";

let aktifKullanici = JSON.parse(localStorage.getItem('user')) || null; // Kullanıcı giriş yapmış mı diye bakıyoruz
let girisModuMu = true; // true ise giriş yap, false ise kayıt ol
let butunAraclar = []; // Apiden gelen verileri burada tutucaz

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

    // GELİŞTİRİCİ MODU & ARAÇ EKLEME BUTONLARI
    const devContainer = document.getElementById('dev-action-container');
    if (devContainer) {
        devContainer.innerHTML = `
            <button class="auth-btn" style="background: rgba(139, 92, 246, 0.12); border-color: rgba(139, 92, 246, 0.3); color: #c084fc; padding: 6px 12px; font-size: 0.82rem;" onclick="openDevRequestModal()">💻 Geliştirici Ol</button>
            <button class="auth-btn" style="background: rgba(34, 197, 94, 0.12); border-color: rgba(34, 197, 94, 0.3); color: #4ade80; padding: 6px 12px; font-size: 0.82rem; margin-left: 6px;" onclick="openSubmitToolModal()">➕ Araç Ekle</button>
        `;
    }

    // TEMA KONTROLÜ (Hocam burası karanlık/aydınlık tema için)
    const temaSecici = document.getElementById('theme-selector');
    if (temaSecici) {
        const kaydedilenTema = localStorage.getItem('siteTheme') || 'dark'; // Varsayılan dark
        document.body.setAttribute('data-theme', kaydedilenTema);
        temaSecici.value = kaydedilenTema;
        
        temaSecici.addEventListener('change', (e) => {
            const yeniTema = e.target.value;
            document.body.setAttribute('data-theme', yeniTema);
            localStorage.setItem('siteTheme', yeniTema);
            console.log("Tema değiştirildi kanka: " + yeniTema);
        });
    }
    
    const girisButonu = document.querySelector('#login-or-profile-btn');
    if(girisButonu) girisButonu.onclick = modalAc;

    document.getElementById('toggle-auth').onclick = (e) => {
        e.preventDefault();
        girisModuMu = !girisModuMu;
        document.getElementById('modal-title').innerText = girisModuMu ? "Giriş Yap" : "Kayıt Ol";
        document.getElementById('toggle-auth').innerText = girisModuMu ? "Hesabın yok mu? Kayıt Ol kanka" : "Zaten hesabın var mı? Giriş Yap";
        
        const passField = document.getElementById('auth-password');
        if(!girisModuMu) {
            passField.style.display = 'none';
        } else {
            passField.style.display = 'block';
        }
    };

    document.getElementById('auth-submit-btn').onclick = girisYapVeyaKayitOl;
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
        console.log("Veriler çekiliyor...");
        let cevap = await fetch(`${API_BASE}/api/tools`).catch(() => null);
        if (!cevap || !cevap.ok) {
            cevap = await fetch(`http://localhost:3000/api/tools`).catch(() => null);
        }
        if (!cevap || !cevap.ok) {
            cevap = await fetch(`tools.json`).catch(() => null);
        }
        if (cevap && cevap.ok) {
            butunAraclar = await cevap.json();
            console.log(butunAraclar.length + " tane araç geldi kanka.");
            uiEfektleriniBaslat(butunAraclar);
            ekranaAraclariBas(butunAraclar);
            populerAraclariBas(butunAraclar);
        } else {
            console.error("Hocam veriler hiçbir kaynaktan çekilemedi.");
        }
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
    const options = document.querySelectorAll('.advisor-option-btn');
    const msgContainer = document.getElementById('advisor-messages');
    
    options.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const kategori = e.target.dataset.ask;
            
            // Kullanıcı mesajı ekle
            msgContainer.innerHTML += `
                <div style="background: rgba(56, 189, 248, 0.2); padding: 10px 15px; border-radius: 15px 15px 0 15px; color: #fff; font-size: 0.9rem; max-width: 85%; align-self: flex-end; margin-top: 10px;">
                    ${e.target.innerText}
                </div>
            `;
            
            // Seçenekleri gizle
            document.getElementById('advisor-options').style.display = 'none';
            
            // Yazıyor efekti
            const yaziyorId = 'typing-' + Date.now();
            msgContainer.innerHTML += `
                <div id="${yaziyorId}" style="background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 15px 15px 15px 0; color: #94a3b8; font-size: 0.9rem; max-width: 85%; margin-top: 10px;">
                    Düşünüyor...
                </div>
            `;
            msgContainer.scrollTop = msgContainer.scrollHeight;

            // En iyi aracı bul
            setTimeout(() => {
                document.getElementById(yaziyorId).remove();
                
                // Sözlüğe göre filtrele
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
                if(uygunAraclar.length > 0) {
                    // Rastgele ama tutarlı olarak ilkini seçiyoruz, en iyisi olarak
                    const enIyi = uygunAraclar[0];
                    cevapMesaji = `Sana kesinlikle <b>${enIyi.name}</b> aracını öneririm! Çok yeteneklidir.<br><br>
                    <a href="details.html?id=${enIyi.id}" style="color: #38bdf8; text-decoration: none; font-weight: bold; background: rgba(56,189,248,0.1); padding: 5px 10px; border-radius: 5px; display: inline-block; margin-top: 5px;">Hemen İncele ↗</a>`;
                } else {
                    cevapMesaji = "Bu kategoride şu an veritabanımızda araç yok maalesef.";
                }

                msgContainer.innerHTML += `
                    <div style="background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 15px 15px 15px 0; color: #e2e8f0; font-size: 0.9rem; max-width: 85%; margin-top: 10px;">
                        ${cevapMesaji}
                    </div>
                `;
                msgContainer.scrollTop = msgContainer.scrollHeight;
            }, 1200);
        });
    });
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
    
    if(!kAdi) { alert("Lütfen kullanıcı adı girin."); return; }

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
            alert("Hata: " + gelenVeri.message);
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
            <button class="auth-btn" onclick="openInboxModal()" style="position: relative; background: rgba(192,132,252,0.1); border-color: rgba(192,132,252,0.4); color: #c084fc; display: inline-flex; align-items: center; gap: 5px;">
                🔔 Gelen Kutusu <span id="inbox-badge" style="background:#ef4444; color:#fff; font-size:0.7rem; font-weight:800; padding:1px 6px; border-radius:10px; display:none;">0</span>
            </button>
            <a href="profile.html" class="auth-btn" style="background: rgba(56,189,248,0.1); border-color: #38bdf8; color: #38bdf8; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">👤 Profilim</a>
            <button class="auth-btn" onclick="cikisYap()" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05); padding: 9px 13px;">Çıkış</button>
        </div>
    `;

    setTimeout(updateInboxBadge, 100);
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
    if(!email) { alert("Lütfen e-posta adresinizi girin."); return; }

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

    alert("Geliştirici başvurunuz başarıyla yöneticiye iletildi! Onaylandıktan sonra araç ekleyebilirsiniz.");
    closeDevRequestModal();
    if(emailInput) emailInput.value = '';
}

function openSubmitToolModal() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert("Araç ekleyebilmek için önce giriş yapmalısınız.");
        modalAc();
        return;
    }
    if (!user.isDev) {
        alert("⚠️ Yalnızca onaylı Geliştiriciler yeni araç ekleyebilir!\n\nLütfen önce '💻 Geliştirici Ol' butonuna tıklayarak başvuru yapın.");
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
        alert("⚠️ Yalnızca onaylı Geliştiriciler yeni araç ekleyebilir!");
        closeSubmitToolModal();
        openDevRequestModal();
        return;
    }

    const name = document.getElementById('st-name').value.trim();
    const cat = document.getElementById('st-category').value;
    const url = document.getElementById('st-url').value.trim();
    const desc = document.getElementById('st-desc').value.trim();

    if(!name || !url || !desc) { alert("Lütfen tüm zorunlu alanları doldurun."); return; }

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

    alert("Araç öneriniz başarıyla yöneticiye gönderildi! İnceleme sonrasında onaylanacaktır.");
    closeSubmitToolModal();
    document.getElementById('st-name').value = '';
    document.getElementById('st-url').value = '';
    document.getElementById('st-desc').value = '';
}