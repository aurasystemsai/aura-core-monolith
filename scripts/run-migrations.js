/**
 * Database Migration Runner
 * 
 * Applies SQL migration files to the database in order.
 * 
 * Usage:
 *   node scripts/run-migrations.js
 *   node scripts/run-migrations.js --rollback  (future feature)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
});

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

// Create migrations tracking table
async function createMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

// Get applied migrations
async function getAppliedMigrations() {
  const result = await pool.query(
    'SELECT version FROM schema_migrations ORDER BY version'
  );
  return result.rows.map(row => row.version);
}

// Get pending migration files
function getPendingMigrations(appliedVersions) {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  return files.filter(file => {
    const version = file.split('_')[0];
    return !appliedVersions.includes(version);
  });
}

// Apply a single migration
async function applyMigration(filename) {
  const version = filename.split('_')[0];
  const name = filename.replace('.sql', '').substring(version.length + 1);
  
  console.log(`\n📦 Applying migration: ${filename}`);
  
  const sql = fs.readFileSync(
    path.join(MIGRATIONS_DIR, filename),
    'utf-8'
  );
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Run migration SQL
    await client.query(sql);
    
    // Record migration
    await client.query(
      'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
      [version, name]
    );
    
    await client.query('COMMIT');
    
    console.log(`   ✅ Migration applied successfully`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`   ❌ Migration failed:`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Main migration runner
async function runMigrations() {
  console.log('\n🚀 Aura CDP - Database Migration Runner\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Check database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection established');
    
    // Create migrations table
    await createMigrationsTable();
    console.log('✅ Migrations tracking table ready');
    
    // Get applied migrations
    const appliedVersions = await getAppliedMigrations();
    console.log(`📊 Applied migrations: ${appliedVersions.length}`);
    
    // Get pending migrations
    const pendingMigrations = getPendingMigrations(appliedVersions);
    
    if (pendingMigrations.length === 0) {
      console.log('\n✅ No pending migrations - database is up to date\n');
      return;
    }
    
    console.log(`📋 Pending migrations: ${pendingMigrations.length}`);
    
    // Apply each pending migration
    for (const migration of pendingMigrations) {
      await applyMigration(migration);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All migrations applied successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ Migration runner failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Show migration status
async function showStatus() {
  console.log('\n📊 Migration Status\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    await pool.query('SELECT NOW()');
    
    await createMigrationsTable();
    
    const appliedVersions = await getAppliedMigrations();
    const allFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log('Applied migrations:');
    if (appliedVersions.length === 0) {
      console.log('  (none)');
    } else {
      const result = await pool.query(
        'SELECT version, name, applied_at FROM schema_migrations ORDER BY version'
      );
      result.rows.forEach(row => {
        const date = new Date(row.applied_at).toISOString().split('T')[0];
        console.log(`  ✅ ${row.version}_${row.name} (${date})`);
      });
    }
    
    console.log('\nPending migrations:');
    const pending = getPendingMigrations(appliedVersions);
    if (pending.length === 0) {
      console.log('  (none)');
    } else {
      pending.forEach(file => {
        console.log(`  ⏳ ${file}`);
      });
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--status') || args.includes('-s')) {
  showStatus();
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node scripts/run-migrations.js [options]

Options:
  --status, -s    Show migration status
  --help, -h      Show this help message

Examples:
  node scripts/run-migrations.js        # Run pending migrations
  node scripts/run-migrations.js -s     # Show migration status
  `);
} else {
  runMigrations();
}
