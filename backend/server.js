require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { sendPkoin } = require('./wallet');

const app = express();
app.use(cors());
app.use(express.json());

// 10 комнат и ставки в PKOIN
const ROOM_RATES = {
  1: 0,       // Бесплатная
  2: 0.2,     // 0.2 PKOIN
  3: 0.5,     // 0.5 PKOIN
  4: 1.0,     // 1.0 PKOIN
  5: 2.0,     // 2.0 PKOIN
  6: 3.0,     // 3.0 PKOIN
  7: 4.0,     // 4.0 PKOIN
  8: 5.0,     // 5.0 PKOIN
  9: 10.0,    // 10.0 PKOIN
  10: 50.0    // 50.0 PKOIN
};

let games = [];

// Получить список комнат
app.get('/api/rooms', (req, res) => {
  res.json({ rates: ROOM_RATES, games });
});

// Создать игру
app.post('/api/games/create', async (req, res) => {
  const { roomId, playerAddress, moveHash, txId } = req.body;
  const numRoomId = Number(roomId);

  if (ROOM_RATES[numRoomId] === undefined) {
    return res.status(400).json({ error: 'Неверный номер комнаты' });
  }

  const rate = ROOM_RATES[numRoomId];

  const newGame = {
    id: 'game_' + Date.now(),
    roomId: numRoomId,
    amount: rate,
    player1: {
      address: playerAddress,
      moveHash: moveHash,
      txId: txId || null
    },
    player2: null,
    status: 'WAITING_FOR_OPPONENT',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Таймер 24 часа
  };

  games.push(newGame);
  console.log(`[GAME CREATED] Создана игра ${newGame.id} в комнате №${numRoomId}`);
  
  res.json({ success: true, game: newGame });
});

// Автоматический возврат по тайм-ауту (каждые 15 минут)
cron.schedule('*/15 * * * *', async () => {
  const now = new Date();
  console.log('[CRON] Проверка просроченных игр...');

  for (let game of games) {
    if (game.status === 'WAITING_FOR_OPPONENT' && new Date(game.expiresAt) < now) {
      console.log(`[EXPIRED] Время игры ${game.id} истекло. Возврат ${game.amount} PKOIN игроку ${game.player1.address}`);

      try {
        if (game.amount > 0) {
          await sendPkoin(game.player1.address, game.amount);
        }
        game.status = 'EXPIRED_REFUNDED';
      } catch (err) {
        console.error(`[CRON ERROR] Ошибка возврата для ${game.id}:`, err);
      }
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
