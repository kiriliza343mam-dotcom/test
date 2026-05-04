const express = require('express');
const cors = require('cors');

const app = express();

// ✅ правильный порт для Railway
const PORT = process.env.PORT || 3001;

// ✅ middleware
app.use(cors());
app.use(express.json());

// временное хранилище
let requests = [];

// 🔹 проверка сервера (очень полезно)
app.get('/', (req, res) => {
  res.send('Server is working 🚀');
});

// 🔹 отправка заявки
app.post('/request', (req, res) => {
  const { name, contact, problem } = req.body;

  // простая валидация
  if (!name || !contact || !problem) {
    return res.status(400).json({
      success: false,
      message: 'Заполните все поля'
    });
  }

  const newRequest = {
    id: Date.now(),
    name,
    contact,
    problem,
    createdAt: new Date()
  };

  requests.push(newRequest);

  console.log('📩 Новая заявка:', newRequest);

  res.json({ success: true });
});

// 🔹 получение всех заявок
app.get('/requests', (req, res) => {
  res.json(requests);
});

// 🔹 запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});

// 🔹 удаление заявки
app.delete('/request/:id', (req, res) => {
  const id = Number(req.params.id);

  requests = requests.filter(r => r.id !== id);

  res.json({ success: true });
});