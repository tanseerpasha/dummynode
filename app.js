const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const app = express();

const { createTable, saveOrUpdateToken, getTokenFromDb } = require("./dbService");
const { sunburstLogin } = require("./sunburstApi");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3030;

// ✅ Read private key once at startup (if used)
let privateKey = null;
try {
  privateKey = fs.readFileSync("AuthKey_L38ADHKU82.p8");
} catch (e) {
  console.warn("⚠️ Private key not found (AuthKey_L38ADHKU82.p8). JWT route will be disabled.");
}

// -------------------------------
// Dummy test routes
// -------------------------------
app.get("/", (_, res) => res.send("Hello World"));
app.post("/", (_, res) => res.send("This is a post response"));

// -------------------------------
// Sunburst: Get token from DB
// -------------------------------
app.get("/getSunburstTokenFromDb", async (_, res) => {
  try {
    const token = await getTokenFromDb("Sunburst");
    if (token) {
      res.json({ result: token });
    } else {
      res.status(404).json({ error: "No cached token found" });
    }
  } catch (err) {
    console.error("getSunburstTokenFromDb failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------------------
// Sunburst: Get fresh token from API
// -------------------------------
app.get("/getSunburstTokenFromApi", async (_, res) => {
  try {
    const { token, error } = await sunburstLogin(true);

    if (token && token.access_token) {
      await saveOrUpdateToken("Sunburst", token.access_token, token.expires_in);
      res.json({ result: token.access_token });
    } else {
      res.status(400).json({ error: error || "Failed to get token from API" });
    }
  } catch (err) {
    console.error("getSunburstTokenFromApi failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------------------
// Apple JWT Token Generator
// -------------------------------
if (privateKey) {
  app.post("/getToken", (req, res) => {
    try {
      const body = req.body;
      const token = jwt.sign(
        { sub: body.sub },
        privateKey,
        {
          issuer: body.issuer,
          expiresIn: body.expiresIn,
          keyid: body.keyid,
          algorithm: body.algorithm,
          header: { id: body.hId },
        }
      );

      res.json({ result: token });
    } catch (err) {
      console.error("JWT generation failed:", err);
      res.status(400).json({ error: "Failed to generate token" });
    }
  });
} else {
  console.warn("⚠️ /getToken route disabled — missing private key file.");
}

// -------------------------------
// Start Server
// -------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
