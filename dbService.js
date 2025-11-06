const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_INTERNAL_URL || "Error",
  ssl: { rejectUnauthorized: false } // Required for Render
});

// Handle unexpected disconnects gracefully
pool.on("error", (err) => {
  console.error("Unexpected PG connection error:", err);
});

// Create table if not exists
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
  } catch (error) {
    console.error("Error creating table:", error);
  }
}

// Get token from DB
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
      return parseInt(current_time) > expiresAt ? null : access_token;
    }
    return null;
  } catch (err) {
    console.error("Error fetching token:", err);
    return null;
  }
}

// Save or update token
async function saveOrUpdateToken(apiName, token, expiresIn = 604800) {
  const query = `
    INSERT INTO tokens (access_token, expires_in, api_name, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (api_name) 
    DO UPDATE SET access_token = EXCLUDED.access_token,
                  expires_in = EXCLUDED.expires_in,
                  updated_at = NOW()
  `;
  const values = [token, expiresIn, apiName];

  try {
    await pool.query(query, values);
  } catch (err) {
    console.error("Error updating token:", err);
  }
}

// Optional explicit test connection
async function connectDB() {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL connection ready");
  } catch (err) {
    console.error("❌ Database connection error:", err);
  }
}

connectDB();

module.exports = {
  connectDB,
  createTable,
  saveOrUpdateToken,
  getTokenFromDb,
};
