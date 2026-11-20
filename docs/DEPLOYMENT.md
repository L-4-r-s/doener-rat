# Erste Veröffentlichung mit Astro

Diese Anleitung ist für Lars bzw. jemanden mit Admin- oder Maintainerrechten an `L-4-r-s/doener-rat`. Ein Commit im Fork oder ein offener Pull Request verändert die Live-Seite nicht. Der erste Merge nach `main` muss mit der Hosting-Umstellung abgestimmt werden.

## Aktuelle Konfiguration

Am 19.10.2026 über die GitHub-API geprüft:

| Einstellung | Aktueller Wert |
| --- | --- |
| Hosting | GitHub Pages |
| Veröffentlichungsart | Direkt aus einem Branch (`legacy`) |
| Branch und Ordner | `main`, `/` (Repository-Wurzel) |
| Eigene Domain | `www.doener-rat.de` |

Bisher lagen fertige HTML-Dateien direkt im Repository. Mit Astro liegen die Seitenvorlagen unter `src/`; `npm run build` erzeugt die veröffentlichbaren Dateien in `dist/`. Dieser Ordner wird nicht eingecheckt. Würde Pages nach dem Merge weiter die Repository-Wurzel veröffentlichen, könnten Startseite, Unterseiten und Assets fehlen.

Die Domain und ihre DNS-Einträge können bei dieser Umstellung unverändert bleiben. Astro erzeugt eine statische Seite; auf dem Hosting wird kein laufender Node-Server benötigt. Node.js 24 läuft im vorbereiteten GitHub-Workflow nur für den Build. Die vorhandene Firebase-Anbindung bleibt bestehen.

## Vor dem Merge

1. Im ursprünglichen Repository den aktuell veröffentlichten Commit und die Pages-Einstellungen festhalten, einschließlich Domain und HTTPS-Einstellung. Den letzten funktionierenden Stand für einen möglichen Rückweg aufbewahren.
2. Den Pull Request mit der vollständigen Migration prüfen. **Check site** muss erfolgreich sein. Eine lokale Vorschau des Produktionsbuilds erfolgt mit `npm ci`, `npm run build` und `npm run preview`.
3. Sicherstellen, dass GitHub Actions im ursprünglichen Repository erlaubt ist und der Pull Request `.github/workflows/deploy.yml` enthält. Dieser Workflow baut die Seite, lädt `dist/` hoch und veröffentlicht dieses Artefakt.
4. Den Zeitpunkt für Umstellung und erste Veröffentlichung abstimmen. Die neue Version nicht vorab in einen Branch mergen, aus dessen Wurzel Pages noch automatisch veröffentlicht.

## Umstellen und veröffentlichen

1. Im Repository **L-4-r-s/doener-rat** zu **Settings → Pages → Build and deployment** gehen.
2. **Source** von **Deploy from a branch** auf **GitHub Actions** umstellen, **bevor** die Migration nach `main` gemergt wird. So löst der Merge keine Veröffentlichung der neuen Quelldateien über den bisherigen Branch-Mechanismus aus.
3. Kontrollieren, dass **Custom domain** weiterhin `www.doener-rat.de` ist. Die bestehende HTTPS-Einstellung beibehalten. `astro.config.mjs` verwendet diese Domain bereits; `public/CNAME` enthält ebenfalls die bisherige Domain. Für diese Domain keinen Repository-Unterpfad über `ASTRO_BASE_PATH` setzen.
4. Den geprüften Pull Request nach `main` mergen und die Checks auf dem resultierenden Stand abwarten.
5. Unter **Actions → Deploy site → Run workflow** den Branch **main** auswählen und den Workflow starten. Der Workflow läuft absichtlich nur manuell und nur im ursprünglichen Repository. Der Workflow **Check site** veröffentlicht nichts.
6. Falls GitHub eine Freigabe für die Umgebung `github-pages` verlangt, die geprüfte Veröffentlichung dort freigeben. Warten, bis Build und Deployment erfolgreich abgeschlossen sind.

**Settings → Pages** bietet keinen `dist/`-Ordner als Branch-Quelle an. Deshalb wird hier GitHub Actions verwendet; der Workflow veröffentlicht das gebaute `dist/`-Artefakt.

## Nach der Veröffentlichung prüfen

- `https://www.doener-rat.de/` lädt mit Styles und Marburg-Hintergrund.
- Rangliste, Suche, Statusfilter und Sortierung funktionieren auf Handy und Desktop.
- Eine alte Bewertungsadresse mit `laden.html?name=…` funktioniert weiterhin.
- Uni Döner, Euro Döner und Somat zeigen Texte, Wertungen, Besuchsdaten, Fotos und die richtigen Karten.
- Royal wird als geschlossen ohne Wertung angezeigt.
- Statistik, Impressum und Datenschutz sind erreichbar.
- Bestehende Firebase-Kommentare und Community-Wertungen werden geladen. Die lokalen Browserprüfungen haben Firebase durch Testdaten ersetzt; die Verbindung zur Produktionsdatenbank muss hier zusätzlich geprüft werden.
- Unter **Settings → Pages** stimmen Domain und HTTPS weiterhin.

## Wenn etwas fehlschlägt

Bei einem fehlgeschlagenen Workflow zuerst die Logs unter **Actions → Deploy site** prüfen. Nicht als Ausweichlösung die Astro-Quelldateien aus der Repository-Wurzel veröffentlichen. Nach einer Korrektur und erfolgreichen Checks den Workflow erneut auf `main` starten.

Falls zur alten Version zurückgekehrt werden muss: den vorher gesicherten Stand einschließlich der alten HTML-Dateien und Assets per geprüftem Revert bzw. Wiederherstellungs-Pull-Request nach `main` zurückbringen. **Erst danach** Pages wieder auf **Deploy from a branch → main → /(root)** stellen. Anschließend die erneute Veröffentlichung und Domain prüfen. Das Zurückstellen der Pages-Quelle allein reicht nicht, solange `main` noch die Astro-Dateistruktur enthält.

## Spätere Änderungen

Nach dieser Umstellung bleiben die Pages-Einstellungen bestehen. Ein Merge veröffentlicht mit dem aktuellen Workflow weiterhin nicht automatisch: Für jede gewünschte Veröffentlichung muss **Deploy site** auf `main` manuell gestartet werden. Neue Reviews und kleine Änderungen brauchen dann keine erneute Hosting-Umstellung.

Quellen: [GitHubs Anleitung zur Veröffentlichungsquelle](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [Astros Anleitung für GitHub Pages](https://docs.astro.build/en/guides/deploy/github/).
