/* ==========================================================
   Кофейня «Зерно» — скрипты
   ========================================================== */

/* ---------- Мобильное меню ---------- */
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
const header = document.getElementById('header');

function setNav(open) {
  // меню тянется от шапки до низа экрана; пока видна плашка концепта, шапка сдвинута вниз
  if (open) {
    document.documentElement.style.setProperty('--nav-top', `${header.getBoundingClientRect().bottom}px`);
  }
  nav.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  document.body.classList.toggle('nav-open', open);
}

burger.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));

// закрываем меню при переходе по ссылке и по Escape
nav.querySelectorAll('a, button').forEach((link) => link.addEventListener('click', () => setNav(false)));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setNav(false);
});
window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => {
  if (e.matches) setNav(false);
});

/* ---------- Тень у шапки при прокрутке ---------- */
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

/* ---------- Ненастоящие контакты (концепт) ---------- */
const toast = document.getElementById('toast');
let toastTimer;

document.querySelectorAll('[data-demo]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    toast.textContent = 'Это демо';
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
  });
});

/* ---------- Форма заказа на мероприятие ---------- */
const eventForm = document.getElementById('event-form');

if (eventForm) {
  const fields = {
    name: eventForm.elements.name,
    phone: eventForm.elements.phone,
    comment: eventForm.elements.comment,
    website: eventForm.elements.website,
    consent: eventForm.elements.consent,
  };
  const submitBtn = eventForm.querySelector('.event-form__submit');
  const status = eventForm.querySelector('.event-form__status');

  // то же правило, что и в worker/telegram-form.js
  const isPhoneValid = (value) => {
    const digits = value.replace(/\D/g, '');
    return /^[+\d\s()-]+$/.test(value) && digits.length >= 10 && digits.length <= 15;
  };

  const setError = (field, message) => {
    const error = document.getElementById(`${field.id}-error`);
    field.setAttribute('aria-invalid', String(Boolean(message)));
    if (message) field.setAttribute('aria-describedby', error.id);
    else field.removeAttribute('aria-describedby');
    error.textContent = message;
  };

  const validate = () => {
    const errors = [
      [fields.name, fields.name.value.trim() ? '' : 'Как к вам обращаться?'],
      [fields.phone, isPhoneValid(fields.phone.value.trim()) ? '' : 'Укажите телефон, например +7 900 000-00-00'],
      [fields.consent, fields.consent.checked ? '' : 'Нужно согласие, чтобы мы могли связаться с вами'],
    ];
    errors.forEach(([field, message]) => setError(field, message));
    const firstInvalid = errors.find(([, message]) => message);
    if (firstInvalid) firstInvalid[0].focus();
    return !firstInvalid;
  };

  const setStatus = (text, type) => {
    status.textContent = text;
    status.classList.toggle('is-success', type === 'success');
    status.classList.toggle('is-error', type === 'error');
  };

  // ошибка исчезает, как только поле исправлено
  [fields.name, fields.phone, fields.consent].forEach((field) => {
    field.addEventListener(field.type === 'checkbox' ? 'change' : 'input', () => {
      if (field.getAttribute('aria-invalid') === 'true') setError(field, '');
    });
  });

  eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', '');
    if (!validate()) return;

    const endpoint = eventForm.dataset.endpoint;
    if (!endpoint) {
      setStatus('Форма пока не подключена — заявка не отправлена.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляем…';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name.value.trim(),
          phone: fields.phone.value.trim(),
          comment: fields.comment.value.trim(),
          website: fields.website.value,
          consent: fields.consent.checked,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      eventForm.reset();
      setStatus('Спасибо! Заявка отправлена, скоро свяжемся с вами.', 'success');
    } catch {
      setStatus('Не получилось отправить заявку. Попробуйте ещё раз через минуту.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Отправить заявку';
    }
  });
}

/* ---------- Год в футере ---------- */
document.querySelector('[data-year]').textContent = new Date().getFullYear();
