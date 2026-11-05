# Qualitätsprüfung

## Prüfumfang

Die Website wurde lokal in Chromium bei 1440 × 900 und 390 × 844 visuell geprüft. Zusätzliche Überlaufprüfung bei 320, 390, 768 und 1440 Pixel Breite. Die automatisierte Browserprüfung liegt in `tests/browser.mjs`.

```sh
npm run dev
# In einem zweiten Terminal; Playwright und Chromium müssen verfügbar sein:
npm run test:browser
```

Optionale Umgebungsvariablen: `PLAYWRIGHT_MODULE` für den Importpfad der vorhandenen Playwright-Installation, `CHROMIUM_PATH` für eine vorhandene Browserdatei, `BASE_URL` für den lokalen Server und `QA_OUTPUT_DIR` für lokale Prüfartefakte. Browser und Playwright sind nur Entwicklungswerkzeuge; die Website selbst braucht keine Pakete.

## Geprüfte Abläufe

- Lokale Bilder und Schriften laden; keine JavaScript-Fehler oder fehlgeschlagenen Asset-Anfragen.
- Sprunglink, Beschriftungen, sichtbare Fokusanzeige, native Dialoge und Escape-Verhalten.
- Mobile Navigation und reduzierte Bewegung.
- Leistungsdialog mit Vorauswahl und passenden Hinweisen im Anfrage-Assistenten.
- Pflichtfeldfehler und Fokus auf das erste fehlerhafte Feld.
- Vor- und Zurücknavigation mit Erhalt der bisherigen Eingaben.
- Gültige Standortanfrage mit korrektem Empfänger und kodierter E-Mail-Vorlage.
- Die Ursprungsseite und die Kopiermöglichkeit bleiben auch ohne eingerichtetes E-Mail-Programm verfügbar.
- Projektwechsel, `aria-pressed`-Zustände und Vergleichsregler per Tastatur.
- FAQ und Datenschutzhinweis.

`npm test`: 14 Logiktests bestanden, 100 % Zeilen-, Zweig- und Funktionsabdeckung des reinen Anfragemoduls. Diese Abdeckung gilt nicht für die gesamte Benutzeroberfläche. Keine serverseitigen Integrationsprüfungen erforderlich: kein eigener Server, kein Versanddienst, keine Datenbank.

## Grenzen

Kein tatsächlicher E-Mail-Versand getestet oder ausgelöst. Kein Test auf physischen Mobilgeräten oder mit Screenreader; keine vollständige WCAG-Zertifizierung. Der Browserlauf ist eine Funktions- und Layoutprüfung mit zusätzlicher Codeprüfung. Screenshots und das lokale ECC-Evidence-Protokoll bleiben außerhalb des Repositorys.
