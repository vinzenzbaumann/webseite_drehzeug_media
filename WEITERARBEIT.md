# drehzeug media – Weiterarbeit

Diese Datei ist eine kurze Übergabe für eine neue Copilot-/KI-Session, falls der bisherige Gesprächskontext verloren geht.

## Projekt

- Lokaler Projektordner: `/Users/vinzenzbaumann/Documents/Webseite drehzeug media`
- Statische Website (HTML, CSS und JavaScript), kein Build-System.
- Lokaler Entwicklungsserver lief zuletzt auf `http://127.0.0.1:8000`.
- GitHub-Repository: <https://github.com/vinzenzbaumann/webseite_drehzeug_media>
- Branch: `main`; letzter bestätigter Push war Commit `980c5a2` (`Update website layout and video assets`).

## Aktueller Stand

- `index.html` ist die minimalistische Coming-soon-Startseite: nur das Logo „DREHZEUG media“ und „COMING SOON“ vor dem weichgezeichneten Hintergrundvideo.
- `portfolio.html` enthält die bisherige vollständige Reel-Website. Sie ist im Projekt behalten, aber nicht mit der Coming-soon-Startseite verlinkt.
- Die Coming-soon-Seite ist eigenständig und verwendet inline CSS sowie `assets/ressource/psycho-stream.mp4` und die Cooper-Hewitt-Fontdateien. Es gibt keine zusätzlichen Navigationselemente oder Links auf der Startseite.
- Die Reel-Website hat Kontaktangaben, einen Bildplatzhalter und eine Impressumsseite. `impressum.html` verwendet die vom Nutzer bereitgestellten Daten; vor Veröffentlichung juristische Angaben prüfen.
- Das Coming-soon-Video verwendet `assets/ressource/psycho-stream.mp4` (ca. 14 MB). Die größere frühere Version `psycho-web.mp4` bleibt lokal verfügbar (ca. 56 MB).
- Es fehlen weiterhin Medien für Imagefilm und Livestream (`Imagefilm.MP4` und `livestream.mp4`); diese Reel-Quellen lieferten lokal 404.

## Noch offene Website-Arbeiten

1. Richtige Videos und Fotos einbinden.
2. Partnerlogos einbauen.
3. Eine bessere Beschreibungskarte / Vorstellung von Vinzenz erstellen.
4. Gesamtdesign prüfen und gegebenenfalls verbessern.
5. Optional einen Merch-Shop ergänzen. Bestellungen sollen zunächst manuell über einen E-Mail-Link eingehen, nicht über einen automatisierten Checkout.

## Veröffentlichung / Hosting

- Gewünschte Domain: `https://drehzeugmedia.de`.
- DNS zeigte zuletzt auf Hostinger: Nameserver `hermes.dns-parking.com` und `artemis.dns-parking.com`; die Domain lieferte eine Hostinger-Parkseite mit HTTP 200.
- Der Nutzer möchte die Veröffentlichung über den Hostinger-Browser/hPanel, nicht über eine hier geöffnete Vorschau.
- Der Nutzer hat einen Hostinger-Plan gekauft. Im hPanel erscheint ein aktiver Single Web Hosting Plan (laut hPanel gültig bis 2028-11-04) sowie die PHP/HTML-Website `drehzeugmedia.de`.
- Die Website ist noch nicht veröffentlicht. Der öffentliche Domain-Aufruf lieferte zuletzt weiterhin Hostingers Parkseite.
- Im hPanel wurde für diese Website der Datei-Manager geöffnet; dort erscheint eine Auswahl „Nur die Dateien dieser speziellen Website“ bzw. „Auf alle Dateien von Single Web Hosting zugreifen“. Die erste Option war im integrierten Browser nicht zuverlässig anklickbar; es wurden keine Dateien verändert oder hochgeladen.
- Nächster Schritt: Nutzer bitten, die Option für die Dateien dieser Website selbst im hPanel zu öffnen. Danach aktuellen Webroot-Inhalt prüfen und nur die Coming-soon-Website bereitstellen.
- Keinen weiteren kostenpflichtigen Plan kaufen und keine DNS-Einstellungen verändern, bevor der bestehende Domain-/Hostingstatus geprüft wurde.
- Nicht behaupten, dass die Coming-soon-Seite online ist, bevor der gewählte Hostingweg abgeschlossen und `https://drehzeugmedia.de` geprüft wurde.
- Beim Veröffentlichen nur die Coming-soon-Startseite und ihre nötigen Assets bereitstellen. Keine Zugangsdaten oder Tokens in Dateien oder Chat speichern.
- `gh` war in der letzten Prüfung nicht angemeldet. Änderungen seit `980c5a2` sind noch lokal und uncommitted; vor Push `git status` und Änderungen sorgfältig prüfen.

## Arbeitsweise

- Bestehende Änderungen respektieren; keine pauschalen Resets oder überschreibenden Deployments.
- Nach CSS/HTML-Änderungen `git diff --check`; nach JavaScript-Änderungen zusätzlich `node --check assets/js/main.js`.
- Bei Fragen zur Gestaltung direkt im lokalen Browser prüfen. Für hPanel die Anmeldung vom Nutzer selbst im Browser durchführen lassen.
