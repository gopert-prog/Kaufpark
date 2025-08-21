const express = require('express');
const bcrypt = require('bcryptjs');
const { requireRole } = require('../middleware/auth');
const { findUserByUsername, listPendingRequests, updateRequestStatus } = require('../db');

const router = express.Router();

router.get('/login', (req, res) => {
  res.render('operator/login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = findUserByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash) || user.role !== 'operator') {
    return res.render('operator/login', { error: 'Credenciales inválidas' });
  }
  req.session.user = { id: user.id, username: user.username, role: user.role };
  res.redirect(303, '/operator');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/operator/login');
  });
});

router.get('/', requireRole('operator'), (req, res) => {
  const requests = listPendingRequests();
  res.render('operator/panel', { user: req.session.user, requests });
});

// Some clients may follow redirects keeping POST; support POST as well
router.post('/', requireRole('operator'), (req, res) => {
  const requests = listPendingRequests();
  res.render('operator/panel', { user: req.session.user, requests });
});

router.post('/requests/:id/status', requireRole('operator'), (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!['PENDIENTE','EN_PROCESO','FINALIZADO'].includes(status)) {
    return res.status(400).send('Estado inválido');
  }
  updateRequestStatus(id, status);
  res.redirect('/operator');
});

module.exports = router;

