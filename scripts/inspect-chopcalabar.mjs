import fs from 'fs';

const html = fs.readFileSync('chopcalabar_home.html', 'utf8');

// Match all links
const hrefMatches = [...html.matchAll(/href=["']([^"']+)["']/g)].map(m => m[1]);
const uniqueHrefs = [...new Set(hrefMatches)];
console.log('Total unique links on homepage:', uniqueHrefs.length);

// Categorize links
const externalSocial = uniqueHrefs.filter(h => 
  h.includes('instagram.com') || 
  h.includes('facebook.com') || 
  h.includes('wa.me') || 
  h.includes('whatsapp.com') || 
  h.includes('twitter.com') || 
  h.includes('x.com') ||
  h.includes('tiktok.com')
);
console.log('\n--- SOCIAL LINKS ON HOMEPAGE ---');
console.log(externalSocial);

// Business / store / vendor links
const internalLinks = uniqueHrefs.filter(h => !h.startsWith('http') || h.includes('chopcalabar.com'));
console.log('\n--- INTERNAL / VENDOR LINKS (Sample) ---');
console.log(internalLinks.slice(0, 40));

// Check for JSON scripts or API endpoints
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
console.log('\nTotal script tags:', scripts.length);

let totalJsonFound = 0;
for (const s of scripts) {
  if (s.includes('JSON.parse') || s.includes('window.') || s.includes('stores') || s.includes('restaurants') || s.includes('vendors')) {
    totalJsonFound++;
    if (s.length < 500) {
      console.log('Script excerpt:', s.trim());
    } else {
      console.log('Script snippet (first 300 chars):', s.trim().slice(0, 300));
    }
  }
}
