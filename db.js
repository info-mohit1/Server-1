const { Pool } = require('pg');
require('dotenv').config();

// Configured relational datastore interface instance
const persistentDataClusterPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * Orchestrates absolute initialization sequence for backend schema relations
 * Sets up core tables if they do not exist in the targeted persistent datastore
 */
const bootstrapRelationalDatastore = async () => {
  const transactionalClientSession = await persistentDataClusterPool.connect();
  try {
    // Execute structured table provisioning blueprints sequentially
    await transactionalClientSession.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id TEXT NOT NULL,
        owner_name TEXT,
        owner_email TEXT,
        name TEXT NOT NULL,
        description TEXT,
        image TEXT,
        floor TEXT,
        capacity INTEGER,
        hourly_rate DECIMAL(10,2),
        amenities TEXT[],
        booking_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        user_name TEXT,
        user_email TEXT,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        total_cost DECIMAL(10,2),
        special_note TEXT,
        status TEXT DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Database initialized successfully');
  } catch (schemaInitializationError) {
    console.error('❌ Database bootstrapping failed:', schemaInitializationError.message);
    throw schemaInitializationError;
  } finally {
    // Safely return client session context back to the primary cluster connection pool
    transactionalClientSession.release();
  }
};

module.exports = { 
  pool: persistentDataClusterPool, 
  initDB: bootstrapRelationalDatastore 
};