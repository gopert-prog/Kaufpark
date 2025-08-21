const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { requireRole } = require('../middleware/auth');
const { findUserByUsername, setConfig, getConfig, listAllRequests, getStats } = require('../db');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'videos');
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = `ad_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, safe);
  }
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('video/')) return cb(new Error('Solo videos')); 
    cb(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.get('/login', (req, res) => {
  res.render('admin/login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = findUserByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash) || user.role !== 'admin') {
    return res.render('admin/login', { error: 'Credenciales inválidas' });
  }
  req.session.user = { id: user.id, username: user.username, role: user.role };
  res.redirect(303, '/admin');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

router.get('/', requireRole('admin'), (req, res) => {
  const currentVideoUrl = getConfig('ad_video_url') || null;
  const stats = getStats();
  res.render('admin/dashboard', { user: req.session.user, currentVideoUrl, stats });
});

router.post('/', requireRole('admin'), (req, res) => {
  const currentVideoUrl = getConfig('ad_video_url') || null;
  const stats = getStats();
  res.render('admin/dashboard', { user: req.session.user, currentVideoUrl, stats });
});

router.post('/upload', requireRole('admin'), upload.single('video'), (req, res) => {
  const relPath = `/public/uploads/videos/${path.basename(req.file.path)}`;
  setConfig('ad_video_url', relPath);
  res.redirect('/admin');
});

router.get('/requests', requireRole('admin'), (_req, res) => {
  const requests = listAllRequests();
  res.render('admin/requests', { requests });
});

module.exports = router;

