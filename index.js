const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// 🔐 PostgreSQL (Railway)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(cors());
app.use(express.json());

// допустимые статусы
const ALLOWED_STATUSES = ['new', 'in_progress', 'done'];

// 🔹 проверка
app.get('/', (req, res) => {
  res.send('Server is working 🚀');
});

// 🔥 создаём таблицу
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        contact TEXT NOT NULL,
        problem TEXT NOT NULL,
        status TEXT DEFAULT 'new',
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

// 🔄 изменение статуса
app.put('/request/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      error: 'Invalid status',
      allowed: ALLOWED_STATUSES
    });
  }

  try {
    const result = await pool.query(
      'UPDATE requests SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log(`🔄 Статус обновлён: id=${id}, status=${status}`);

    res.json({
      success: true,
      request: result.rows[0]
    });

  } catch (err) {
    console.error('❌ UPDATE error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// 🔹 удаление
app.delete('/request/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM requests WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log(`🗑 Удалена заявка id=${id}`);

    res.json({ success: true });

  } catch (err) {
    console.error('❌ DELETE error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});