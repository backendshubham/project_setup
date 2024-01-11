// jwtVarifyToken.js
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.headers.token;

  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }

  jwt.verify(token, 'aaaabbbbcccc', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = decoded.data; // Add the user ID to the request for later use
    next();
  });
}
  
module.exports = {
  verifyToken,
};
