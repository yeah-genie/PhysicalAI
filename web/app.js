import {planar2R} from './data.js';

const motion = document.querySelector('.motion-toggle');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = preference.matches;
function applyMotion() {
  document.body.classList.toggle('motion-reduced', reduced);
  motion?.setAttribute('aria-pressed', String(reduced));
  document.dispatchEvent(new CustomEvent('motionchange', {detail: {reduced}}));
}
applyMotion();
motion?.addEventListener('click', () => { reduced = !reduced; applyMotion(); });
preference.addEventListener('change', event => { reduced = event.matches; applyMotion(); });

const theta1 = document.querySelector('#theta1');
const theta2 = document.querySelector('#theta2');
if (theta1 && theta2) {
  const updatePose = () => {
    const a = Number(theta1.value), b = Number(theta2.value);
    const {elbow, tip} = planar2R(a, b);
    const e = [220 + elbow[0] * 90, 220 - elbow[1] * 90];
    const p = [220 + tip[0] * 90, 220 - tip[1] * 90];
    document.querySelector('#arm-links').setAttribute('d', `M220 220L${e.join(' ')}L${p.join(' ')}`);
    for (const [id, point] of [['elbow', e], ['tip', p], ['configuration-point', [60 + a / 360 * 320, 380 - b / 360 * 320]]]) {
      document.getElementById(id).setAttribute('cx', point[0]);
      document.getElementById(id).setAttribute('cy', point[1]);
    }
    document.querySelector('#theta1-value').textContent = `${a}°`;
    document.querySelector('#theta2-value').textContent = `${b}°`;
    document.querySelector('#tip-position').textContent = `x = ${tip[0].toFixed(2)}, y = ${tip[1].toFixed(2)}`;
    document.querySelector('#configuration-label').textContent = `q = (${a}°, ${b}°)`;
  };
  theta1.addEventListener('input', updatePose);
  theta2.addEventListener('input', updatePose);
  updatePose();
}

const slides = [...document.querySelectorAll('.slide')];
if (slides.length) {
  const frame = document.querySelector('#deck-frame');
  const deck = document.querySelector('.deck');
  const chapterLinks = [...document.querySelectorAll('.chapter-nav a')];
  const previous = document.querySelector('.previous-slide');
  const next = document.querySelector('.next-slide');
  const presentation = frame.hasAttribute('data-fixed-deck') ? {matches: true}
    : matchMedia('(min-width: 1180px) and (min-height: 660px)');
  let active = -1, pending = false;

  function update(index) {
    if (active === index) return;
    active = index;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    chapterLinks.forEach((link, i) => link.setAttribute('aria-current', String(i === index)));
    document.querySelector('.slide-progress').textContent = `${index + 1} / ${slides.length} · ${slides[index].dataset.title}`;
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    document.dispatchEvent(new CustomEvent('deckchange', {detail: {index}}));
  }
  function current() {
    const bounds = deck.getBoundingClientRect();
    const center = presentation.matches ? bounds.top + bounds.height / 2 : innerHeight / 2;
    const index = slides.findIndex(slide => {
      const rect = slide.getBoundingClientRect();
      return rect.top <= center && rect.bottom > center;
    });
    if (index >= 0) update(index);
  }
  function go(index, instant = false) {
    slides[index]?.scrollIntoView({behavior: reduced || instant ? 'instant' : 'smooth', block: 'start'});
  }
  function fit() {
    const changed = document.documentElement.classList.contains('presentation') !== presentation.matches;
    document.documentElement.classList.toggle('presentation', presentation.matches);
    frame.style.transform = presentation.matches
      ? `translate(-50%,-50%) scale(${Math.min(innerWidth / 1280, innerHeight / 720)})` : '';
    if (changed && active >= 0) go(active, true);
    current();
  }
  const onScroll = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; current(); });
  };
  deck.addEventListener('scroll', onScroll, {passive: true});
  addEventListener('scroll', onScroll, {passive: true});
  addEventListener('resize', fit);
  previous.addEventListener('click', () => go(active - 1));
  next.addEventListener('click', () => go(active + 1));
  chapterLinks.forEach((link, i) => link.addEventListener('click', event => {
    event.preventDefault();
    history.replaceState(null, '', link.hash);
    go(i);
  }));
  addEventListener('keydown', event => {
    if (event.target.closest('a,button,input,select,textarea') || event.altKey || event.ctrlKey || event.metaKey) return;
    let index;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) index = Math.min(slides.length - 1, active + 1);
    if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) index = Math.max(0, active - 1);
    if (event.key === 'Home') index = 0;
    if (event.key === 'End') index = slides.length - 1;
    if (index !== undefined) { event.preventDefault(); go(index); }
  });
  update(0);
  fit();
  const anchor = slides.findIndex(slide => `#${slide.id}` === location.hash);
  if (anchor >= 0) go(anchor, true);
}
