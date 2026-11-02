import fs from 'fs';

async function testPlace(id) {
  const url = `https://www.chopcalabar.com/place.php?id=${id}`;
  const res = await fetch(url);
  const html = await res.text();
  
  const title = html.match(/<title>(.*?)<\/title>/i)?.[1]?.trim();
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').trim();
  
  // Extract contact and social links
  const wa = [...html.matchAll(/wa\.me\/([0-9]+)/gi)].map(m => m[0]);
  const ig = [...html.matchAll(/(?:instagram\.com\/)([A-Za-z0-9_.-]+)/gi)].map(m => m[0]);
  const fb = [...html.matchAll(/(?:facebook\.com\/)([A-Za-z0-9_.-]+)/gi)].map(m => m[0]);
  const tel = [...html.matchAll(/tel:([^"'>\s]+)/gi)].map(m => m[1]);
  const website = [...html.matchAll(/href=["'](https?:\/\/(?!www\.chopcalabar)[^"'>\s]+)["']/gi)].map(m => m[1]);
  
  // Look for address, category, hours, description
  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i)?.[1];
  
  console.log(`\n=================== PLACE ID: ${id} ===================`);
  console.log('Title:', title);
  console.log('Name (H1):', h1);
  console.log('Meta Description:', metaDesc);
  console.log('Phones/Tel:', [...new Set(tel)]);
  console.log('WhatsApp:', [...new Set(wa)]);
  console.log('Instagram:', [...new Set(ig)]);
  console.log('Facebook:', [...new Set(fb)]);
  console.log('External Websites:', [...new Set(website)].filter(w => !w.includes('tailwindcss') && !w.includes('cdn') && !w.includes('google') && !w.includes('cloudflare')));
  
  // Check what section headers or labels exist in the HTML
  const headings = [...html.matchAll(/<h[234][^>]*>([\s\S]*?)<\/h[234]>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
  console.log('Headings / Sections:', headings.slice(0, 10));
}

async function main() {
  for (const id of [235, 230, 155, 77, 28]) {
    await testPlace(id);
  }
}

main().catch(console.error);
