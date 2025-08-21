const path = require('path');
const express = require('express');
const router = express.Router();
const { getConfig, recordScan, createServiceRequest } = require('../db');

// Landing via QR: /spot/:spot
router.get(['/','/spot/:spot'], (req, res) => {
  const spot = req.params.spot || req.query.spot || 'SIN-PLAZA';
  const videoUrl = getConfig('ad_video_url') || 'https://www.w3schools.com/html/mov_bbb.mp4';
  if (spot) {
    recordScan(spot);
  }
  res.render('client/landing', { spot, videoUrl });
});

router.post('/request', (req, res) => {
  const { spot } = req.body;
  if (!spot) {
    return res.status(400).send('Plaza no válida');
  }
  createServiceRequest(spot);
  res.render('client/confirm', { spot });
});

module.exports = router;

