const { Client } = require("pg");
// Use Render’s DATABASE_URL from environment variables


const client = new Client({
    connectionString: process.env.DATABASE_INTERNAL_URL,
    ssl: { rejectUnauthorized: false } // Required for Render
});


// const client = new Client({
//     connectionString: process.env.DATABASE_EXTERNAL_URL,
//     ssl: { rejectUnauthorized: false }, // Required for Render
//   });

  // Connect to database
  async function connectDB() {
    try {
        await client.connect();
        // console.log("✅ Connected to PostgreSQL");
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
        const res = await client.query(query, values);
        if (res.rows.length > 0) {
            const { access_token, expires_in, current_time } = res.rows[0];

            const expiresAt = parseInt(current_time) + expires_in; // Calculate expiration time
            
            if (parseInt(current_time) > expiresAt) {
                //console.log(`⚠️ Token for ${apiName} has expired.`);
                return null;
            }

            // console.log(`🔑 Token for ${apiName}:`, access_token);
            // console.log(`⏳ expiresAt in: ${expiresAt} `);
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
        DO UPDATE SET access_token = EXCLUDED.access_token, 
                      expires_in = EXCLUDED.expires_in, 
                      updated_at = NOW()
        RETURNING *;
    `;
    const values = [token, expiresIn, apiName];

    try {
        const res = await client.query(query, values);
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

    const triggerQuery = `
        CREATE OR REPLACE FUNCTION update_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON tokens
        FOR EACH ROW
        WHEN (OLD.* IS DISTINCT FROM NEW.*) 
        EXECUTE FUNCTION update_timestamp();
    `;

    try {
        await client.query(query);
        // await client.query(triggerQuery);
        // DO UPDATE SET is handling time stamp update so trigger query not required
        // console.log("✅ Tokens table and trigger created");
    } catch (error) {
        // console.error("❌ Error creating table or trigger:", error);
    }
}

  connectDB();
  //use this for very first time
  //createTable();

  module.exports = {
    connectDB, 
    createTable,
    saveOrUpdateToken,
    getTokenFromDb
};