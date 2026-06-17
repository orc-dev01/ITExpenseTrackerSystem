const store = require('../store/dummy-store');

function createAccessToken(user) {
  return Buffer.from(
    JSON.stringify({
      userId: user.id,
      issuedAt: new Date().toISOString()
    })
  ).toString('base64url');
}

function readAccessToken(token) {
  try {
    return JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [, token] = header.split(' ');
  const payload = token ? readAccessToken(token) : null;
  const user = payload ? store.findUserById(payload.userId) : null;

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
