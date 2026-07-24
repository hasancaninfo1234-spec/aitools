/* Bu dosya, gelecekte eklenecek araçları otomatik çekme işini yapar. */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function scrapeFuturepedia() {
    console.log("==========================================");
    console.log("Futurepedia.io Detay Taraması Başladı...");
    console.log("Lütfen arcapitalize basıp terminali kapatmayın, işlem 5-6 dk sürecektir.");
    console.log("==========================================\n");
    
    const filePath = './tools.json';
    if (!fs.existsSync(filePath)) {
        console.error("Hata: tools.json bulunamadı!");
        return;
    }

    let tools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let successCount = 0;
    
    for (let i = 0; i < tools.length; i++) {
        const tool = tools[i];
        
        // Zaten uzun açıklama girilmişse veya kendi yazdığımız standartlar varsa pas geçme
        // Daha önce scraper ın sahte girdiği 50-60 karakterli verilerin yerine gerçeğini koyacağız.
        // O yüzden sadece "alanında kullanılan yapay zeka aracı" stringi olanları veya description'ı ile aynı olanları çekeceğiz.
        
        const slug = slugify(tool.name);
        if (!slug) continue;

        const url = `https://www.futurepedia.io/tool/${slug}`;
        
        try {
            process.stdout.write(`[${i + 1}/${tools.length}] ${tool.name} `);
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                timeout: 10000
            });
            
            const $ = cheerio.load(response.data);
            
            // Site içindeki 'meta description'
            let desc = $('meta[name="description"]').attr('content') || '';
            
            // Eğer yoksa açıklama textini html p etiketlerinden bul
            if (!desc || desc.length < 30) {
                $('p').each((idx, el) => {
                    const text = $(el).text().trim();
                    if (text.length > 50 && !desc) desc = text;
                });
            }
            
            if (desc && desc.length > 20) {
                // Sitenin kendi ismi yerine daha temiz bir açıklama yazalım
                desc = desc.replace(/Futurepedia/gi, "AI Tools");
                tool.longDescription = desc;
                
                // Teknik detayları bul - sayfanın listeleri (<ul li>) "Özellikleri" verir
                const features = [];
                $('ul > li').each((idx, el) => {
                    const text = $(el).text().trim();
                    if (text.length > 10 && text.length < 80 && features.length < 4) {
                        features.push("✓ " + text);
                    }
                });
                
                if (features.length > 0) {
                   tool.specs = features;
                }
                
                successCount++;
                console.log(`-> ✅ Bulundu!`);
            } else {
                console.log(`-> ⚠️ Boş safya.`);
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log(`-> ❌ Yok (404)`);
            } else {
                console.log(`-> ⚠️ Timeout / Hata`);
            }
        }
        
        // 5 işlemde bir dosyayı otomatik kaydet ki arkaplanda veri gelsin
        if (i % 5 === 0 || i === tools.length - 1) {
            fs.writeFileSync(filePath, JSON.stringify(tools, null, 2), 'utf8');
        }
        
        await delay(1500); 
    }
    
    fs.writeFileSync(filePath, JSON.stringify(tools, null, 2), 'utf8');
    console.log(`\n==========================================`);
    console.log(`Harika! Tarama sonlandı. ${successCount} adet aracın detayı tools.json'a başarıyla işlendi.`);
    console.log(`==========================================`);
}

scrapeFuturepedia();
