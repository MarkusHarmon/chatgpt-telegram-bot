export default {
  async fetch(request, env, ctx) {
    return new Response("Бот работает. Установите Telegram TOKEN и API KEY через переменные окружения.");
  }
};
