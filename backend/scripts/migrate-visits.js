const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log('Migrating visits table...');

    // Drop visits if exists but we need to drop foreign keys first? Let's just try to create them.
    // First, modify visits if it exists, or create it.
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`visits\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`locationId\` int NOT NULL,
        \`userId\` int NOT NULL,
        \`dateTimestamp\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`comment\` text COLLATE utf8mb4_unicode_ci,
        \`formData\` json DEFAULT NULL,
        \`type\` enum('SPONTANEOUS','CIRCUIT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SPONTANEOUS',
        \`circuitId\` int DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`visits_locationId_idx\` (\`locationId\`),
        KEY \`visits_userId_idx\` (\`userId\`),
        KEY \`visits_circuitId_idx\` (\`circuitId\`),
        CONSTRAINT \`visits_circuitId_fkey\` FOREIGN KEY (\`circuitId\`) REFERENCES \`circuits\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`visits_locationId_fkey\` FOREIGN KEY (\`locationId\`) REFERENCES \`locations\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`visits_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    // Check if visits table needs alter (if it already existed but has old schema like clientId)
    try {
      await connection.execute('ALTER TABLE \`visits\` DROP COLUMN \`clientId\`;');
      console.log('Dropped clientId from visits');
    } catch (e) { /* Ignore if doesn't exist */ }

    try {
      await connection.execute('ALTER TABLE \`visits\` DROP COLUMN \`imageUrl\`;');
      console.log('Dropped imageUrl from visits');
    } catch (e) { /* Ignore if doesn't exist */ }

    try {
      await connection.execute('ALTER TABLE \`visits\` ADD COLUMN \`formData\` json DEFAULT NULL;');
      console.log('Added formData to visits');
    } catch (e) { /* Ignore if exists */ }

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`visit_images\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`visitId\` int NOT NULL,
        \`imageUrl\` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`createdAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        KEY \`visit_images_visitId_idx\` (\`visitId\`),
        CONSTRAINT \`visit_images_visitId_fkey\` FOREIGN KEY (\`visitId\`) REFERENCES \`visits\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

migrate();
