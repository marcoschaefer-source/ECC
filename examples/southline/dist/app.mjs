import { SERVICES, LOCATIONS, validateInquiry, createSummary, createMailto, getRecommendation } from './inquiry.mjs';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const arrowPaths = { '↗': 'M5 19 19 5M5 5h14v14', '↓': 'M12 3v18m-7-7 7 7 7-7', '→': 'M3 12h18m-7-7 7 7-7 7' };
$$('span[aria-hidden="true"]').forEach(span => {
  const pathData = arrowPaths[span.textContent.trim()];
  if (!pathData) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'arrow-icon');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(svg.namespaceURI, 'path');
  path.setAttribute('d', pathData); svg.append(path); span.replaceChildren(svg);
});
const form = $('#inquiry-form');
let step = 1;
let lastDraft = '';

const serviceDetails = {
  wrapping: { title: 'Car Wrapping', description: 'Ein neuer Look, ganz nach Ihrer Vorstellung. Ob komplette Farbveränderung, einzelne Akzente oder ein individuelles Design: Wir besprechen mit Ihnen die passende Umsetzung.', points: ['Voll- und Teilfolierungen für einen individuellen Auftritt', 'Unterschiedliche Farben, Oberflächen und Designs', 'Persönliche Abstimmung von Material, Umfang und Pflege'] },
  lackschutz: { title: 'Lackschutz / PPF', description: 'Schutz dort, wo Ihr Fahrzeug ihn braucht. Spezielle Lackschutzfolien können die Oberfläche vor Steinschlag und anderen äußeren Einflüssen schützen.', points: ['Schutz für besonders beanspruchte Fahrzeugflächen', 'Umfang passend zu Ihrem Fahrzeug und dessen Nutzung', 'Individuelle Beratung zu Material und Verarbeitung'] },
  scheibentoenung: { title: 'Scheibentönung', description: 'Ein stimmiger Look und mehr Privatsphäre. Wir beraten Sie zur passenden Tönung Ihrer Fahrzeugscheiben und setzen die Folierung fachgerecht um.', points: ['Abgestimmte Optik für Ihr Fahrzeug', 'Sicht- und Sonnenschutz für mehr Komfort', 'Beratung zu geeigneten Folien und zulässigen Anwendungen'] },
  werbetechnik: { title: 'Werbetechnik', description: 'Machen Sie Ihre Marke sichtbar. Vom einzelnen Schriftzug bis zur großflächigen Fahrzeugwerbung begleiten wir Ihren Auftritt vom Entwurf bis zur Montage.', points: ['Fahrzeugbeschriftung und Digitaldruck', 'Schilder und Werbeanlagen für innen und außen', 'Schaufensterbeklebung und Bandenwerbung'] },
  gebaeude: { title: 'Gebäudefolien', description: 'Große Glasflächen bringen Licht in Räume. Mit der passenden Folie lässt sich ihre Wirkung gezielt verändern – für mehr Privatsphäre oder einen angenehmeren Sonnenschutz.', points: ['Sichtschutz für Büro, Gewerbe und private Räume', 'Sonnen- und Wärmeschutz für geeignete Glasflächen', 'Beratung zu Sicherheitsfolien und Einsatzmöglichkeiten'] },
  interieur: { title: 'Interior Wrapping', description: 'Neue Oberflächen, neue Wirkung. Folien eröffnen Möglichkeiten, vorhandene Möbel und Räume gestalterisch aufzufrischen.', points: ['Möbel, Küchenfronten und Türen neu gestalten', 'Folierungen für geeignete Wand- und Fliesenflächen', 'Materialauswahl nach gewünschtem Look und Untergrund'] },
};

function toggleMenu(open) {
  $('#main-nav').classList.toggle('open', open);
  $('.menu-toggle').setAttribute('aria-expanded', String(open));
  $('.menu-toggle').setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
}
$('.menu-toggle').addEventListener('click', () => toggleMenu($('.menu-toggle').getAttribute('aria-expanded') !== 'true'));
$$('#main-nav a').forEach(link => link.addEventListener('click', () => toggleMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || $('.menu-toggle').getAttribute('aria-expanded') !== 'true') return;
  toggleMenu(false);
  $('.menu-toggle').focus();
});
document.addEventListener('click', event => { if (!event.target.closest('.header')) toggleMenu(false); });
window.matchMedia('(min-width:801px)').addEventListener('change', event => { if (event.matches) toggleMenu(false); });

