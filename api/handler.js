const app = require('express')();
const { v4 } = require('uuid');

app.get('/api/handler', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
  res.status(200).json({nomas: 'nomasxd'})
});

module.exports = app;
