const { Pool } = require("pg");

// Use Render’s DATABASE_INTERNAL_URL from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_INTERNAL_URL,
  ssl: { rejectUnauthorized: false } // Required for Render
});

// ✅ Test connection once at startup
async function connectDB() {
  try {
    const client = await pool.connect();
    // console.log("✅ Connected to PostgreSQL");
    client.release();
  } catch (err) {
    // console.error("❌ Database connection error:", err);
  }
}

async function getTokenFromDb(apiName) {
  const query = `
    SELECT access_token, expires_in, EXTRACT(EPOCH FROM NOW()) AS current_time 
    FROM tokens WHERE api_name = $1
  `;
  const values = [apiName];

  try {
    const res = await pool.query(query, values);
    if (res.rows.length > 0) {
      const { access_token, expires_in, current_time } = res.rows[0];
      const expiresAt = parseInt(current_time) + expires_in;

      if (parseInt(current_time) > expiresAt) {
        // console.log(`⚠️ Token for ${apiName} has expired.`);
        return null;
      }

      return access_token;
    } else {
      // console.log(`⚠️ No token found for ${apiName}.`);
      return null;
    }
  } catch (err) {
    // console.error("❌ Error fetching token:", err);
    return null;
  }
}

async function saveOrUpdateToken(apiName, token, expiresIn = 604800) {
  const query = `
    INSERT INTO tokens (access_token, expires_in, api_name, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (api_name) 
    DO UPDATE SET 
      access_token = EXCLUDED.access_token, 
      expires_in = EXCLUDED.expires_in, 
      updated_at = NOW()
    RETURNING *;
  `;
  const values = [token, expiresIn, apiName];

  try {
    const res = await pool.query(query, values);
    // console.log(`✅ Token updated for ${apiName}:`, res.rows[0]);
  } catch (err) {
    // console.error("❌ Error updating token:", err);
  }
}

async function createTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS tokens (
      id SERIAL PRIMARY KEY,
      access_token TEXT NOT NULL,
      expires_in INTEGER NOT NULL,
      api_name TEXT NOT NULL UNIQUE,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(query);
    // console.log("✅ Tokens table created or verified");
  } catch (error) {
    // console.error("❌ Error creating table:", error);
  }
}

// Initialize once
connectDB();
// Use this for first-time setup only
// createTable();

module.exports = {
  connectDB,
  createTable,
  saveOrUpdateToken,
  getTokenFromDb,
};
