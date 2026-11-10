import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const CANONICAL_CALL_PHONE = '+2348065373747';
const CANONICAL_WA_PHONE = '2348065373747';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    // Terminate any stranded backends
    const statRes = await client.query(`
      SELECT pid FROM pg_stat_activity 
      WHERE state != 'idle' AND pid != pg_backend_pid()
    `);
    for (const r of statRes.rows) {
      try {
        await client.query('SELECT pg_terminate_backend($1)', [r.pid]);
        console.log('Cleaned up PID', r.pid);
      } catch {}
    }

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

    const T_CP = resolveTable(['organizationContactPoint', 'organization_contact_point']);
    const T_ORG = resolveTable(['organization', 'Organization']);
    const T_LISTING = resolveTable(['discoveryListing', 'DiscoveryListing', 'discovery_listing']);
    const T_SCHOOL = resolveTable(['schoolSettings', 'SchoolSettings', 'school_settings']);

    // 1. Update existing ContactPoints
    if (T_CP) {
      const upPhone = await client.query(`UPDATE ${T_CP} SET value = $1 WHERE type = 'PHONE'`, [CANONICAL_CALL_PHONE]);
      console.log(`✓ Updated ${upPhone.rowCount} PHONE contact points`);

      const upWa = await client.query(`UPDATE ${T_CP} SET value = $1 WHERE type = 'WHATSAPP'`, [CANONICAL_WA_PHONE]);
      console.log(`✓ Updated ${upWa.rowCount} WHATSAPP contact points`);

      // Set-based bulk insert for missing PHONE contact points
      if (T_ORG) {
        const insPhone = await client.query(`
          INSERT INTO ${T_CP} (id, "organizationId", type, value, "isPrimary", "isVerified")
          SELECT gen_random_uuid(), o.id, 'PHONE', '${CANONICAL_CALL_PHONE}', true, true
          FROM ${T_ORG} o
          WHERE NOT EXISTS (
            SELECT 1 FROM ${T_CP} cp WHERE cp."organizationId" = o.id AND cp.type = 'PHONE'
          )
        `);
        console.log(`✓ Bulk inserted ${insPhone.rowCount} missing PHONE contact points`);

        const insWa = await client.query(`
          INSERT INTO ${T_CP} (id, "organizationId", type, value, "isPrimary", "isVerified")
          SELECT gen_random_uuid(), o.id, 'WHATSAPP', '${CANONICAL_WA_PHONE}', true, true
          FROM ${T_ORG} o
          WHERE NOT EXISTS (
            SELECT 1 FROM ${T_CP} cp WHERE cp."organizationId" = o.id AND cp.type = 'WHATSAPP'
          )
        `);
        console.log(`✓ Bulk inserted ${insWa.rowCount} missing WHATSAPP contact points`);
      }
    }

    // 2. Update DiscoveryListing metadata in bulk
    if (T_LISTING) {
      // In Postgres, if metadata is text or jsonb, we can update it directly
      const upListings = await client.query(`
        UPDATE ${T_LISTING}
        SET metadata = (
          CASE 
            WHEN metadata IS NULL OR metadata = '' THEN '{}'::jsonb
            ELSE metadata::jsonb
          END
          || jsonb_build_object(
            'phone', '${CANONICAL_CALL_PHONE}',
            'whatsapp', '${CANONICAL_WA_PHONE}',
            'whatsappPhone', '${CANONICAL_WA_PHONE}',
            'contactPhone', '${CANONICAL_CALL_PHONE}',
            'callNumber', '${CANONICAL_CALL_PHONE}'
          )
        )::text
      `);
      console.log(`✓ Bulk updated ${upListings.rowCount} DiscoveryListing records`);
    }

    // 3. Update SchoolSettings if present
    if (T_SCHOOL) {
      const upSchool = await client.query(`UPDATE ${T_SCHOOL} SET phone = $1`, [CANONICAL_CALL_PHONE]);
      console.log(`✓ Updated ${upSchool.rowCount} SchoolSettings records`);
    }

    console.log('✓ SUCCESS: All database contact numbers synchronized to hotline +2348065373747 / 2348065373747');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
