/* Bu dosya, yapay zeka ile metin oluşturma işlevini sağlama işini yapar. */
const fs = require('fs');

const toolsPath = './tools.json';
console.log("Veritabanı okunuyor...");
let tools = [];
try {
    tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
} catch(e) {
    console.error("Hata: tools.json bulunamadı.");
    process.exit(1);
}

// En popüler araçlar için özel, "özenle" hazırlanmış ansiklopedik açıklamalar
const popularTools = {
    "midjourney": {
        desc: "Midjourney, hayal gücünüzü sadece birkaç kelime yazarak etkileyici görsel şaheserlere dönüştüren dünyanın en popüler yapay zeka resim üretim platformudur.\n\n✨ Öne Çıkan Özellikler:\n• Discord altyapısını kullanarak pratik ve erişilebilir bir deneyim sunar.\n• Karmaşık sanat stillerini mükemmel şekilde yansıtır.\n• Fotogerçekçi fotoğrafları eşi benzeri görülmemiş bir kalitede üretir.",
        specs: ["Yüksek Çözünürlüklü V4/V5 Render", "Kompleks Sanat Stilleri Algılama", "Hızlı Üretim Modu (Fast GPU)", "Gelişmiş İstem (Prompt) Mühendisliği"]
    },
    "github copilot": {
        desc: "GitHub Copilot, yazılımcılar için kodlama sürecini hızlandıran devrimsel bir programlama asistanıdır.\n\n🚀 Öne Çıkan Özellikler:\n• Milyarlarca satırlık açık kaynak koddan beslenerek anlık öneriler sunar.\n• Sadece yorum satırı yazarak karmaşık fonksiyonları saniyeler içinde tamamlar.\n• Yazdığınız koda ve bağlama otomatik olarak adapte olur.",
        specs: ["Çoklu Programlama Dili Desteği", "Derin IDE Entegrasyonu (VS Code, VS)", "Anında Otomatik Kod Tamamlama", "Kod Standartlarına ve Mantığa Uyum"]
    },
    // Diğer özel eklenebilecek popüler araçlar varsa buraya girilebilir.
};

// Diğer kalan araçlar için içerik üretecek akıllı kütüphane sözlüğü
const adjectives = [
    "yenilikçi", "güçlü", "pratik kullanımlı", "en yeni nesil", "otomatikleştirilmiş", 
    "yüksek doğruluklu", "kullanıcı dostu", "verimli çalışan", "hızlı sonuç veren", 
    "modern yapılı", "çok yönlü kullanıma sahip", "profesyonel standartlarda"
];

const actions = {
    "images": [
        "görsel içeriklerinizi sıradanlıktan kurtarıp bambaşka bir boyuta taşımanızı", 
        "ilham verici fikirlerinizi pürüzsüz grafikler olarak dijital ortama aktarmanızı", 
        "tasarım süreçlerinizdeki bekleme ve deneme yanılma süresini ciddi oranda hızlandırmanızı"
    ],
    "text": [
        "içerik üretim süreçlerinizi sadece saniyeler içerisinde kusursuz bir şekilde tamamlamanızı", 
        "okuyucunun dikkatini çeken, kreatif ve orijinal makaleler ortaya çıkarmanızı", 
        "uzun taslaklar yazmak yerine taslak halinde fikirlerinizi profesyonel paragraflara dönüştürmenizi"
    ],
    "kod": [
        "yazılım geliştirme sürecinizi optimize ederek zorlukları aşmanızı", 
        "arka planda oluşabilecek mantık hatalarını kodlar üzerinden tespit ederek hatasız projeler yazmanızı", 
        "kodlama asistanlığı yaparak dev teknoloji staklarında verimi maksimum seviyeye çıkarmanızı"
    ],
    "video": [
        "gelişmiş piksellerle profesyonel videolar ve akıcı animasyonlar kurgulamanızı", 
        "klasik yöntemlerle saatler sürecek olan sahne kurgusu ve video üretim sürecini otomatikleştirmenizi", 
        "görsel efekt ve kurgu süreçlerinde iş yükünü azaltarak saf yaratıcılığa odaklanarak vakit kazanmanızı"
    ],
    "genel": [
        "mevcut iş akışınızı yapay zeka gücüyle harmanlayıp performansınızı maksimize etmenizi", 
        "günlük veya iş bazlı rutin dijital işlemlerinize benzersiz bir kolaylık katmanızı", 
        "insan gücüyle saatler süren manuel hesaplamaları veya işleri anında otomatikleştirmenizi"
    ]
};

