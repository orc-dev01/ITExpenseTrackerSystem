const express = require('express');
const store = require('../store/dummy-store');
const { createAccessToken, requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = store.findUserByEmail(email);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  return res.json({
    accessToken: createAccessToken(user),
    refreshToken: `dummy-refresh-${user.id}`,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    user: store.publicUser(user)
  });
});

router.post('/logout', (_req, res) => {
  return res.status(204).send();
});

router.post('/refresh', requireAuth, (req, res) => {
  return res.json({
    accessToken: createAccessToken(req.user),
    refreshToken: `dummy-refresh-${req.user.id}`,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    user: store.publicUser(req.user)
  });
});

router.get('/me', requireAuth, (req, res) => {
  return res.json(store.publicUser(req.user));
});

module.exports = router;
