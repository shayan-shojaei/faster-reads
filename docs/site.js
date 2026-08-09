const source =
  'Ideas become easier to follow when every word gives your eyes a clear place to begin.';
const ratios = { light: 0.35, medium: 0.5, strong: 0.65 };
const root = document.querySelector('#demo-text');
const buttons = document.querySelectorAll('[data-intensity]');

function render(intensity) {
  root.replaceChildren();
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
  for (const item of segmenter.segment(source)) {
    if (!item.isWordLike || item.segment.length < 2) {
      root.append(document.createTextNode(item.segment));
      continue;
    }
    const graphemes = Array.from(
      new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(item.segment),
      (part) => part.segment,
    );
    const length = Math.min(
      graphemes.length - 1,
      Math.max(1, Math.ceil(graphemes.length * ratios[intensity])),
    );
    const strong = document.createElement('strong');
    strong.textContent = graphemes.slice(0, length).join('');
    root.append(strong, document.createTextNode(graphemes.slice(length).join('')));
  }
  buttons.forEach((button) =>
    button.setAttribute('aria-checked', String(button.dataset.intensity === intensity)),
  );
}

buttons.forEach((button) =>
  button.addEventListener('click', () => render(button.dataset.intensity)),
);
render('medium');
