import fs from 'fs';

// Helper to decode HTML entities
function decodeHtml(html) {
  if (!html) return '';
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export function parsePlaceHtml(html, id) {
  if (!html || html.length < 500) return null;
  if (html.includes('Place not found') || html.includes('404') && !html.includes('h1')) {
    return null;
  }

  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').trim();
  if (!h1 || h1.toLowerCase().includes('chopcalabar') && h1.length <= 15) {
    // Check if title has the real name
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1]?.trim();
    if (!title || title.startsWith('404') || title === 'ChopCalabar') return null;
  }

  const name = decodeHtml(h1 || html.match(/<title>(.*?)\s*\|\s*ChopCalabar/i)?.[1]?.trim());
  if (!name || name === 'ChopCalabar' || name.includes('Discover What') || name.includes('Page Not Found')) {
    return null;
  }

  // Tags / Category
  const tagsMatch = html.match(/<!--\s*Tags\s*-->([\s\S]*?)<!--/i) || html.match(/<div[^>]*class="[^"]*tag[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const tags = [...html.matchAll(/<span[^>]*class="[^"]*(?:bg-blue-50|rounded-full|tag)[^"]*"[^>]*>([\s\S]*?)<\/span>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(t => t && !t.includes('svg') && t.length < 35);

  // About text
  const aboutSection = html.match(/About[\s\S]*?<p[^>]*class="[^"]*text-gray-600[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
  const about = decodeHtml(aboutSection?.[1]?.replace(/<[^>]+>/g, '').trim() || '');

  // Address / Location
  const locationSection = html.match(/<h2[^>]*>\s*Location\s*<\/h2>\s*<p[^>]*class="[^"]*text-gray-600[^"]*"[^>]*>([\s\S]*?)<\/p>/i)
    || html.match(/Location[\s\S]*?<p[^>]*class="[^"]*text-gray-600[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
  let address = decodeHtml(locationSection?.[1]?.replace(/<[^>]+>/g, '').trim() || '');
  if (address.includes('Take a photo') || address.includes('gallery')) {
    address = '';
  }

  // GPS Coordinates (from Google Maps link)
  const mapsMatch = html.match(/google\.com\/maps\?q=([0-9.-]+),([0-9.-]+)/i);
  const latitude = mapsMatch ? parseFloat(mapsMatch[1]) : null;
  const longitude = mapsMatch ? parseFloat(mapsMatch[2]) : null;

  // Opening Hours
  const hoursMatch = html.match(/<h2[^>]*>\s*Opening Hours\s*<\/h2>\s*<p[^>]*class="[^"]*text-gray-600[^"]*"[^>]*>([\s\S]*?)<\/p>/i)
    || html.match(/Opening Hours[\s\S]*?<p[^>]*class="[^"]*text-gray-600[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
  const hours = decodeHtml(hoursMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || '');

  // Phone numbers (excluding ChopCalabar platform phone 2347031172041)
  const telMatches = [...html.matchAll(/tel:([^"'>\s]+)/gi)].map(m => m[1].trim());
  const phones = [...new Set(telMatches)].filter(p => !p.includes('7031172041') && !p.includes('703-117-2041'));

  // WhatsApp (excluding ChopCalabar's default 2347031172041)
  const waMatches = [...html.matchAll(/wa\.me\/([0-9]+)/gi)].map(m => m[1].trim());
  const whatsapp = [...new Set(waMatches)].filter(p => p !== '2347031172041');

  // Instagram links (excluding @chop.calabar)
  const igMatches = [...html.matchAll(/href=["'](https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9_.-]+)\/?[^"']*)["']/gi)]
    .map(m => ({ url: m[1], handle: m[2] }))
    .filter(ig => !ig.handle.includes('chop.calabar') && !ig.handle.includes('explore') && !ig.handle.includes('p'));
  const instagram = igMatches[0] || null;

  // Facebook links (excluding ChopCalabar facebook page)
  const fbMatches = [...html.matchAll(/href=["'](https?:\/\/(?:www\.)?facebook\.com\/(?:share\/)?[A-Za-z0-9_.-]+[^"']*)["']/gi)]
    .map(m => m[1])
    .filter(f => !f.includes('1HnCfiGS6n') && !f.includes('chopcalabar') && !f.includes('share'));
  const facebook = fbMatches[0] || null;

  // Website links
  const websiteMatches = [...html.matchAll(/href=["'](https?:\/\/[^"'\s]+)["']/gi)]
    .map(m => m[1])
    .filter(w => 
      !w.includes('chopcalabar') &&
      !w.includes('instagram.com') &&
      !w.includes('facebook.com') &&
      !w.includes('wa.me') &&
      !w.includes('whatsapp.com') &&
      !w.includes('tailwindcss.com') &&
      !w.includes('jsdelivr.net') &&
      !w.includes('cloudflare.com') &&
      !w.includes('cdnjs.cloudflare.com') &&
      !w.includes('google.com')
    );
  const website = websiteMatches[0] || null;

  // Image / Cover photo
  const imgMatches = [...html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi)]
    .map(m => m[1])
    .filter(src => 
      !src.includes('logo') && 
      !src.includes('icon') && 
      !src.includes('avatar') &&
      (src.includes('uploads') || src.includes('places') || src.includes('images') || src.includes('assets'))
    );
  const coverImage = imgMatches[0] ? (imgMatches[0].startsWith('http') ? imgMatches[0] : `https://www.chopcalabar.com/${imgMatches[0].replace(/^\//, '')}`) : null;

  // Filter out UI status badges from category tags
  const cleanCategories = [...new Set(tags)].filter(t => 
    t !== '0' && 
    !t.toLowerCase().includes('open') && 
    !t.toLowerCase().includes('closed') && 
    !t.toLowerCase().includes('popular') && 
    !t.toLowerCase().includes('live crowd') && 
    !t.toLowerCase().includes('unverified')
  );

  return {
    id,
    sourceUrl: `https://www.chopcalabar.com/place.php?id=${id}`,
    name,
    categories: cleanCategories.length > 0 ? cleanCategories : ['Business'],
    about: about || null,
    address: address || null,
    latitude,
    longitude,
    hours: hours || null,
    phone: phones[0] || (whatsapp[0] ? whatsapp[0] : null),
    allPhones: phones,
    whatsapp: whatsapp[0] || null,
    instagram: instagram?.url || null,
    instagramHandle: instagram?.handle || null,
    facebook: facebook || null,
    website: website || null,
    coverImage
  };
}

async function scan() {
  console.log('🚀 Scanning ChopCalabar business directory (IDs 1 to 260)...');
  const maxId = 255;
  const results = [];
  const concurrency = 10;

  for (let i = 1; i <= maxId; i += concurrency) {
    const chunk = [];
    for (let j = i; j < i + concurrency && j <= maxId; j++) {
      chunk.push(j);
    }

    const promises = chunk.map(async (id) => {
      try {
        const res = await fetch(`https://www.chopcalabar.com/place.php?id=${id}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: AbortSignal.timeout(4000)
        });
        if (!res.ok) return null;
        const html = await res.text();
        return parsePlaceHtml(html, id);
      } catch (err) {
        return null;
      }
    });

    const parsedChunk = await Promise.all(promises);
    for (const item of parsedChunk) {
      if (item && item.name) {
        results.push(item);
        process.stdout.write(`✅ [ID ${item.id}] ${item.name} | Phone: ${item.phone || 'none'} | IG: ${item.instagramHandle ? '@' + item.instagramHandle : 'none'}\n`);
      }
    }
    await new Promise(r => setTimeout(r, 150));
  }

  results.sort((a, b) => a.id - b.id);
  console.log(`\n🎉 Scan Finished! Found ${results.length} valid businesses.`);

  // Write out to JSON file
  fs.writeFileSync('chopcalabar_extracted_businesses.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('Saved to chopcalabar_extracted_businesses.json');

  // Stats summary
  const withPhone = results.filter(r => r.phone);
  const withWhatsapp = results.filter(r => r.whatsapp);
  const withInstagram = results.filter(r => r.instagramHandle);
  const withFacebook = results.filter(r => r.facebook);
  const withWebsite = results.filter(r => r.website);

  console.log('\n--- DATA COMPLETENESS SUMMARY ---');
  console.log(`Total Valid Businesses: ${results.length}`);
  console.log(`With Phone Number:      ${withPhone.length} (${Math.round(withPhone.length / results.length * 100)}%)`);
  console.log(`With WhatsApp:          ${withWhatsapp.length} (${Math.round(withWhatsapp.length / results.length * 100)}%)`);
  console.log(`With Instagram Handle:  ${withInstagram.length} (${Math.round(withInstagram.length / results.length * 100)}%)`);
  console.log(`With Facebook Link:     ${withFacebook.length} (${Math.round(withFacebook.length / results.length * 100)}%)`);
  console.log(`With Website:           ${withWebsite.length} (${Math.round(withWebsite.length / results.length * 100)}%)`);
}

if (process.argv[1]?.includes('scan-chopcalabar-all.mjs')) {
  scan().catch(console.error);
}
