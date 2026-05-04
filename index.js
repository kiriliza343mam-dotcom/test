const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// 🔐 подключение к PostgreSQL (Railway)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ✅ middleware
app.use(cors());
app.use(express.json());

// 🔹 проверка сервера
app.get('/', (req, res) => {
  res.send('Server is working 🚀');
});

// 🔥 создаём таблицу (если нет)
pool.query(`
  CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    name TEXT,
    contact TEXT,
    problem TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// 🔹 отправка заявки
app.post('/request', async (req, res) => {
  const { name, contact, problem } = req.body;

  if (!name || !contact || !problem) {
    return res.status(400).json({
      success: false,
      message: 'Заполните все поля'
    });
  }

  try {
    await pool.query(
      'INSERT INTO requests (name, contact, problem) VALUES ($1, $2, $3)',
      [name, contact, problem]
    );

    console.log('📩 Новая заявка:', name);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// 🔹 получение заявок
app.get('/requests', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM requests ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// 🔹 удаление заявки
app.delete('/request/:id', async (req, res) => {
  const id = req.params.id;

  try {
    await pool.query('DELETE FROM requests WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// 🔹 запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});