const slides = [...document.querySelectorAll('.slide')];
const reduced = () => document.body.classList.contains('motion-reduced');
const headings = new Map();
for (const slide of slides) {
  const heading = slide.querySelector('h1,h2');
  if (!heading) continue;
  heading.setAttribute('aria-label', heading.innerText);
  const visual = document.createElement('span');
  visual.className = 'typing-visual'; visual.setAttribute('aria-hidden', 'true');
  for (const node of [...heading.childNodes]) {
    if (node.nodeName === 'BR') { visual.append(document.createElement('br')); continue; }
    for (const letter of Array.from(node.textContent)) {
      const char = document.createElement('span'); char.className = 'typed-char';
      char.textContent = letter; visual.append(char);
    }
  }
  heading.replaceChildren(visual);
  headings.set(slide, {heading, chars: [...visual.querySelectorAll('.typed-char')]});
}
let frame, current;
function finish() {
  cancelAnimationFrame(frame);
  if (!current) return;
  current.heading.classList.remove('is-typing');
  current.chars.forEach(char => {char.style.visibility = ''; char.classList.remove('typing-caret');});
}
function type(slide) {
  finish(); current = headings.get(slide);
  if (!current || reduced()) return;
  const {heading, chars} = current;
  heading.classList.add('is-typing');
  chars.forEach(char => char.style.visibility = 'hidden');
  const start = performance.now(), duration = Math.min(1050, Math.max(450, chars.length * 38));
  let count = 0;
  function tick(now) {
    const next = Math.min(chars.length, Math.floor((now - start) / duration * chars.length));
    if (next > count) {
      chars[count - 1]?.classList.remove('typing-caret');
      for (let i = count; i < next; i++) chars[i].style.visibility = '';
      chars[next - 1]?.classList.add('typing-caret'); count = next;
    }
    if (count < chars.length) frame = requestAnimationFrame(tick); else finish();
  }
  frame = requestAnimationFrame(tick);
}
document.addEventListener('deckchange', e => type(slides[e.detail.index]));
document.addEventListener('motionchange', finish);
document.querySelectorAll('[data-slide-target]').forEach(button => button.addEventListener('click', () => {
  const target = document.getElementById(button.dataset.slideTarget);
  history.replaceState(null, '', `#${target.id}`);
  target.scrollIntoView({behavior: reduced() ? 'instant' : 'smooth', block:'start'});
}));
type(document.querySelector('.slide.is-active'));
