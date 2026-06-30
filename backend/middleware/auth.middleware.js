const jwt = require('jsonwebtoken');
const store = require('../store');

function createAccessToken(user) {
  const payload = {
    userId: user.id
  };

  if (process.env.JWT_SECRET) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });
  }

  return Buffer.from(JSON.stringify({ ...payload, issuedAt: new Date().toISOString() })).toString('base64url');
}

function readAccessToken(token) {
  if (process.env.JWT_SECRET) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return null;
    }
  }

  try {
    return JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [, token] = header.split(' ');
  const payload = token ? readAccessToken(token) : null;
  const user = payload ? await store.findUserById(payload.userId) : null;

  if (!user) {
    return res.status(401).json({ message: 'Authentication is required.' });
  }

  req.user = user;
  return next();
}

function requireAnyRole(roles) {
  return (req, res, next) => {
    if (req.user?.roles?.some((role) => roles.includes(role))) {
      return next();
    }

    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  };
}

module.exports = {
  createAccessToken,
  requireAuth,
  requireAnyRole
};
