const express = require("express")
const jwt = require('jsonwebtoken')
const fs = require('fs')
const app = express()
const { createTable, saveOrUpdateToken,getTokenFromDb } = require("./dbService");
const { sunburstLogin } = require("./sunburstApi");

//below to show response in post query
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const PORT = process.env.PORT || 3030;

// dummy functions 
app.get('/', (req, res) => {
  res.send("Hello World")
})


app.post('/', (req, res) => {
  res.send('This is a post response')
})

// dummy functions  ends

app.get('/getSunburstTokenFromDb', (req, res) => {
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



app.get('/getSunburstTokenFromApi', (req, res) => {
  (async () => {
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
  })();
})



const privateKey = fs.readFileSync('AuthKey_L38ADHKU82.p8')

// {
//   sub: 'com.pa.myweatherkit',
//   issuer: 'T4W24SQJKG',
//   expiresIn: '1hr',
//   keyid: 'L38ADHKU82',
//   algorithm: 'ES256',
//   hId: 'T4W24SQJKG.com.pa.myweatherkit'
// }

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
});