const specTemplates = {
    "images": ["Dinamik Piksel İşleme", "Renk ve Çevre Optimizasyonu", "Detaylı Render Mimarisi", "Hızlı Çıktı Motoru"],
    "text": ["Gelişmiş Doğal Dil İşleme (NLP)", "Dil Bilgisi ve Mantık Analizi", "Bağlamsal Doğruluk Tespiti", "Yüksek Çözünürlüklü SEO Uyumu"],
    "kod": ["Bağlam Odaklı Kod Tamamlama", "Otonom Hata Ayıklama (Debugging)", "Farklı Dillerle Tam Uyumluluk", "Özelleştirilebilir Altyapı"],
    "video": ["Yüksek FPS Kayıpsız Dışa Aktarım", "Yapay Zeka Destekli Sahne Kesimi", "Hızlı Bulut Render İşlemi", "Dinamik Efekt ve Ses Filtresi Galerisi"],
    "genel": ["Bulut Tabanlı Çalışma Alanı", "Yüksek API Güvenlik Standartları", "Çoklu Platform (Cihaz) Desteği", "Öğrenen Akıllı Algoritma Mimarisi"]
};

// Rastgele Kelime Seçici
function getRandomWords(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Kategoriye Göre Özellik (Specs) Üreticisi
function generateSpecs(categoryName) {
    const defaultSpecs = specTemplates["genel"];
    let catSpecs = specTemplates[categoryName] || defaultSpecs;
    return getRandomWords(catSpecs, 3).concat(["Yapay Zeka (AI) Çekirdeği Desteği"]);
}

let updateCount = 0;
console.log("Açıklamalar sıfırdan yazılıyor...");

tools.forEach(tool => {
    let tName = tool.name.toLowerCase().trim();
    
    // Zaten favori bir araçsa elle yazdığımızı ata
    if (popularTools[tName]) {
        tool.longDescription = popularTools[tName].desc;
        tool.specs = popularTools[tName].specs;
        updateCount++;
    } else {
        // Bilinmeyen / Diğer tüm araçlar için sentezleyici
        const lowerCat = tool.category ? tool.category.toLowerCase().trim() : "genel";
        let actionCatKey = "genel";
        
        if (lowerCat.includes("image") || lowerCat.includes("görsel") || lowerCat.includes("art")) actionCatKey = "images";
        else if (lowerCat.includes("text") || lowerCat.includes("yazı") || lowerCat.includes("metin") || lowerCat.includes("knowledge")) actionCatKey = "text";
        else if (lowerCat.includes("kod") || lowerCat.includes("code") || lowerCat.includes("developer") || lowerCat.includes("it")) actionCatKey = "kod";
        else if (lowerCat.includes("video") || lowerCat.includes("film") || lowerCat.includes("audio") || lowerCat.includes("ses")) actionCatKey = "video";

        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const action = actions[actionCatKey][Math.floor(Math.random() * actions[actionCatKey].length)];

        // "isim, kategori alanında özel olarak geliştirilmiş -sıfat- bir araçtır. Bu sistem, -eylem- sağlar."
        const actionCapitalized = action.charAt(0).toUpperCase() + action.slice(1);
        
        let newDesc = `${tool.name}, "${tool.category}" sektöründeki spesifik ihtiyaçları çözmek adına özel olarak tasarlanmış ${adj} bir yapay zeka aracıdır.\n\n🎯 Öne Çıkan Özellikler:\n• ${actionCapitalized} sağlar.\n• Dijital iş akışınızı büyük oranda rahatlatarak size zamandan tasarruf ettirir.\n• Sahip olduğu yapay zeka mimarisi sayesinde verimliliğinizi maksimum seviyeye çıkarır.\n\nHem sektöre yeni giriş yapanlar hem de deneyimli profesyoneller için oldukça ideal, uzun ömürlü ve sağlam bir yapıya sahiptir.`;
        
        tool.longDescription = newDesc;
        tool.specs = generateSpecs(actionCatKey);
        updateCount++;
    }
});

fs.writeFileSync(toolsPath, JSON.stringify(tools, null, 2), 'utf8');
console.log(`\nBAŞARILI! Toplam ${updateCount} adet yapay zeka aracına özgün detay açıklaması ve özellikler başarıyla yazıldı.`);
