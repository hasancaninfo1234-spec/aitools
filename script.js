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
    canvasAnimasyonunuBaslat(); // Arka plan animasyonu
    kullaniciDurumunuKontrolEt(); // Giriş yapmış mı?
    modelleriGetir(); // Veritabanından araçları çek
    filtreleriAyarla(); // Arama ve buton filtreleri
    
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
    
    const girisButonu = document.querySelector('.auth-btn');
    if(girisButonu) girisButonu.onclick = modalAc;

    document.getElementById('toggle-auth').onclick = (e) => {
        e.preventDefault();
        girisModuMu = !girisModuMu;
        document.getElementById('modal-title').innerText = girisModuMu ? "Giriş Yap" : "Kayıt Ol";
        document.getElementById('toggle-auth').innerText = girisModuMu ? "Kayıt Ol" : "Giriş Yap";
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

// FİLTRELEME İŞLEMLERİ
function filtreleriAyarla() {
    const aramaKutusu = document.getElementById('search-input');
    const filtreButonlari = document.querySelectorAll('.filter-btn');
    const fiyatFiltresi = document.getElementById('pricing-filter');

    const filtreleriGuncelle = () => {
        const aktifKategori = document.querySelector('.filter-btn.active').dataset.category;
        const fiyat = fiyatFiltresi ? fiyatFiltresi.value : "Tümü";
        aracFiltrleVeEkranaBas(aramaKutusu.value, aktifKategori, fiyat);
    };

    if(aramaKutusu) aramaKutusu.addEventListener('input', filtreleriGuncelle);
    if(fiyatFiltresi) fiyatFiltresi.addEventListener('change', filtreleriGuncelle);

    filtreButonlari.forEach(btn => {
        btn.addEventListener('click', () => {
            filtreButonlari.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtreleriGuncelle();
        });
    });
}

function aracFiltrleVeEkranaBas(arananKelime, kategori, fiyat = "Tümü") {
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
    
    ekranaAraclariBas(filtrelenmisListe);
}

function ekranaAraclariBas(araclarListe) {
    const kutu = document.getElementById('tools-container');
    if(araclarListe.length === 0) {
        kutu.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #94a3b8;">Hocam aradığınız kriterlere uygun araç bulamadık...</p>`;
        return;
    }
    kutu.innerHTML = araclarListe.map(arac => `
        <div class="card">
            <div>
                <span style="color:#38bdf8; font-size:0.7rem; font-weight:800; text-transform:uppercase;">${arac.category}</span>
                <h3 style="margin:10px 0; font-size:1.4rem;">${arac.name}</h3>
                <p style="color:#94a3b8; font-size:0.9rem; line-height:1.5;">${arac.description}</p>
            </div>
            <a href="details.html?id=${arac.id}" class="details-link">DETAYLARI GÖR</a>
        </div>
    `).join('');
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
            ekranaAraclariBas(butunAraclar);
            populerAraclariBas(butunAraclar);
        } else {
            console.error("Hocam veriler hiçbir kaynaktan çekilemedi.");
        }
    } catch (hata) { 
        console.error("Hocam api çöktü galiba, modeller yüklenemedi:", hata); 
    }
}

function populerAraclariBas(araclar) {
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
        populerKutu.innerHTML = enIyiAraclar.map(arac => {
            let yildizHtml = "";
            if (arac.reviews && arac.reviews.length > 0) {
                const ortalama = arac.reviews.reduce((t, r) => t + r.rating, 0) / arac.reviews.length;
                yildizHtml = `<div style="color: #fbbf24; font-size: 0.8rem; margin-top: 5px;">⭐ ${ortalama.toFixed(1)} (${arac.reviews.length} Yorum)</div>`;
            }

            return `
            <div class="card popular-card" style="position: relative; overflow: hidden;">
                <div style="position: absolute; top: -15px; right: -25px; background: #f59e0b; color: #000; font-weight: bold; padding: 20px 30px 5px 30px; transform: rotate(45deg); font-size: 0.7rem; z-index: 10;">POPÜLER</div>
                <div>
                    <span style="color:#f59e0b; font-size:0.7rem; font-weight:800; text-transform:uppercase;">${arac.category || 'AI'}</span>
                    <h3 style="margin:10px 0; font-size:1.4rem;">${arac.name}</h3>
                    <p style="color:#cbd5e1; font-size:0.9rem; line-height:1.5;">${arac.description ? arac.description.substring(0, 80) + '...' : ''}</p>
                    ${yildizHtml}
                </div>
                <a href="details.html?id=${arac.id}" class="details-link" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); margin-top: 15px;">DETAYLARI GÖR</a>
            </div>
        `}).join('');
    } else {
        populerBolum.style.display = 'none';
    }
}