function closeDialog(dialog) { dialog.close(); document.body.classList.remove('modal-open'); }
$$('dialog').forEach(dialog => {
  $('.dialog-close', dialog).addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeDialog(dialog);
  });
});
function openDialog(dialog) { document.body.classList.add('modal-open'); dialog.showModal(); }
$$('[data-detail]').forEach(button => button.addEventListener('click', () => {
  const id = button.dataset.detail;
  const detail = serviceDetails[id];
  $('#detail-title').textContent = detail.title;
  $('#detail-description').textContent = detail.description;
  $('#detail-points').replaceChildren(...detail.points.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
  $('#detail-inquiry').dataset.service = id;
  openDialog($('#service-dialog'));
}));
$('#privacy-open').addEventListener('click', () => openDialog($('#privacy-dialog')));

const projects = {
  wrap: { title: 'Von dezent zu unverwechselbar.', description: 'VW Transporter · Vollfolierung & Fahrzeugbeschriftung', before: 'wrap-before.webp', after: 'wrap-after.webp', beforeAlt: 'Vorher: silberner VW Transporter ohne Beschriftung', afterAlt: 'Nachher: dunkelgrüner VW Transporter mit Schubert-Beschriftung' },
  print: { title: 'Eine Marke kommt auf die Straße.', description: 'Transporter · Digitaldruck & Fahrzeugwerbung', before: 'print-before.webp', after: 'print-after.webp', beforeAlt: 'Vorher: weißer Transporter in der Southline-Werkstatt', afterAlt: 'Nachher: Transporter mit schwarzer und grüner F100-Fahrzeugwerbung' },
  glass: { title: 'Kleines Detail. Neue Wirkung.', description: 'SUV · Scheibentönung der hinteren Fahrzeugfenster', before: 'glass-before.webp', after: 'glass-after.webp', beforeAlt: 'Vorher: hintere SUV-Seitenscheiben ohne Tönung', afterAlt: 'Nachher: hintere SUV-Seitenscheiben mit Tönung' },
};
const range = $('#compare-range');
range.addEventListener('input', () => $('#comparison').style.setProperty('--split', `${range.value}%`));
$$('[data-project]').forEach(button => button.addEventListener('click', () => {
  const project = projects[button.dataset.project];
  $$('[data-project]').forEach(tab => { tab.classList.toggle('active', tab === button); tab.setAttribute('aria-pressed', String(tab === button)); });
  $('#before-image').src = `assets/${project.before}`;
  $('#after-image').src = `assets/${project.after}`;
  $('#before-image').alt = project.beforeAlt;
  $('#after-image').alt = project.afterAlt;
  $('#project-title').textContent = project.title;
  $('#project-description').textContent = project.description;
  range.value = '50';
  $('#comparison').style.setProperty('--split', '50%');
}));

SERVICES.forEach(service => {
  const label = document.createElement('label');
  label.className = 'service-option';
  const input = document.createElement('input');
  input.type = 'radio'; input.name = 'service'; input.value = service.id; input.required = true;
  input.setAttribute('aria-describedby', 'service-error');
  const text = document.createElement('span'); text.textContent = service.title;
  label.append(input, text); $('#service-options').append(label);
});

function getData() { return Object.fromEntries(new FormData(form)); }
function setError(field, message = '') {
  const output = $(`#${field}-error`);
  if (output) output.textContent = message;
  $$(`[name="${field}"]`, form).forEach(input => {
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  });
}
function validateFields(fields) {
  const errors = validateInquiry(getData());
  fields.forEach(field => setError(field, errors[field]));
  const firstError = fields.find(field => errors[field]);
  if (firstError) $(`[name="${firstError}"]`, form)?.focus();
  return !firstError;
}
function renderSelectionSummary() {
  const data = getData();
  const service = SERVICES.find(item => item.id === data.service);
  const location = LOCATIONS.find(item => item.id === data.location);
  $('#inquiry-summary').textContent = `Leistung: ${service?.title || 'Noch offen'}\nStandort: ${location?.title || 'Noch offen'}\nZeitraum: ${data.timeline || 'Noch offen'}\n\n${data.project || ''}`;
}
function showStep(next, focus = true) {
  step = next;
  $$('.form-step').forEach(panel => { panel.hidden = Number(panel.dataset.step) !== next; });
  $$('.steps li').forEach((item, index) => {
    item.classList.toggle('current', index === next - 1);
    item.classList.toggle('complete', index < next - 1);
    if (index === next - 1) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
  });
  if (next === 3) renderSelectionSummary();
  if (focus) {
    const legend = $(`.form-step[data-step="${next}"] legend`);
    legend.tabIndex = -1; legend.focus({ preventScroll: true });
    $('.inquiry-panel').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
  }
}
function updateService(id) {
  const selected = $(`input[name="service"][value="${id}"]`, form);
  if (!selected) return;
  selected.checked = true;
  setError('service');
  $('#recommendation').hidden = false;
  $('#recommendation p').textContent = getRecommendation(id);
  const building = ['gebaeude', 'interieur'].includes(id);
  $('#project').placeholder = building ? 'Welche Oberflächen oder Glasflächen möchten Sie verändern? Ungefähre Maße und gewünschte Wirkung …' : 'Zum Beispiel: Audi A5, Baujahr 2021, Vollfolierung in Mattgrau …';
  $('#project-hint').textContent = building ? 'Beschreiben Sie Oberfläche, ungefähre Fläche und gewünschtes Ergebnis.' : 'Fahrzeugmodell oder Fläche, gewünschter Look und besondere Wünsche.';
  $('#mail-fallback').hidden = true;
}
form.addEventListener('change', event => {
  if (event.target.name === 'service') updateService(event.target.value);
  if (event.target.name) setError(event.target.name);
  $('#mail-fallback').hidden = true;
});
form.addEventListener('input', event => {
  if (event.target.name) setError(event.target.name);
  $('#mail-fallback').hidden = true;
});
$('#detail-inquiry').addEventListener('click', event => {
  updateService(event.currentTarget.dataset.service);
  showStep(1, false);
  closeDialog($('#service-dialog'));
});
$('#step-one-next').addEventListener('click', () => { if (validateFields(['service'])) showStep(2); });
$('#step-two-next').addEventListener('click', () => { if (validateFields(['location', 'project', 'timeline'])) showStep(3); });
$$('[data-back]').forEach(button => button.addEventListener('click', () => showStep(Number(button.dataset.back))));
form.addEventListener('submit', event => {
  event.preventDefault();
  if (step === 1) { $('#step-one-next').click(); return; }
  if (step === 2) { $('#step-two-next').click(); return; }
  if (!validateFields(['service', 'location', 'project', 'timeline', 'name', 'email', 'phone'])) return;
  const data = getData();
  lastDraft = createSummary(data);
  const location = LOCATIONS.find(item => item.id === data.location);
  $('#recipient-link').textContent = location.email;
  $('#recipient-link').href = `mailto:${location.email}`;
  $('#copy-status').textContent = '';
  $('#copy-fallback').hidden = true;
  $('#mail-fallback').hidden = false;
  $('#inquiry-summary').textContent = lastDraft;
  const draftLink = document.createElement('a');
  draftLink.href = createMailto(data);
  draftLink.target = '_blank';
  draftLink.rel = 'noopener noreferrer';
  document.body.append(draftLink);
  draftLink.click();
  draftLink.remove();
});
$('#copy-inquiry').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(lastDraft);
    $('#copy-status').textContent = 'Anfrage kopiert. Sie können den Text jetzt in Ihre E-Mail einfügen.';
  } catch {
    const fallback = $('#copy-fallback');
    fallback.value = lastDraft; fallback.hidden = false;
    fallback.focus(); fallback.select();
    $('#copy-status').textContent = 'Bitte kopieren Sie den markierten Text manuell.';
  }
});
$('#year').textContent = String(new Date().getFullYear());
