const express = require("express")
const jwt = require('jsonwebtoken')
const fs = require('fs')
const axios = require('axios')
const app = express()
//below to show response in post query
app.use(express.json())
app.use(express.urlencoded({extended: true}))
const PORT = process.env.PORT || 3030;

const privateKey = fs.readFileSync('AuthKey_L38ADHKU82.p8')



// your code

app.get('/', (req, res) => {
  res.send("Hello World")
})


app.post('/', (req, res) => {
  res.send('This is a post response')
})


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
  res.send(token)
  // console.log(token)
})

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});