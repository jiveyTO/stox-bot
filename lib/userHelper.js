const { sign, verify } = require('jsonwebtoken')

const secret = process.env.SECRET

const signJWT = (payload) => {
  const jwt = sign(payload, secret, { expiresIn: '1h' })
  return jwt
}

const verifyJWT = (token) => {
  const tokenDecoded = verify(token, secret, function (err, decoded) {
    if (token && !err && decoded) {
      console.log('jwt token looks good:', decoded)
      return decoded
    } else {
      console.log('jwt token error:', err)
      return false
    }
  })

  return tokenDecoded
}

// returns decoded token or false
const getUser = (token) => {
  if (!token) return {}

  return verifyJWT(token)
}
exports.getUser = getUser

const generateUserModel = ({ user }) => ({
  login: (email, password) => {
    if (email !== 'stox@test.com' || password !== 'rudy123') return false
    return signJWT({ email: email })
  },
  loggedIn: () => {
    if (!user || !user.name) return false
    return true
  }
})

exports.generateUserModel = generateUserModel
