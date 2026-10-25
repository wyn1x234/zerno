/**
 * Cloudflare Worker: принимает заявку с формы «Заказ на мероприятие»
 * и пересылает её в Telegram. Токен бота хранится здесь, в секретах Worker,
 * а не в коде сайта — иначе любой посетитель смог бы управлять ботом.
 *
 * Переменные окружения (Settings → Variables and Secrets):
 *   BOT_TOKEN       — секрет, токен бота от @BotFather
 *   CHAT_ID         — секрет, id чата, куда слать заявки
 *   ALLOWED_ORIGINS — адреса сайта через запятую, например https://wyn1x234.github.io
 */

const LIMITS = { name: 100, phone: 20, comment: 1000 };

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] || '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply({ ok: false, error: 'method_not_allowed' }, 405, cors);

    // заявки принимаем только с нашего сайта
    if (!allowed.includes(origin)) return reply({ ok: false, error: 'forbidden_origin' }, 403, cors);

    let data;
    try {
      data = await request.json();
    } catch {
      return reply({ ok: false, error: 'bad_json' }, 400, cors);
    }

    // заполненное поле-ловушку видят только боты: делаем вид, что всё хорошо, и ничего не шлём
    if (data.website) return reply({ ok: true }, 200, cors);

    const name = clean(data.name, LIMITS.name);
    const phone = clean(data.phone, LIMITS.phone);
    const comment = clean(data.comment, LIMITS.comment);

    if (!name || !isPhoneValid(phone) || data.consent !== true) {
      return reply({ ok: false, error: 'invalid_fields' }, 422, cors);
    }

    const text = [
      '<b>☕ Заявка на мероприятие</b>',
      '',
      `<b>Имя:</b> ${escapeHtml(name)}`,
      `<b>Телефон:</b> ${escapeHtml(phone)}`,
      `<b>Комментарий:</b> ${comment ? escapeHtml(comment) : '—'}`,
      '',
      `Согласие на обработку ПДн: да · ${escapeHtml(origin)}`,
    ].join('\n');

    const tg = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: 'HTML' }),
    });

    if (!tg.ok) {
      console.log('Telegram error', tg.status, await tg.text()); // видно в Logs у Worker
      return reply({ ok: false, error: 'telegram_failed' }, 502, cors);
    }
    return reply({ ok: true }, 200, cors);
  },
};

// то же правило, что и в js/main.js
function isPhoneValid(value) {
  const digits = value.replace(/\D/g, '');
  return /^[+\d\s()-]+$/.test(value) && digits.length >= 10 && digits.length <= 15;
}

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function reply(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
  });
}
