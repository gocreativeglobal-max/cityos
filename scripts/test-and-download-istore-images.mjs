import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const raw = JSON.parse(fs.readFileSync('scripts/istore-products-raw.json', 'utf8'));
  console.log(`Checking images for ${raw.length} products...`);

  const outputDir = path.resolve('public/images/products/istore');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;
  const imageMapping = {};

  for (let i = 0; i < raw.length; i++) {
    const p = raw[i];
    const imgSrc = p.images?.[0]?.src;
    if (!imgSrc) {
      console.log(`[${i + 1}/${raw.length}] ❌ Product #${p.id} (${p.name}) has NO image!`);
      failCount++;
      continue;
    }

    // Determine extension
    const urlObj = new URL(imgSrc);
    let ext = path.extname(urlObj.pathname).toLowerCase() || '.jpg';
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      ext = '.jpg';
    }

    const filename = `istore-prod-${p.id}${ext}`;
    const localPath = path.join(outputDir, filename);
    const webPath = `/images/products/istore/${filename}`;

    try {
      const res = await fetch(imgSrc, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(localPath, buffer);
        imageMapping[p.id] = webPath;
        successCount++;
        if (i % 10 === 0 || i === raw.length - 1) {
          console.log(`[${i + 1}/${raw.length}] ✅ Downloaded: ${filename} (${(buffer.length / 1024).toFixed(1)} KB) - ${p.name}`);
        }
      } else {
        console.log(`[${i + 1}/${raw.length}] ❌ HTTP ${res.status} for ${imgSrc} (${p.name})`);
        failCount++;
      }
    } catch (err) {
      console.log(`[${i + 1}/${raw.length}] ❌ Error downloading ${imgSrc}: ${err.message}`);
      failCount++;
    }
  }

  fs.writeFileSync('scripts/istore-image-mapping.json', JSON.stringify(imageMapping, null, 2));
  console.log(`\nImage Download Summary:`);
  console.log(`- Success: ${successCount}`);
  console.log(`- Failed: ${failCount}`);
}

main().catch(console.error);
