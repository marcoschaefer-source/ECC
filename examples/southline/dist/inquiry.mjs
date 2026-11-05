/** Browser-local inquiry model. It creates a draft URL; it never sends or stores data. */
export const SERVICES = Object.freeze([
  { id: 'wrapping', title: 'Car Wrapping', description: 'Ein neuer Look für Ihr Fahrzeug – von einzelnen Akzenten bis zur Vollfolierung.' },
  { id: 'lackschutz', title: 'Lackschutz', description: 'Transparente Schutzfolie für beanspruchte Fahrzeugflächen und den Originallack.' },
  { id: 'scheibentoenung', title: 'Scheibentönung', description: 'Mehr Privatsphäre und ein stimmiger Look mit professioneller Scheibenfolierung.' },
  { id: 'werbetechnik', title: 'Werbetechnik', description: 'Fahrzeugbeschriftung, Digitaldruck und Werbeanlagen für einen sichtbaren Auftritt.' },
  { id: 'gebaeude', title: 'Gebäudefolien', description: 'Sichtschutz und Sonnenschutz für Fenster in Wohn- und Geschäftsräumen.' },
  { id: 'interieur', title: 'Interieurfolierung', description: 'Neue Oberflächen für Möbel, Küchen, Türen, Wände und Fliesen.' },
].map((service) => Object.freeze(service)));

export const LOCATIONS = Object.freeze([
  { id: 'ingolstadt', title: 'Ingolstadt', email: 'info@southline-folientechnik.de', phone: '+4984193178143' },
  { id: 'muenchen', title: 'München', email: 'info@slftm.de', phone: '+4981027289471' },
].map((location) => Object.freeze(location)));

const RECOMMENDATIONS = Object.freeze({
  wrapping: 'Nennen Sie uns Fahrzeugmodell, Baujahr und Ihre Wunschfarbe. Matt, glänzend oder ein individuelles Design? Gemeinsam finden wir den passenden Look.',
  lackschutz: 'Nennen Sie uns Fahrzeugmodell und Baujahr sowie die gewünschten Schutzflächen, zum Beispiel Frontpartie oder das gesamte Fahrzeug.',
  scheibentoenung: 'Nennen Sie uns Fahrzeugmodell und Baujahr sowie Ihre Wünsche an Sichtschutz und Optik. Wir beraten Sie zur passenden, zulässigen Folierung.',
  werbetechnik: 'Was möchten Sie sichtbar machen? Beschreiben Sie Fahrzeug, Schaufenster oder Werbeanlage, ungefähre Maße und ob ein Logo oder Entwurf vorhanden ist.',
  gebaeude: 'Geht es um Sonnenschutz oder Sichtschutz? Beschreiben Sie Einsatzort, Fensterflächen und ungefähre Maße für eine gezielte Beratung.',
  interieur: 'Beschreiben Sie die Oberflächen und ungefähren Maße. Welche Farbe oder Materialoptik wünschen Sie sich für Möbel, Küche, Türen oder Wände?',
});

const SINGLE_LINE_CONTROLS = /[\u0000-\u001f\u007f]/u;
const PROJECT_CONTROLS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/u;
const text = (value) => typeof value === 'string' ? value.trim() : '';
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function checkText(value, { min = 0, max, label, multiline = false, optional = false }) {
  if (optional && value === undefined) return '';
  if (typeof value !== 'string') return `Bitte geben Sie ${label} als Text an.`;
  if ((multiline ? PROJECT_CONTROLS : SINGLE_LINE_CONTROLS).test(value)) {
    return `Bitte geben Sie ${label} ohne ungültige Steuerzeichen ein.`;
  }
  const length = value.trim().length;
  if (length < min || length > max) return `Bitte geben Sie ${label} mit ${min} bis ${max} Zeichen an.`;
  return '';
}

/** Returns field-specific German messages; an empty object means valid. */
export function validateInquiry(data) {
  const values = isRecord(data) ? data : {};
  const checks = {
    service: SERVICES.some(({ id }) => id === values.service) ? '' : 'Bitte wählen Sie eine Leistung aus.',
    location: LOCATIONS.some(({ id }) => id === values.location) ? '' : 'Bitte wählen Sie einen Standort aus.',
    project: checkText(values.project, { min: 8, max: 1500, label: 'Ihr Projekt', multiline: true }),
    name: checkText(values.name, { min: 2, max: 100, label: 'Ihren Namen' }),
    email: checkText(values.email, { min: 3, max: 254, label: 'Ihre E-Mail-Adresse' })
      || (EMAIL.test(text(values.email)) ? '' : 'Bitte geben Sie eine gültige E-Mail-Adresse an.'),
    phone: checkText(values.phone, { max: 50, label: 'Ihre Telefonnummer', optional: true }),
    timeline: checkText(values.timeline, { max: 100, label: 'den gewünschten Zeitraum', optional: true }),
  };
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => message));
}

function requireValidInquiry(data) {
  if (Object.keys(validateInquiry(data)).length > 0) {
    throw new TypeError('Die Anfrage ist unvollständig oder enthält ungültige Angaben.');
  }
}

export function createSummary(data) {
  requireValidInquiry(data);
  const service = SERVICES.find(({ id }) => id === data.service);
  const location = LOCATIONS.find(({ id }) => id === data.location);
  return [
    'Projektanfrage an Southline', '',
    `Leistung: ${service.title}`, `Standort: ${location.title}`,
    ...(text(data.timeline) ? [`Zeitraum: ${text(data.timeline)}`] : []),
    '', 'Mein Projekt:', text(data.project), '',
    `Name: ${text(data.name)}`, `E-Mail: ${text(data.email)}`,
    ...(text(data.phone) ? [`Telefon: ${text(data.phone)}`] : []),
  ].join('\n');
}

/** The recipient and subject prefix are fixed by the verified catalog. */
export function createMailto(data) {
  const body = createSummary(data);
  const location = LOCATIONS.find(({ id }) => id === data.location);
  const service = SERVICES.find(({ id }) => id === data.service);
  const subject = `Projektanfrage · ${service.title} · ${text(data.name)}`;
  return `mailto:${location.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function getRecommendation(serviceId) {
  return typeof serviceId === 'string' && Object.hasOwn(RECOMMENDATIONS, serviceId)
    ? RECOMMENDATIONS[serviceId]
    : 'Wählen Sie eine Leistung aus. Wir zeigen Ihnen, welche Angaben uns bei der Beratung helfen.';
}
