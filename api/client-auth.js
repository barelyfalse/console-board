const uuid = require('uuid').v4
const crypto = require('../utils/cryptMethods')

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate')
  res.cookie('sid', uuid(), {sameSite: 'none', secure: true, maxAge: 9000000000, httpOnly: true })

  const cookies = Object.keys(req.cookies).length > 0 ? req.cookies : {}

  if (cookies.hasOwnProperty('uid')) {
    //TOOD: Validate uid
    if (cookies.hasOwnProperty('state')) {
      try {
        crypto.decryptState(cookies.state)
      } catch (error) {
        console.log(error)
        res.clearCookie('uid')
        res.clearCookie('state')
        res.clearCookie('uname')
        res.status(200).json({error: 'Error: Bad state. Intenta recargar la página.'}).end()
      }
      res.status(200).json({uid: cookies.uid}).end()
    } else {
      res.clearCookie('uname')
      res.cookie('state', crypto.encryptState('lobby').concatenned, {sameSite: 'none', secure: true, maxAge: 9000000000, httpOnly: true })
      res.status(200).json({uid: cookies.uid}).end()
    }
  } else {
    //generate everything
    res.clearCookie('uname')
    res.cookie('uid', uuid(), {sameSite: 'none', secure: true, maxAge: 9000000000, httpOnly: true })
    res.cookie('state', crypto.encryptState('lobby').concatenned, {sameSite: 'none', secure: true, maxAge: 9000000000, httpOnly: true })
    res.status(200).json({uid: cookies.uid}).end()
  }
};