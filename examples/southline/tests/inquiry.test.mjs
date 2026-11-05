import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SERVICES, LOCATIONS, validateInquiry, createSummary, createMailto, getRecommendation,
} from '../dist/inquiry.mjs';

const valid = Object.freeze({
  service: 'wrapping', location: 'ingolstadt',
  project: 'Mein VW soll eine matte Vollfolierung erhalten.',
  name: 'Müller & Söhne', email: 'kontakt@example.de',
  phone: '+49 841 123456', timeline: 'Nach Absprache',
});

test('the public catalog exposes all six services and only the verified recipients', () => {
  assert.deepEqual(SERVICES.map(({ id }) => id), [
    'wrapping', 'lackschutz', 'scheibentoenung', 'werbetechnik', 'gebaeude', 'interieur',
  ]);
  assert.ok(SERVICES.every(({ title, description }) => title && description));
  assert.deepEqual(LOCATIONS.map(({ email }) => email), [
    'info@southline-folientechnik.de', 'info@slftm.de',
  ]);
  assert.ok(Object.isFrozen(SERVICES) && Object.isFrozen(SERVICES[0]));
  assert.ok(Object.isFrozen(LOCATIONS) && Object.isFrozen(LOCATIONS[0]));
});

test('a valid inquiry passes without modifying the data', () => {
  assert.deepEqual(validateInquiry(valid), {});
  assert.equal(valid.name, 'Müller & Söhne');
});

test('missing and wrong-shaped inputs yield useful required-field errors', () => {
  for (const input of [undefined, null, 42, [], 'text', {}]) {
    const errors = validateInquiry(input);
    for (const field of ['service', 'location', 'project', 'name', 'email']) {
      assert.equal(typeof errors[field], 'string');
      assert.ok(errors[field].length > 5);
    }
  }
});

test('service and location use explicit allowlists', () => {
  for (const service of ['unknown', '__proto__', '', 1, null]) {
    assert.ok(validateInquiry({ ...valid, service }).service);
  }
  for (const location of ['elsewhere', '__proto__', 'info@attacker.example', null]) {
    assert.ok(validateInquiry({ ...valid, location }).location);
  }
});

test('text boundaries are accepted exactly and reject oversized or undersized values', () => {
  for (const [field, min, max] of [['project', 8, 1500], ['name', 2, 100]]) {
    for (const length of [min, max]) {
      assert.equal(validateInquiry({ ...valid, [field]: 'x'.repeat(length) })[field], undefined);
    }
    for (const value of ['x'.repeat(min - 1), 'x'.repeat(max + 1), '   ', {}, 44]) {
      assert.ok(validateInquiry({ ...valid, [field]: value })[field]);
    }
  }
});

test('email validation rejects missing addresses, controls and oversized text', () => {
  for (const email of ['', '   ', 'invalid', 'a@b', 'a b@host.de', '<a@host.de>',
    'a@host.de\r\nBcc:evil@host.de', 'x'.repeat(245) + '@example.de', {}, 23]) {
    assert.ok(validateInquiry({ ...valid, email }).email, String(email));
  }
  for (const email of ['name+tag@example.de', ' Müller@example.de ', 'x'.repeat(242) + '@example.de']) {
    assert.equal(validateInquiry({ ...valid, email }).email, undefined);
  }
});

test('optional fields may be omitted but are bounded and type checked', () => {
  const { phone, timeline, ...required } = valid;
  assert.deepEqual(validateInquiry(required), {});
  assert.deepEqual(validateInquiry({ ...required, phone: '', timeline: '' }), {});
  for (const [field, max] of [['phone', 50], ['timeline', 100]]) {
    assert.equal(validateInquiry({ ...valid, [field]: 'x'.repeat(max) })[field], undefined);
    for (const value of ['x'.repeat(max + 1), null, {}, 12]) {
      assert.ok(validateInquiry({ ...valid, [field]: value })[field]);
    }
  }
});

test('single-line fields reject header injection and unsafe controls', () => {
  for (const field of ['name', 'email', 'phone', 'timeline']) {
    for (const suffix of ['\nBcc: evil@example.de', '\r', '\u0000', '\u007f']) {
      assert.ok(validateInquiry({ ...valid, [field]: valid[field] + suffix })[field]);
    }
  }
  assert.ok(validateInquiry({ ...valid, project: 'Ein Projekt\u0000 mit Steuerzeichen' }).project);
  assert.deepEqual(validateInquiry({ ...valid, project: 'Farbe: Grün\nFinish: matt\r\nTürgriffe: schwarz' }), {});
});

test('the summary includes choices, contact information and Unicode literally', () => {
  const summary = createSummary(valid);
  for (const expected of ['Car Wrapping', 'Ingolstadt', valid.name, valid.email,
    valid.phone, valid.timeline, valid.project]) assert.ok(summary.includes(expected), expected);
  assert.ok(!summary.includes('undefined'));
  const { phone, timeline, ...required } = valid;
  const minimal = createSummary(required);
  assert.ok(!minimal.includes('undefined'));
  assert.ok(!minimal.includes('Telefon:'));
  assert.ok(!minimal.includes('Zeitraum:'));
});

test('summary trims field boundaries and preserves intentional project line breaks', () => {
  const data = { ...valid, name: '  Lea Özdemir  ', project: '  Grün & matt\nMit Akzenten.  ' };
  const summary = createSummary(data);
  assert.ok(summary.includes('Name: Lea Özdemir\n'));
  assert.ok(summary.includes('Grün & matt\nMit Akzenten.'));
  assert.ok(!summary.includes('  Lea'));
});

test('mailto fixes the recipient by location and encodes Unicode and query delimiters', () => {
  const data = { ...valid, project: 'Grün & matt? 50% = schön #1\nÄnderung: Größe + 2', location: 'muenchen' };
  const href = createMailto(data);
  assert.ok(href.startsWith('mailto:info@slftm.de?'));
  const params = new URLSearchParams(href.split('?')[1]);
  assert.deepEqual([...params.keys()], ['subject', 'body']);
  assert.ok(params.get('subject').includes('Car Wrapping'));
  assert.equal(params.get('body'), createSummary(data));
  assert.ok(!href.includes('\n') && !href.includes('\r') && !href.includes('Müller'));
  assert.ok(createMailto(valid).startsWith('mailto:info@southline-folientechnik.de?'));
});

test('malicious-looking input remains body text, never an additional recipient', () => {
  const data = { ...valid, project: 'Bitte mailto:evil@example.de?bcc=evil@example.de &subject=Überraschung %0Abcc:evil@example.de' };
  const href = createMailto(data);
  const params = new URLSearchParams(href.split('?')[1]);
  assert.equal(params.get('bcc'), null);
  assert.deepEqual([...params.keys()], ['subject', 'body']);
  assert.ok(params.get('body').includes(data.project));
});

test('invalid inquiries cannot produce an email draft or misleading summary', () => {
  for (const input of [null, {}, { ...valid, location: 'external' }, { ...valid, name: 'A\nBcc: x@y.de' }]) {
    assert.throws(() => createMailto(input), /Anfrage/);
    assert.throws(() => createSummary(input), /Anfrage/);
  }
});

test('recommendations are useful for every service and safe for an unknown selection', () => {
  for (const { id } of SERVICES) assert.ok(getRecommendation(id).length > 30);
  for (const id of [undefined, null, 'unknown', '__proto__']) {
    assert.match(getRecommendation(id), /Leistung/);
  }
});
