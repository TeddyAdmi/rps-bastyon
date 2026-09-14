const dotenv = require('dotenv');
dotenv.config();

/**
 * Функция отправки PKOIN с центрального кошелька (выплата/возврат)
 */
async function sendPkoin(toAddress, amount) {
  const privKey = process.env.CENTRAL_WALLET_PRIVKEY;
  if (!privKey) {
    console.error("[ERROR] CENTRAL_WALLET_PRIVKEY не задан в переменных окружения!");
    return null;
  }

  console.log(`[PKOIN OUT] Отправка ${amount} PKOIN на адрес ${toAddress}`);

  try {
    // В продакшене здесь подставляется вызов ноды Pocketnet/Bastyon
    const fakeTxId = "tx_" + Math.random().toString(36).substring(2, 15);
    return { success: true, txid: fakeTxId };
  } catch (err) {
    console.error(`[ERROR] Ошибка отправки PKOIN:`, err);
    throw err;
  }
}

module.exports = { sendPkoin };
