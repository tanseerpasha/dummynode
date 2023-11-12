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

const token = jwt.sign({
  sub: 'com.pa.myweatherkit'
}, privateKey, {
  // jwtid: 'T4W24SQJKG.com.pa.myweatherkit',
  issuer: 'T4W24SQJKG',
  expiresIn: '1hr',
  keyid: 'L38ADHKU82',
  algorithm: 'ES256',
  header: {
      id: 'T4W24SQJKG.com.pa.myweatherkit'
  }
})

app.get('/token', async (req, res) =>{
  console.log(privateKey)
  console.log(token)
  console.log("tanseer")

  const url = 'https://weatherkit.apple.com/api/v1/availability/37.323/122.032'

  const configuration = {
      headers: {Authorization : 'Bearer ' + token}
  }


  const result = await axios.get(url, configuration)
  res.send(token)

})


// your code

app.get('/', (req, res) => {
  res.send("Hello World")
})


app.post('/', (req, res) => {
  res.send('This is a post response')
})


//ensure json is slected in postman
//body/raw/json
app.post('/api/customer', (req, res) => {
  res.send(req.body)
  console.log(req.body)
})

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});