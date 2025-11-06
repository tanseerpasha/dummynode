const axios = require('axios');

const username = process.env.SUNBURST_USERNAME;
const password = process.env.SUNBURST_PASSWORD;
const auth = Buffer.from(`${username}:${password}`).toString("base64");

async function sunburstLogin(rememberMe = false) {
  try {
    const response = await axios.post(
      "https://sunburst.sunsetwx.com/v1/login",
      new URLSearchParams({
        grant_type: "password",
        ...(rememberMe && { type: "remember_me" }),
      }).toString(),
      {
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 10000, // 10 seconds
      }
    );

    return { token: response.data, error: "" }; // ✅ success case
  } catch (error) {
    let message = "Unknown error";

    if (error.code === "ECONNABORTED") {
      message = "Request timed out";
    } else if (error.response) {
      message = `HTTP ${error.response.status}: ${
        error.response.data?.error_description || "Server error"
      }`;
    } else if (error.request) {
      message = "No response from server";
    } else {
      message = error.message;
    }

    console.error("Sunburst login failed:", message);
    return { token: null, error: message }; // ✅ structured error for iOS
  }
}

module.exports = { sunburstLogin };
