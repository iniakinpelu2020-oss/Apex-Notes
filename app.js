(function () {
  'use strict';

  var KEY = 'apex.notes.v1';
  var notes = [];
  var currentId = null;
  var saveTimer = 0;

  var el = {
    list: document.getElementById('noteList'),
    count: document.getElementById('count'),
    empty: document.getElementById('emptyList'),
    search: document.getElementById('search'),
    title: document.getElementById('title'),
    body: document.getElementById('body'),
    editor: document.getElementById('editorPane'),
    blank: document.getElementById('blankPane'),
    words: document.getElementById('wordCount'),
    saved: document.getElementById('saved'),
    toast: document.getElementById('toast')
  };

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      notes = raw ? JSON.parse(raw) : [];
    } catch (err) {
      notes = [];
    }
    if (!Array.isArray(notes)) notes = [];
    notes.forEach(function (n) {
      if (!n.id) n.id = uid();
      if (typeof n.title !== 'string') n.title = '';
      if (typeof n.body !== 'string') n.body = '';
      if (!n.updated) n.updated = Date.now();
    });
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(notes));
      el.saved.textContent = 'Saved';
    } catch (err) {
      el.saved.textContent = 'Could not save';
    }
  }

  function byId(id) {
    for (var i = 0; i < notes.length; i++) if (notes[i].id === id) return notes[i];
    return null;
  }

  function snippet(note) {
    var flat = note.body.replace(/\s+/g, ' ').trim();
    return flat ? flat.slice(0, 70) : 'No additional text';
  }

  function when(t) {
    var d = new Date(t);
    var today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  }

  function visible() {
    var q = el.search.value.trim().toLowerCase();
    var out = notes.slice().sort(function (a, b) { return b.updated - a.updated; });
    if (!q) return out;
    return out.filter(function (n) {
      return (n.title + ' ' + n.body).toLowerCase().indexOf(q) !== -1;
    });
  }

  function render() {
    var rows = visible();
    el.list.textContent = '';
    rows.forEach(function (note) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-current', note.id === currentId ? 'true' : 'false');
      var t = document.createElement('span');
      t.className = 'n-title';
      t.textContent = note.title.trim() || 'Untitled note';
      var s = document.createElement('span');
      s.className = 'n-sub';
      s.textContent = when(note.updated) + ' \u00b7 ' + snippet(note);
      btn.appendChild(t);
      btn.appendChild(s);
      btn.addEventListener('click', function () { select(note.id); });
      li.appendChild(btn);
      el.list.appendChild(li);
    });
    el.count.textContent = notes.length + (notes.length === 1 ? ' note' : ' notes');
    el.empty.hidden = rows.length !== 0;
  }

  function select(id) {
    currentId = id;
    var note = byId(id);
    if (!note) {
      el.editor.hidden = true;
      el.blank.hidden = false;
      render();
      return;
    }
    el.editor.hidden = false;
    el.blank.hidden = true;
    el.title.value = note.title;
    el.body.value = note.body;
    el.saved.textContent = 'Saved';
    countWords();
    render();
    if (window.innerWidth > 720) el.body.focus();
  }

  function countWords() {
    var text = el.body.value.trim();
    var n = text ? text.split(/\s+/).length : 0;
    el.words.textContent = n + (n === 1 ? ' word' : ' words');
  }

  function touch() {
    var note = byId(currentId);
    if (!note) return;
    note.title = el.title.value;
    note.body = el.body.value;
    note.updated = Date.now();
    el.saved.textContent = 'Saving\u2026';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      persist();
      render();
    }, 350);
    countWords();
  }

  function create() {
    var note = { id: uid(), title: '', body: '', updated: Date.now() };
    notes.push(note);
    persist();
    el.search.value = '';
    select(note.id);
    el.title.focus();
  }

  function remove() {
    var note = byId(currentId);
    if (!note) return;
    var label = note.title.trim() || 'this untitled note';
    if (!window.confirm('Delete "' + label + '"? This cannot be undone.')) return;
    notes = notes.filter(function (n) { return n.id !== note.id; });
    persist();
    currentId = null;
    select(null);
  }

  function download(name, text, type) {
    var blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function slug(text) {
    return (text.trim() || 'note').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'note';
  }

  function exportOne() {
    var note = byId(currentId);
    if (!note) return;
    var md = '# ' + (note.title.trim() || 'Untitled note') + '\n\n' + note.body + '\n';
    download(slug(note.title) + '.md', md, 'text/markdown;charset=utf-8');
  }

  function exportAll() {
    if (!notes.length) return;
    var md = notes
      .slice()
      .sort(function (a, b) { return b.updated - a.updated; })
      .map(function (n) {
        return '# ' + (n.title.trim() || 'Untitled note') + '\n\n' +
          new Date(n.updated).toISOString() + '\n\n' + n.body;
      })
      .join('\n\n---\n\n');
    download('apex-notes-' + new Date().toISOString().slice(0, 10) + '.md', md, 'text/markdown;charset=utf-8');
  }

  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.hidden = false;
    setTimeout(function () { el.toast.hidden = true; }, 2600);
  }

  document.getElementById('newNote').addEventListener('click', create);
  document.getElementById('newNote2').addEventListener('click', create);
  document.getElementById('deleteNote').addEventListener('click', remove);
  document.getElementById('exportOne').addEventListener('click', exportOne);
  el.title.addEventListener('input', touch);
  el.body.addEventListener('input', touch);
  el.search.addEventListener('input', render);

  document.addEventListener('keydown', function (e) {
    var mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      el.search.focus();
      el.search.select();
    } else if (mod && e.key.toLowerCase() === 's') {
      e.preventDefault();
      persist();
      toast('Saved');
    }
  });

  window.addEventListener('beforeunload', function () {
    if (currentId) {
      var note = byId(currentId);
      if (note) {
        note.title = el.title.value;
        note.body = el.body.value;
        note.updated = Date.now();
        persist();
      }
    }
  });

  load();
  render();
  if (notes.length) select(visible()[0].id); else select(null);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    });
  }
})();
