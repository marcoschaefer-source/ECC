# Southline Website-Entwurf

Eigenständige, responsive Website für Southline Werbe- & Folientechnik. Statische HTML-, CSS- und JavaScript-Dateien; keine Build-Abhängigkeiten, Datenbank oder Tracking-Dienste.

## Lokal ansehen

```sh
cd examples/southline
npm run dev
```

Anschließend `http://localhost:4173` öffnen. Alternativ `dist/` mit einem beliebigen statischen Webserver ausliefern. ES-Module benötigen einen Webserver; `file://` eignet sich nicht.

## Verhalten

- Sechs Leistungsbereiche mit Detaildialogen und direkter Vorauswahl im Anfrage-Assistenten.
- Drei echte Vorher-Nachher-Projekte, bedienbar per Maus, Touch und Tastatur.
- Dreistufige Anfrage: Leistung, Projekt und Standort, Kontakt und Zusammenfassung.
- Die Anfrage öffnet einen E-Mail-Entwurf beim passenden Standort. Versand erfolgt durch den Besucher im eigenen Mailprogramm. Kopierfunktion mit manuellem Fallback.
- Keine Speicherung von Formulardaten, kein automatischer Versand und keine KI-API. Der Assistent verzweigt anhand der ausgewählten Leistung.
- Schriften und Bilder lokal, externe Anbieter werden nur durch angeklickte Links geöffnet.

## Prüfen

```sh
npm test
```

Die Logiktests prüfen Pflichtfelder, Grenzwerte, erlaubte Leistungen/Standorte, Unicode, feste Empfänger und sichere Mailto-Kodierung. Browserprüfung siehe `docs/quality.md`.

## Entwurfsstatus

Der Entwurf ist mit `noindex` gekennzeichnet. Die bestehende Kundendomain bleibt unverändert. Vor einem öffentlichen Kundenlaunch sind insbesondere Bildnutzungsrechte, aktuelle Kontaktdaten, endgültiges Impressum und eine zum produktiven Hosting passende Datenschutzerklärung abzustimmen. Rechtstexte der bisherigen Website sind verlinkt; der lokale Datenschutzhinweis beschreibt diesen Entwurf.

Quellen und Bildherkunft: `docs/content-sources.md`. Marken und Projektbilder gehören ihren jeweiligen Rechteinhabern. Manrope und Barlow Condensed werden unter SIL Open Font License selbst gehostet; Lizenztexte in `docs/licenses/`.
