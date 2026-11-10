import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const tablesRes = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const tableNames = tablesRes.rows.map((r) => r.table_name);
    const resolveTable = (candidates) => {
      for (const c of candidates) {
        const found = tableNames.find((t) => t.toLowerCase() === c.toLowerCase());
        if (found) return `"${found}"`;
      }
      return null;
    };

    console.log('=== Tables in DB ===');
    const contactPointTable = resolveTable(['organizationcontactpoint', 'organization_contact_point', 'contactpoint', 'contact_point']);
    console.log('Contact point table:', contactPointTable);

    if (contactPointTable) {
      const cp = await client.query(`SELECT * FROM ${contactPointTable}`);
      console.log(`Found ${cp.rows.length} contact points:`);
      for (const r of cp.rows) {
        console.log(`  [${r.organizationId || r.organization_id}] type=${r.type} value=${r.value} isPrimary=${r.isPrimary || r.is_primary}`);
      }
    }

    const discoveryTable = resolveTable(['discoverylisting', 'discovery_listing']);
    console.log('\n=== DiscoveryListing metadata ===', discoveryTable);
    if (discoveryTable) {
      const dl = await client.query(`SELECT id, slug, metadata FROM ${discoveryTable}`);
      console.log(`Found ${dl.rows.length} discovery listings:`);
      for (const r of dl.rows) {
        if (r.metadata) {
          try {
            const meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata;
            console.log(`  [${r.slug}] phone=${meta.phone || meta.callNumber || meta.contactPhone} whatsapp=${meta.whatsapp || meta.whatsappNumber || meta.whatsappPhone}`);
          } catch (e) {
            console.log(`  [${r.slug}] parse error:`, r.metadata.substring(0, 100));
          }
        }
      }
    }

    console.log('\n=== All columns matching %phone% or %contact% or %whatsapp% ===');
    const cols = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND (column_name ILIKE '%phone%' OR column_name ILIKE '%whatsapp%' OR column_name ILIKE '%contact%')
      ORDER BY table_name, column_name
    `);
    for (const c of cols.rows) {
      console.log(`  ${c.table_name}.${c.column_name}`);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
