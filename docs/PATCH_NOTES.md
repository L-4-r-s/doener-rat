# Dönerrat Marburg – Patch Notes

Stand: 19.10.2026 · Zur Veröffentlichung vorbereitet

Der handgemachte Look bleibt erhalten. Dieses Update verbessert die Rangliste, ergänzt drei Bewertungen und schafft eine gemeinsame Grundlage für die weitere Arbeit an der Seite.

Die [vier Kurzvideos für den Gruppenchat](videos/README.md) zeigen Rangliste, neue Bewertungen, Statusfilter und Scrollverhalten in der lokalen Vorschau auf Handy und Desktop.

## Design und Bedienung

- Das Gruppenbild, das beim Herunterscrollen im Hintergrund erschien, wurde entfernt. Der Marburg-Hintergrund bleibt erhalten.
- Der Scroll-Effekt, durch den Seiteninhalte beim Weiterscrollen verschwanden, wurde entfernt.
- Auf dem Handy bleiben Preise auch in der kompakten Ansicht sichtbar. Über eine Sortierauswahl lässt sich die Liste nach Name, Gesamtwertung, Preis oder Besuchsdatum ordnen.
- Besuchsdaten erscheinen direkt in der Rangliste und auf den jeweiligen Bewertungsseiten.
- Restaurants erhalten die Kennzeichnung „Bewertet“, „Demnächst“ oder „Geschlossen“. Ein Filter zeigt die gewünschte Gruppe; die Ergebnisanzahl und eine Meldung bei leerer Suche helfen bei der Orientierung.
- Offizielle Platzierungen bleiben beim Suchen, Filtern und Umsortieren gleich. Gleiche Gesamtwertungen teilen sich einen Platz. Geschlossene und noch unbewertete Läden erhalten keinen aktuellen Rang; geschlossene Läden stehen am Ende der Liste.
- Preise und andere Zahlen werden numerisch sortiert. Fehlende Werte stehen hinten. Die Sortierung über Tabellenüberschriften funktioniert auch per Tastatur.
- Die Gesamtwertung wird in Liste und Detailansicht einheitlich mit einer Nachkommastelle angezeigt. Die genauere gespeicherte Wertung bleibt erhalten.

## Neue Bewertungen

| Laden | Besuch | Einzelbewertungen | Gesamt auf der Seite | Fotos |
| --- | --- | --- | --- | --- |
| Uni Döner | 24.07.2026 | 5 | 6,2 / 10 | 5 |
| Euro Döner und Tenders | 18.08.2026 | 8 | 4,3 / 10 | 6 |
| Somat | 21.09.2026 | 5 | 6,8 / 10 | 3 |

- Alle drei Bewertungen enthalten die fertigen Texte des Rats. Der Wortlaut wurde übernommen; angepasst wurden nur Markdown-Absätze und Überschriften.
- Insgesamt wurden 14 Originalfotos ergänzt. Die Bilder wurden unverändert übernommen.
- Alle drei Bewertungsseiten haben eingebettete Google Maps mit überprüften Adressen: Uni Döner am Pilgrimstein 31, Euro Döner und Tenders am Pilgrimstein 25 und Somat am Lahntor 5. Die [Adressquellen](review-sources/maps-locations.md) sind dokumentiert.
- Royal Döner Kebab und Pizzahaus ist als geschlossen markiert. Der Laden wurde nie bewertet und erhält deshalb weder eine Bewertung noch einen Rang.
- Die Standangabe der Rangliste wurde auf September 2026 gesetzt, passend zum jüngsten Besuch.

## Berechnung der neuen Bewertungen

