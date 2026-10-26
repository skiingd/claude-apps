# Claude-Apps

Minimale Web-App (PWA) für den Android-Startbildschirm, die eigene Claude-Artefakte als Kacheln sammelt.

## Zwei Arten von Einträgen

| Art | Was passiert beim Antippen | Gut für |
|---|---|---|
| **Link** | Öffnet das Artefakt auf claude.ai im Browser | Alle Artefakte, auch private, mit vollem Funktionsumfang. Braucht Internet und Login. |
| **HTML-Kopie** | Zeigt den eingefügten HTML-Code direkt in der App an | Einfache, eigenständige Artefakte, die offline laufen sollen. Funktionen von claude.ai (gespeicherte Daten, Claude fragen, Login) gehen hier nicht. Änderungen am Original kommen nicht automatisch mit. |

Warum nicht direkt einbetten? claude.ai sendet `Content-Security-Policy: frame-ancestors 'self'`, damit lassen sich Artefaktseiten nicht in fremde Seiten (iframes) einbetten.

## Benutzung

- **+** → Name, optional Emoji, Link oder HTML (einfügen oder `.html`-Datei wählen) → Speichern.
- **✎** schaltet den Bearbeiten-Modus ein: Kachel antippen → ändern oder löschen.
- **⋮** → Sicherung exportieren/importieren (JSON). Einträge liegen **nur im Browser dieses Handys**. Wer Chrome-Daten löscht, verliert sie.
- **Teilen:** Ist die App installiert, taucht „Claude-Apps“ im Android-Teilen-Menü auf. Einen Artefakt-Link aus Chrome oder der Claude-App teilen → das Formular ist vorausgefüllt.

## Auf dem Handy installieren

1. Die veröffentlichte Adresse in **Chrome** öffnen.
2. Menü **⋮ → App installieren** (oder „Zum Startbildschirm hinzufügen“).

## Veröffentlichen (GitHub Pages)

Die Dateien dieses Ordners liegen im Wurzelverzeichnis eines öffentlichen Repos. Dort *Settings → Pages → Source: Deploy from a branch → `main` / `(root)`* wählen.

Nach Änderungen an der App in `sw.js` die `VERSION` erhöhen, damit Handys die neue Fassung sicher bekommen.
