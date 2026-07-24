/* Bu dosya, web üzerinden yapay zeka araçlarını otomatik toplama işini yapar. */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrapeTools() {
    console.log("Veriler çekiliyor. Bu işlem birkaç saniye sürebilir...");

    try {
        const response = await axios.get('https://theresanaiforthat.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        });
        
        const $ = cheerio.load(response.data);
        const newTools = [];

        // Ana sayfadaki yapay zeka araçları genellikle data-name özelliğine sahip <li> vb. etiketlerde tutuluyor.
        $('[data-name]').each((index, element) => {
            const name = $(element).attr('data-name');
            const category = $(element).attr('data-task') || "Genel";
            const url = $(element).attr('data-url') || "";
            
            // Site içinden açıklamayı bulmaya çalışıyoruz. 
            // the element div text etc might contain descriptions. We will fallback if not found.
            let description = $(element).find('.tool_desc, .item_desc, .description').text().trim();
            
            if (!description || description.length < 5) {
               description = `${name} - ${category} alanında kullanılan yapay zeka aracı.`; 
            }

            if (name) {
                newTools.push({
                    id: String(Date.now() + index),
                    name: name,
                    category: category,
                    description: description,
                    specs: [category],
                    about: description,
                    url: url
                });
            }
        });

        console.log(`Siteden ${newTools.length} araç verisi alındı. Mevcut veritabanıyla (tools.json) birleştiriliyor...`);

        // tools.json verilerini oku
        let existingTools = [];
        const filePath = './tools.json';
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            if (data) {
                existingTools = JSON.parse(data);
            }
        }

        // Aynı aracın birden fazla kez eklenmesini önlemek için isimleri kaydet
        const existingNames = new Set(existingTools.map(t => String(t.name).toLowerCase()));
        
        let addedCount = 0;
        newTools.forEach(tool => {
            if (!existingNames.has(tool.name.toLowerCase())) {
                existingTools.push(tool);
                existingNames.add(tool.name.toLowerCase());
                addedCount++;
            }
        });

        // Yenilenmiş diziyi tekrar tools.json dosyasına yaz
        fs.writeFileSync(filePath, JSON.stringify(existingTools, null, 2), 'utf8');
        console.log(`Mükemmel! ${addedCount} yeni araç başarıyla tools.json veritabanına eklendi.`);
        console.log(`Artık araç listenizde toplam ${existingTools.length} yapay zeka aracı bulunuyor.`);

    } catch (error) {
        console.error("Bir hata oluştu veri çekilemedi. Siteye erişim engellenmiş olabilir:", error.message);
    }
}

scrapeTools();
