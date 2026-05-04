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

// 🔥 создаём таблицу (правильно — через async)
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        contact TEXT NOT NULL,
        problem TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ DB ready');
  } catch (err) {
    console.error('❌ DB init error:', err);
  }
};

initDB();

// 🔹 отправка заявки
app.post('/request', async (req, res) => {
  let { name, contact, problem } = req.body;

  // 🔧 чистим данные
  name = name?.trim();
  contact = contact?.trim();
  problem = problem?.trim();

  if (!name || !contact || !problem) {
    return res.status(400).json({
      success: false,
      message: 'Заполните все поля'
    });
  }

  try {
    const result = await pool.query(
      'INSERT INTO requests (name, contact, problem) VALUES ($1, $2, $3) RETURNING *',
      [name, contact, problem]
    );

    console.log('📩 Новая заявка:', result.rows[0]);

    res.json({
      success: true,
      request: result.rows[0]
    });
  } catch (err) {
    console.error('❌ POST error:', err);
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
    console.error('❌ GET error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// 🔹 удаление заявки
app.delete('/request/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    await pool.query('DELETE FROM requests WHERE id = $1', [id]);

    res.json({ success: true });
  } catch (err) {
    console.error('❌ DELETE error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// 🔹 запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});