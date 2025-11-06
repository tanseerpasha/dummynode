require('dotenv').config();
const express = require("express")
const jwt = require('jsonwebtoken')
const fs = require('fs')
const app = express()
const { createTable, saveOrUpdateToken, getTokenFromDb } = require("./dbService");
const { sunburstLogin } = require("./sunburstApi");

//below to show response in post query
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const PORT = process.env.PORT;
const KEY = process.env.TOKEN_KEY;

// dummy functions 
app.get('/', (req, res) => {
  res.send("Hello World")
})


app.post('/', (req, res) => {
  res.send('This is a post response')
})

// dummy functions  ends

app.get('/getSunburstTokenFromDbOld', (req, res) => {

  (async () => {
    const token = await getTokenFromDb("Sunburst"); // Pass true for remember_me
    if (token) {
      // console.log("Access Token DB:", token);
      var data = {
        'result': token,
      }
      res.send(data)


    } else {
      // console.log("Failed to retrieve access token.");
      res.send("")
    }
  })();
})

app.post("/getSunburstTokenFromDb", async (req, res) => {
  try {
    const key = req.body.key;
    console.log("getSunburstTokenFromDb.", key);

    if (key !== KEY) {
      return res.status(401).json({ error: "Invalid key" });
    }

    const token = await getTokenFromDb("Sunburst");

    if (token) {
      return res.json({ result: token });
    } else {
      return res.status(404).json({ error: "No cached token found" });
    }
  } catch (err) {
    console.error("getSunburstTokenFromDb failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post('/getSunburstTokenFromApi', async (req, res) => {
  try {
    const key = req.body.key;
    console.log("getSunburstTokenFromApi.", key);

    if (key !== KEY) {
      return res.status(401).json({ error: "Invalid key" });
    }

    const token = await sunburstLogin(true); // Pass true for remember_me

    if (token && token.access_token) {
      await saveOrUpdateToken("Sunburst", token.access_token, token.expires_in);

      return res.json({ result: token.access_token });
    } else {
      return res.status(400).json({ error: "Failed to retrieve access token." });
    }

  } catch (err) {
    console.error("getSunburstTokenFromApi failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post('/getSunburstTokenFromApiOld', (req, res) => {

  (async () => {
    const key = req.body.key
    console.log("getSunburstTokenFromApi.", key)
    if (key == KEY) {
      const token = await sunburstLogin(true); // Pass true for remember_me
      if (token) {
        await saveOrUpdateToken("Sunburst", token.access_token, token.expires_in)
        // console.log("Access Token API1:", token);
        var data = {
          'result': token.access_token,
        }
        res.send(data)


      } else {
        // console.log("Failed to retrieve access token.");
        res.send(0)
      }
    } else {
      res.send(0)
    }

  })();
})


const privateKey = fs.readFileSync('AuthKey_L38ADHKU82.p8')
app.post('/getToken', (req, res) => {
  const body = req.body
  const token = jwt.sign({
    sub: body.sub
  }, privateKey, {
    // jwtid: 'T4W24SQJKG.com.pa.myweatherkit',
    issuer: body.issuer,
    expiresIn: body.expiresIn,
    keyid: body.keyid,
    algorithm: body.algorithm,
    header: {
      id: body.hId
    }
  })

  var data = {
    'result': token,
  }
  res.send(data)
  // res.send(token)
  // console.log(token)
})

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
  if (PORT == 3030) {
    console.log("USERNAME", process.env.SUNBURST_USERNAME);
    console.log("PASSWORD", process.env.SUNBURST_PASSWORD);
    console.log("URL", process.env.DATABASE_INTERNAL_URL);
    console.log("TOKEN_KEY", KEY);
  }
});