- Die Gesamtwertung ist der Mittelwert der persönlichen Gesamteindrücke. Jede Kategorie wird aus den dafür tatsächlich abgegebenen Noten berechnet.
- Fehlende Noten werden ausgelassen. Ausdrücklich vergebene 0 Punkte für Zeit und Service zählen mit. Gemessene Wartezeiten werden nicht als Punktwerte verwendet.
- Preise verwenden Eurobeträge, Mengen verwenden Gramm. Zusätzlich notierte Preis- und Mengenpunkte gehen nicht als Geldbetrag oder Gewicht ein.
- Uni Döner berücksichtigt alle fünf Bewertungen einschließlich der Falafelbestellung. Alle hatten dasselbe Brot; das besonders gelobte Sesam gehört zu dieser gemeinsamen Brotsorte.
- Bei Euro Döner wurde das unleserliche Gewicht als 425 g bestätigt. Auch der Falafeldöner kostete 5 €. Die korrigierte persönliche Gesamtwertung zählt; der Gesamtmittelwert bleibt als 4,25 gespeichert. Alle acht Zeitnoten bleiben bei 0.
- Bei Somat fehlt für eine Bestellung die Zeitnote. Aus den vier vorhandenen Noten ergibt sich 4,5. Die Service-0 zählt mit; die Bestellung ohne Fleisch wird bei der Fleisch-/Füllungswertung ausgelassen.
- Die Rohwerte und Rechenwege stehen in den Quellen zu [Uni Döner](review-sources/uni-doener-2026-07-24.md), [Euro Döner](review-sources/euro-doener-2026-08-18.md) und [Somat](review-sources/somat-2026-09-21.md).

## Entwicklung und Zusammenarbeit

- Das Projekt wurde nach `JeremiaHenkel/doener-rat` geforkt. Änderungen liegen auf separaten Branches für die spätere Prüfung per Pull Request.
- Die Seite läuft jetzt mit Astro, TypeScript und Tailwind über Vite. Gemeinsame Vorlagen für Layout, Hintergrund und Footer erleichtern Änderungen an mehreren Seiten.
- Ein lokaler Entwicklungsserver mit automatischem Neuladen, ein Produktionsbuild und eine lokale Build-Vorschau sind eingerichtet.
- Bestehende `.html`-Adressen, Bild- und Reviewzuordnungen sowie die Firebase-Integration für Kommentare und Community-Bewertungen bleiben erhalten.
- Der [Beitragsleitfaden](REVIEWS.md) erklärt Einrichtung, neue Reviews, Fotos, Karten sowie das Hinzufügen, Bearbeiten und Löschen von Restaurants. Die Anleitung verwendet projektbezogene Pfade und Platzhalter für den eigenen Fork, sodass jedes Ratsmitglied sie nutzen kann.
- Eine Inhaltsprüfung erkennt unter anderem ungültiges JSON, unbekannte Felder, falsche Noten, doppelte Namen sowie Probleme mit Reviewdateien und der Fotonummerierung.
- GitHub Actions führt Inhalts- und Ranglistentests, Astro-Prüfung und Build aus. Die Veröffentlichung über GitHub Pages ist als manueller Schritt für das ursprüngliche Repository vorbereitet.

## Prüfung und Veröffentlichungsstand

Die 14 Logiktests, die Inhaltsprüfung, die Astro-Prüfung und der Produktionsbuild bestanden. Die Migration wurde auf Desktop und Handy mit der bisherigen Darstellung verglichen. Rangliste, Filter, Sortierung, neue Reviewtexte, Fotokarussells und Karten wurden im Browser geprüft.

Die Änderungen sind im Fork vorbereitet. Durch diese Arbeit wurden keine Pull Requests gemergt und keine Änderungen auf der Live-Seite veröffentlicht. Lars' Pages-Konfiguration veröffentlicht derzeit die Wurzel von `main`. **Vor dem Merge der Astro-Migration muss die Pages-Quelle auf GitHub Actions umgestellt werden.** Danach wird der vorbereitete Workflow manuell gestartet. Die [Anleitung zur ersten Veröffentlichung](DEPLOYMENT.md) beschreibt Umstellung, Prüfung und Rückweg zur bisherigen Version.
