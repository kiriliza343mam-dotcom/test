const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let requests = [];

// отправка заявки
app.post('/request', (req, res) => {
  const newRequest = {
    id: Date.now(),
    ...req.body
  };

  requests.push(newRequest);

  console.log('Новая заявка:', newRequest);

  res.json({ success: true });
});

// получение заявок
app.get('/requests', (req, res) => {
  res.json(requests);
});

app.listen(3001, () => {
  console.log('🚀 Server started on http://localhost:3001');
});