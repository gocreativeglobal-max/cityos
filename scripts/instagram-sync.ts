import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { db } from '../src/prisma/db';
import {
  resolveCalabarInstagramTargets,
  syncInstagramPostToCityOS,
  cleanInstagramCaption,
  isInstagramPostFresh,
  parseInstagramMetaCaption,
  type RawInstagramPostInput,
} from '../lib/instagram-sync';

const AUTH_DIR = path.resolve(process.cwd(), '.auth');
const PROFILE_DIR = path.join(AUTH_DIR, 'instagram-profile');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: {
    target?: string;
    org?: string;
    handle?: string;
    limit: number;
    maxAgeDays: number;
    dryRun: boolean;
    headed: boolean;
    chromeProfile?: string;
  } = {
    limit: 2,
    maxAgeDays: 7, // Default: only fresh posts from this week (last 7 days)
    dryRun: false,
    headed: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--headed') opts.headed = true;
    else if (arg === '--all-time') opts.maxAgeDays = 0;
    else if (arg.startsWith('--target=')) opts.target = arg.split('=')[1];
    else if (arg.startsWith('--org=')) opts.org = arg.split('=')[1];
    else if (arg.startsWith('--handle=')) opts.handle = arg.split('=')[1]?.replace(/^@/, '');
    else if (arg.startsWith('--chrome-profile=')) opts.chromeProfile = arg.slice('--chrome-profile='.length).replace(/^["']|["']$/g, '');
    else if (arg.startsWith('--max-age-days=')) {
      const d = Number(arg.split('=')[1]);
      if (!Number.isNaN(d) && d >= 0) opts.maxAgeDays = d;
    } else if (arg.startsWith('--limit=')) {
      const n = Number(arg.split('=')[1]);
      if (!Number.isNaN(n) && n > 0 && n <= 12) opts.limit = n;
    }
  }
  return opts;
}

function extractEdgesFromGraphqlJson(json: any, handle: string): RawInstagramPostInput[] {
  const results: RawInstagramPostInput[] = [];
  try {
    // 1. web_profile_info format: data.user.edge_owner_to_timeline_media.edges
    const timelineEdges =
      json?.data?.user?.edge_owner_to_timeline_media?.edges ||
      json?.data?.xdt_api__v1__feed__user_timeline_graphql_connection?.edges ||
      [];

    for (const edge of timelineEdges) {
      const node = edge?.node || edge;
      const shortcode = node?.shortcode || node?.code;
      if (!shortcode) continue;

      const caption =
        node?.edge_media_to_caption?.edges?.[0]?.node?.text ||
        node?.caption?.text ||
        node?.accessibility_caption ||
        '';
      const displayUrl =
        node?.display_url ||
        node?.image_versions2?.candidates?.[0]?.url ||
        node?.thumbnail_src ||
        null;
      const ts = node?.taken_at_timestamp || node?.taken_at;
      const timestampIso = ts ? new Date(Number(ts) * 1000).toISOString() : null;

      results.push({
        shortcode,
        caption,
        fallbackImageUrl: displayUrl,
        permalink: `https://www.instagram.com/p/${shortcode}/`,
        timestampIso,
        instagramHandle: handle,
      });
    }
  } catch {}
  return results;
}

async function main() {
  const opts = parseArgs();

  console.log('=============================================================');
  console.log('🔄 9jaLive — Calabar Instagram Business Feed Sync');
  console.log('=============================================================');

  let targets = await resolveCalabarInstagramTargets(opts.target);

  // Support ad-hoc --org=<slug> --handle=<ig_handle> and persist handle to DiscoveryListing metadata
  if (opts.org && opts.handle) {
    let listing = await db.orm.public.DiscoveryListing.where({ slug: opts.org }).first();
    if (!listing) {
      listing = await db.orm.public.DiscoveryListing.where({ organizationId: opts.org }).first();
    }
    const orgId = listing?.organizationId || opts.org;
    const org = await db.orm.public.Organization.where({ id: orgId }).first();
    if (!org) {
      console.error(`❌ Organization "${opts.org}" not found in database.`);
      process.exit(1);
    }

    if (listing && !opts.dryRun) {
      let meta: any = {};
      try {
        if (listing.metadata) meta = JSON.parse(listing.metadata);
      } catch {}
      meta.instagram = opts.handle;
      await db.orm.public.DiscoveryListing.where({ id: listing.id }).update({
        metadata: JSON.stringify(meta),
      });
      console.log(`📌 Linked @${opts.handle} to ${org.name} (${listing.slug})`);
    }

    targets = [
      {
        organizationId: org.id,
        slug: listing?.slug || org.id,
        name: org.name,
        instagramHandle: opts.handle,
        defaultCategory: 'Announcement',
        address: org.address || 'Calabar',
      },
    ];
  }

  if (targets.length === 0) {
    console.log('⚠️ No matching Calabar Instagram business targets found.');
    process.exit(0);
  }

  console.log(
    `📋 Target businesses to check: ${targets.length} (limit: ${opts.limit} posts/business, freshness: ${
      opts.maxAgeDays > 0 ? `last ${opts.maxAgeDays} days` : 'all-time'
    })`
  );
  let context: any = null;
  let attachedViaCdp = false;

  // 1. Try attaching to an already-open Chrome with remote debugging on port 9222
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 2000 });
    context = browser.contexts()[0] || (await browser.newContext());
    attachedViaCdp = true;
    console.log('🔗 Attached directly to your open Chrome browser (port 9222)!');
  } catch {}

  // 2. Or launch using a cloned copy of existing Windows Chrome profile if --chrome-profile is passed
  if (!context && opts.chromeProfile) {
    const systemUserData = path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data');
    let profileDirName = opts.chromeProfile;
    let friendlyName = opts.chromeProfile;
    try {
      const localState = JSON.parse(fs.readFileSync(path.join(systemUserData, 'Local State'), 'utf8'));
      const cache = localState?.profile?.info_cache || {};
      for (const [dir, info] of Object.entries<any>(cache)) {
        if (
          dir.toLowerCase() === opts.chromeProfile.toLowerCase() ||
          info?.name?.toLowerCase() === opts.chromeProfile.toLowerCase() ||
          info?.user_name?.toLowerCase() === opts.chromeProfile.toLowerCase()
        ) {
          profileDirName = dir;
          friendlyName = info?.name || dir;
          break;
        }
      }
    } catch {}

    const srcProfileDir = path.join(systemUserData, profileDirName);
    const clonedUserDataDir = path.join(AUTH_DIR, `chrome-${profileDirName.replace(/\s+/g, '-')}`);
    const clonedProfileDir = path.join(clonedUserDataDir, profileDirName);
    const clonedCookiesPath = path.join(clonedProfileDir, 'Network', 'Cookies');
    const srcCookiesPath = path.join(srcProfileDir, 'Network', 'Cookies');

    if (!fs.existsSync(clonedCookiesPath) && fs.existsSync(srcCookiesPath)) {
      let warned = false;
      while (true) {
        try {
          const testBuf = fs.readFileSync(srcCookiesPath);
          if (testBuf.length > 0) break;
        } catch (err: any) {
          if (err?.code === 'EBUSY' || err?.code === 'EPERM') {
            if (!warned) {
              console.log(`\n⏳ Your "${friendlyName}" (${profileDirName}) Chrome window is currently open.`);
              console.log(`👉 Please close ONLY the "${friendlyName}" Chrome window for 2 seconds so we can import its session...`);
              warned = true;
            }
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          break;
        }
      }

      console.log(`📦 Importing login session from Chrome profile "${friendlyName}" (${profileDirName})...`);
      fs.mkdirSync(path.join(clonedProfileDir, 'Network'), { recursive: true });
      try {
        fs.copyFileSync(path.join(systemUserData, 'Local State'), path.join(clonedUserDataDir, 'Local State'));
      } catch {}
      for (const file of ['Preferences', 'Secure Preferences', 'Web Data', 'Login Data']) {
        const s = path.join(srcProfileDir, file);
        if (fs.existsSync(s)) {
          try {
            fs.copyFileSync(s, path.join(clonedProfileDir, file));
          } catch {}
        }
      }
      try {
        fs.copyFileSync(srcCookiesPath, clonedCookiesPath);
      } catch {}
      const srcLocalStorage = path.join(srcProfileDir, 'Local Storage');
      if (fs.existsSync(srcLocalStorage)) {
        try {
          fs.cpSync(srcLocalStorage, path.join(clonedProfileDir, 'Local Storage'), { recursive: true });
        } catch {}
      }
      console.log(`✅ Imported "${friendlyName}" session into .auth! (You can now re-open your normal Chrome anytime.)\n`);
    }

    console.log(`🌐 Launching isolated Playwright Chrome with profile "${friendlyName}" (${profileDirName})...`);
    context = await chromium.launchPersistentContext(clonedUserDataDir, {
      channel: 'chrome',
      headless: !opts.headed,
      viewport: { width: 1280, height: 840 },
      args: [`--profile-directory=${profileDirName}`, '--disable-blink-features=AutomationControlled'],
    });
  }

  // 3. Default to dedicated .auth/instagram-profile
  if (!context) {
    if (!fs.existsSync(PROFILE_DIR)) {
      console.log('ℹ️ Tip: Run "npm run social:login" first if Instagram asks for login authentication.\n');
    }
    context = await chromium.launchPersistentContext(PROFILE_DIR, {
      channel: 'chrome',
      headless: !opts.headed,
      viewport: { width: 1280, height: 840 },
      args: ['--disable-blink-features=AutomationControlled'],
    });
  }

  const page = attachedViaCdp ? await context.newPage() : (context.pages()[0] || (await context.newPage()));
  let totalCreated = 0;
  let totalDuplicates = 0;
  let totalOutdated = 0;

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    console.log(`\n[${i + 1}/${targets.length}] 🔍 Checking @${target.instagramHandle} (${target.name})...`);

    const interceptedPosts: RawInstagramPostInput[] = [];
    const responseHandler = async (res: any) => {
      const url = res.url();
      if (
        url.includes('web_profile_info') ||
        url.includes('graphql/query') ||
        url.includes('/api/v1/feed/user/')
      ) {
        try {
          const json = await res.json();
          const extracted = extractEdgesFromGraphqlJson(json, target.instagramHandle);
          if (extracted.length > 0) {
            interceptedPosts.push(...extracted);
          }
        } catch {}
      }
    };

    page.on('response', responseHandler);

    try {
      await page.goto(`https://www.instagram.com/${target.instagramHandle}/`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Wait 4s for profile grid & XHR calls to settle
      await page.waitForTimeout(4000);

      // Dismiss login modal overlay if browsing unauthenticated
      try {
        const closeBtn = page.locator('svg[aria-label="Close"]').first();
        if (await closeBtn.isVisible({ timeout: 1000 })) {
          await closeBtn.click();
        }
      } catch {}

      let postsToProcess = interceptedPosts.slice(0, opts.limit);

      // Fallback to DOM extraction if GraphQL XHR was not intercepted
      if (postsToProcess.length === 0) {
        const domPosts = await page.evaluate((limitCount) => {
          const anchors = Array.from(
            document.querySelectorAll<HTMLAnchorElement>('a[href*="/p/"], a[href*="/reel/"]')
          );
          const seen = new Set<string>();
          const items: { shortcode: string; caption: string; imageUrl: string | null; permalink: string }[] = [];

          for (const a of anchors) {
            const href = a.getAttribute('href') || '';
            const match = href.match(/\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
            if (!match || !match[1]) continue;
            const shortcode = match[1];
            if (seen.has(shortcode)) continue;
            seen.add(shortcode);

            const img = a.querySelector('img');
            const caption = img?.getAttribute('alt') || '';
            const imageUrl = img?.getAttribute('src') || null;

            items.push({
              shortcode,
              caption,
              imageUrl,
              permalink: `https://www.instagram.com/p/${shortcode}/`,
            });
            if (items.length >= limitCount) break;
          }
          return items;
        }, opts.limit);

        postsToProcess = domPosts.map((d) => ({
          shortcode: d.shortcode,
          caption: d.caption,
          fallbackImageUrl: d.imageUrl,
          permalink: d.permalink,
          instagramHandle: target.instagramHandle,
        }));
      }

      console.log(`   Found ${postsToProcess.length} recent post(s) on @${target.instagramHandle}`);

      for (const rawPost of postsToProcess) {
        // Check freshness BEFORE downloading image buffer or visiting permalink
        if (opts.maxAgeDays > 0) {
          const freshness = isInstagramPostFresh(rawPost, opts.maxAgeDays);
          if (!freshness.isFresh) {
            totalOutdated++;
            const ageStr =
              freshness.ageDays !== null
                ? `${freshness.ageDays}d old (${freshness.postDate?.toISOString().slice(0, 10)})`
                : 'unknown/unverified date';
            console.log(`   ⏭️ Skipped ${rawPost.shortcode} (outdated: ${ageStr} > ${opts.maxAgeDays}d limit)`);
            continue;
          }
        }

        // If the caption came from DOM img alt-text ("Photo by ... on Date. May be an image of..."),
        // navigate to the post permalink to extract the REAL business caption & verify official author!
        const looksLikeAltText =
          !rawPost.caption ||
          /^(?:Photo|Video|Reel)\s+(?:by|shared by)\s+/i.test(rawPost.caption.trim()) ||
          /\bMay be an? (?:image|graphic|photo|video)\b/i.test(rawPost.caption);

        if (looksLikeAltText) {
          try {
            const postUrl = rawPost.permalink || `https://www.instagram.com/p/${rawPost.shortcode}/`;
            await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
            await page.waitForTimeout(2500);

            const permalinkMeta = await page.evaluate(() => {
              const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
              const ogDesc =
                document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                '';
              const timeIso = document.querySelector('time')?.getAttribute('datetime') || '';
              return { ogTitle, ogDesc, timeIso };
            });

            if (permalinkMeta.timeIso && !rawPost.timestampIso) {
              rawPost.timestampIso = permalinkMeta.timeIso;
            }

            const parsedMeta = parseInstagramMetaCaption(permalinkMeta.ogTitle, permalinkMeta.ogDesc);

            // Strict official account check: if the post was uploaded by a different handle (e.g., third-party collab), skip it
            if (
              parsedMeta.authorHandle &&
              parsedMeta.authorHandle.toLowerCase() !== target.instagramHandle.toLowerCase()
            ) {
              console.log(
                `   ⏭️ Skipped ${rawPost.shortcode} (third-party collab by @${parsedMeta.authorHandle}, not official @${target.instagramHandle})`
              );
              continue;
            }

            if (parsedMeta.caption) {
              rawPost.caption = parsedMeta.caption;
            }
          } catch (permErr) {
            console.warn(`   ⚠️ Could not fetch permalink details for ${rawPost.shortcode}`);
          }
        }

        // Download image bytes so it is permanently hosted in 9jaLive Asset table
        if (rawPost.fallbackImageUrl && !opts.dryRun) {
          try {
            const imgResp = await context.request.get(rawPost.fallbackImageUrl, { timeout: 15000 });
            if (imgResp.ok()) {
              const buffer = await imgResp.body();
              rawPost.imageBase64 = buffer.toString('base64');
              rawPost.imageMimeType = imgResp.headers()['content-type'] || 'image/jpeg';
            }
          } catch (imgErr) {
            console.warn(`   ⚠️ Could not download image buffer for ${rawPost.shortcode}, using fallback URL.`);
          }
        }

        if (opts.dryRun) {
          const preview = cleanInstagramCaption(rawPost.caption, target.name, target.defaultCategory);
          const freshness = isInstagramPostFresh(rawPost, opts.maxAgeDays || 36500);
          console.log(
            `   [DRY-RUN] ✨ FRESH Post ${rawPost.shortcode} (${
              freshness.postDate ? freshness.postDate.toISOString().slice(0, 10) : 'recent'
            }):`
          );
          console.log(`     Title:    ${preview.title}`);
          console.log(`     Category: ${preview.category}`);
          console.log(`     Content:  ${preview.content.slice(0, 120)}...`);
          continue;
        }

        const res = await syncInstagramPostToCityOS(target, rawPost, { maxAgeDays: opts.maxAgeDays });
        if (res.action === 'created') {
          totalCreated++;
          console.log(`   ✅ Published fresh post ${rawPost.shortcode} -> 9jaLive Post ID: ${res.postId}`);
        } else if (res.action === 'skipped_duplicate') {
          totalDuplicates++;
          console.log(`   ⏭️ Skipped ${rawPost.shortcode} (already on 9jaLive)`);
        } else if (res.action === 'skipped_outdated') {
          totalOutdated++;
          console.log(`   ⏭️ Skipped ${rawPost.shortcode} (outdated: ${res.ageDays ?? '?'}d old)`);
        } else {
          console.log(`   ⏭️ Skipped ${rawPost.shortcode} (low signal / empty)`);
        }
      }
    } catch (err: any) {
      console.error(`   ❌ Error syncing @${target.instagramHandle}:`, err?.message || err);
    } finally {
      page.off('response', responseHandler);
    }

    // Human-like random pause (4.5s - 7.5s) before next business
    if (i < targets.length - 1) {
      const delayMs = 4500 + Math.floor(Math.random() * 3000);
      await page.waitForTimeout(delayMs);
    }
  }

  if (attachedViaCdp) {
    await page.close().catch(() => {});
  } else {
    await context.close();
  }
  console.log('\n=============================================================');
  console.log(
    `🎉 Sync Complete! Created: ${totalCreated} fresh post(s), Skipped outdated: ${totalOutdated}, Skipped duplicates: ${totalDuplicates}`
  );
  console.log('=============================================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error in instagram-sync:', err);
  process.exit(1);
});