// GİRİŞ / ÇIKIŞ / PREMİUM İŞLEMLERİ
async function girisYapVeyaKayitOl() {
    const kAdi = document.getElementById('auth-username').value;
    const sifre = document.getElementById('auth-password').value;
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
        alert("Sunucuya bağlanılamadı. Node.js çalışıyor mu kontrol et kanka."); 
        console.error(hata);
    }
}

async function kullaniciDurumunuKontrolEt() {
    const kullaniciArayuzu = document.getElementById('auth-ui');
    if (!aktifKullanici) {
        kullaniciArayuzu.innerHTML = `<button class="auth-btn" onclick="modalAc()">🔑 Giriş Yap</button>`;
        return;
    }
    
    try {
        const cevap = await fetch(`${API_BASE}/api/verify-premium/${aktifKullanici.id}`);
        const premiumVerisi = await cevap.json();
        
        if (premiumVerisi.status === "premium") {
            kullaniciArayuzu.innerHTML = `<div style="display:flex; align-items:center; gap:15px;"><span class="premium-status-badge">👑 PREMIUM ÜYE</span><span style="color:#fff">Selam, <b>${aktifKullanici.username}</b></span><button onclick="cikisYap()" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:0.8rem;">Çıkış</button></div>`;
        } else {
            kullaniciArayuzu.innerHTML = `<div class="auth-container"><div style="color:#fff; font-size:0.9rem;">Hoş geldin, <b>${aktifKullanici.username}</b> | <span onclick="cikisYap()" style="color:#ef4444; cursor:pointer;">Çıkış</span></div><div class="key-activation-box"><input type="text" id="premium-key" class="key-input" placeholder="Key Kodunu Gir..."><button onclick="keyAktifEt()" class="key-btn">AKTİF ET</button></div></div>`;
        }
    } catch(e) {
        console.error("Premium kontrolünde hata:", e);
    }
}

async function keyAktifEt() {
    const girilenKey = document.getElementById('premium-key').value;
    try {
        const cevap = await fetch(`${API_BASE}/api/activate-key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: girilenKey, userId: aktifKullanici.id })
        });
        const sonuc = await cevap.json();
        if(sonuc.success) { 
            alert("Helal, Premium aktif oldu!"); 
            kullaniciDurumunuKontrolEt(); 
        } else {
            alert(sonuc.message);
        }
    } catch (e) {
        console.error(e);
        alert("Bağlantı hatası");
    }
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

    // Bota mesaj gönderme fonksiyonu
    async function mesajGonder() {
        if(!mesajKutusu) return;
        const kullaniciMesaji = mesajKutusu.value.trim();
        if(!kullaniciMesaji) {
            console.log("Boş mesaj gönderilmez aga");
            return;
        }

        // Kullanıcının mesajını ekrana basıyoruz
        mesajlarEkrani.innerHTML += `<div style="background: rgba(56,189,248,0.1); padding: 10px 15px; border-radius: 15px 15px 0 15px; color: #fff; font-size: 0.9rem; max-width: 85%; align-self: flex-end; margin-left: auto;">${kullaniciMesaji}</div>`;
        mesajKutusu.value = '';
        mesajlarEkrani.scrollTop = mesajlarEkrani.scrollHeight;

        const yukleniyorId = 'yukleniyor-' + Date.now();
        mesajlarEkrani.innerHTML += `<div id="${yukleniyorId}" style="background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 15px 15px 15px 0; color: #94a3b8; font-size: 0.9rem; max-width: 85%;">Nova Düşünüyor...</div>`;
        mesajlarEkrani.scrollTop = mesajlarEkrani.scrollHeight;

        try {
            // Sunucuya soruyu yolluyoruz
            const cevap = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: kullaniciMesaji, toolsContext: butunAraclar })
            });
            const gelenVeri = await cevap.json();
            
            const yukleniyorDivi = document.getElementById(yukleniyorId);
            if(yukleniyorDivi) yukleniyorDivi.remove(); // Loading yazısını sil
            
            let botCevabi = gelenVeri.response || "Hocam API yanıt vermedi, anlamadım dedi.";
            
            // Botun cevabını ekrana basıyoruz
            mesajlarEkrani.innerHTML += `<div style="background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 15px 15px 15px 0; color: #e2e8f0; font-size: 0.9rem; max-width: 85%;">${botCevabi}</div>`;
            
        } catch (hata) {
            const yukleniyorDivi = document.getElementById(yukleniyorId);
            if(yukleniyorDivi) yukleniyorDivi.remove();
            mesajlarEkrani.innerHTML += `<div style="color: #ef4444; font-size: 0.9rem;">Sunucuya ulaşılamıyor, interneti kontrol et kanka!</div>`;
            console.error("Chat hatası:", hata);
        }
        mesajlarEkrani.scrollTop = mesajlarEkrani.scrollHeight; // Scrollu en alta indir
    }

    if(gonderButonu) {
        gonderButonu.addEventListener('click', mesajGonder);
    }

    if(mesajKutusu) {
        mesajKutusu.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') mesajGonder(); // Entera basınca da göndersin diye
        });
    }
});