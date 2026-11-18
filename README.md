# Apex Notes

Offline-first markdown notes for ApexOS. Vanilla HTML/CSS/JS, no build step, no network calls,
relative `./` paths so it also runs from `/apps/notes/` inside the ApexOS bundle.

## Run

```sh
python3 -m http.server 8080
# then open http://127.0.0.1:8080/
```

Service workers need `http://localhost` or HTTPS.

## Controls

| control | what it does |
|---|---|
| New note | Creates a blank note and focuses the title |
| Search | Filters by title and body text (Ctrl/Cmd+K) |
| Export .md | Downloads the open note as Markdown |
| Delete | Removes the open note after a confirmation |
| Ctrl/Cmd+S | Forces a save and confirms it |

## Storage

Notes live in `localStorage` under `apex.notes.v1` as
`[{ id, title, body, updated }]`. Saves are debounced 350 ms; the footer reports the state.
Nothing is uploaded, and clearing site data deletes the notes.

## Bundling into ApexOS

`Apexos`/`Apex` clones this repo into `apps/notes/` (roster entry `Apex-Notes notes`).
Keep every path relative (`./styles.css`, not `/styles.css`) or the app breaks under `/apps/notes/`.

When the shell files change, bump `CACHE` in `sw.js` (`apex-notes-v1` → `v2`) so installed clients
pick up the new assets instead of serving the old cache.
