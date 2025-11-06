// Sunburst API start
const axios = require('axios');

// Your credentials
const username = process.env.SUNBURST_USERNAME;
const password = process.env.SUNBURST_PASSWORD;
const auth = Buffer.from(`${username}:${password}`).toString("base64");

async function sunburstLogin(rememberMe = false) {
  try {
    const response = await axios.post(
      "https://sunburst.sunsetwx.com/v1/login",
      new URLSearchParams({
        grant_type: "password",
        ...(rememberMe && { type: "remember_me" }) // Add remember_me if required
      }).toString(),
      {
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        timeout: 25000 // ⏱️ Timeout after 25 seconds
      }
    );

    // console.log("Access Token API:", response.data);
    return response.data; // Return response data
  } catch (error) {
    // console.error("Login Failed:", error.response ? error.response.data : error.message);
    return null; // Return null on failure
  }
}

module.exports = {
  sunburstLogin
};
