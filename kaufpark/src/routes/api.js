const express = require('express');
const { listPendingRequests } = require('../db');

const router = express.Router();

router.get('/requests/pending', (_req, res) => {
  res.json({ data: listPendingRequests() });
});

module.exports = router;

