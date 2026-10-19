/* ==========================================================
   Кофейня «Зерно» — скрипты
   ========================================================== */

/* ---------- Мобильное меню ---------- */
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

function setNav(open) {
  nav.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  document.body.classList.toggle('nav-open', open);
}

burger.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));

// закрываем меню при переходе по ссылке и по Escape
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setNav(false)));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setNav(false);
});
window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => {
  if (e.matches) setNav(false);
});

/* ---------- Тень у шапки при прокрутке ---------- */
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Фильтр меню ---------- */
const tabs = document.querySelectorAll('.tab');
const items = document.querySelectorAll('.menu-item');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const filter = tab.dataset.filter;

    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });

    items.forEach((item) => {
      item.hidden = filter !== 'all' && item.dataset.cat !== filter;
    });
  });
});

/* ---------- Открыто / закрыто ---------- */
const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};
const formatTime = (time) => time.replace(/^0/, '');

const hourRows = [...document.querySelectorAll('.hours__row')];
const findRow = (day) => hourRows.find((row) => row.dataset.days.split(',').map(Number).includes(day));

function updateStatus() {
  const now = new Date();
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const today = findRow(day);

  hourRows.forEach((row) => row.classList.toggle('is-today', row === today));
  if (!today) return;

  const open = toMinutes(today.dataset.open);
  const close = toMinutes(today.dataset.close);
  const isOpen = minutes >= open && minutes < close;

  let text;
  if (isOpen) {
    const left = close - minutes;
    text = left <= 60
      ? `Открыто ещё ${left} мин — успейте за кофе`
      : `Сейчас открыто, до ${formatTime(today.dataset.close)}`;
  } else if (minutes < open) {
    text = `Закрыто · откроемся сегодня в ${formatTime(today.dataset.open)}`;
  } else {
    const tomorrow = findRow((day + 1) % 7);
    text = `Закрыто · откроемся завтра в ${formatTime(tomorrow.dataset.open)}`;
  }

  document.querySelectorAll('[data-status]').forEach((el) => {
    el.classList.toggle('is-open', isOpen);
    el.classList.toggle('is-closed', !isOpen);
    el.querySelector('[data-status-text]').textContent = text;
  });
}

updateStatus();
setInterval(updateStatus, 60 * 1000);

/* ---------- Плавное появление блоков ---------- */
const revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

/* ---------- Год в футере ---------- */
document.querySelector('[data-year]').textContent = new Date().getFullYear();
