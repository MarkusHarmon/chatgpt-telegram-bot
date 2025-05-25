export default {
  async fetch(request: Request, env: Record<string, string>): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const update = await request.json();
    const message = update?.message?.text;
    const chatId = update?.message?.chat?.id;

    if (!message || !chatId) {
      return new Response("No message or chat ID", { status: 200 });
    }

    // Проверка разрешенного пользователя (если указан)
    const allowed = env.AUTHORIZED_USER;
    if (allowed && !allowed.split(",").includes(String(chatId))) {
      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "❌ Access denied. You are not authorized to use this bot."
        }),
      });
      return new Response("Unauthorized user", { status: 200 });
    }

    // Запрос в OpenAI
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.OPENAI_API_MODEL || "gpt-4o",
        messages: [{ role: "user", content: message }],
      }),
    });

    const gpt = await completion.json();
    const reply = gpt.choices?.[0]?.message?.content || "⚠️ No reply from GPT";

    // Ответ в Telegram
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: reply,
      }),
    });

    return new Response("OK", { status: 200 });
  }
};
