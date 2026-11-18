# Apex Notes

Markdown notes that sync between your own devices, with no account you do not control.

**Status: not built.**

## What it should do

- Write in Markdown, with a live preview.
- Search across everything, instantly, offline.
- Sinc between phone and laptop without a subscription.

## The constraint that shapes it

Firestore's free tier — 1 GiB stored, 20,000 writes a day — is far more than a lifetime of
notes. Storage is not the problem. **Conflicts are the problem.**

If two devices edit the same note offline, last-write-wins silently deletes work. That is
the single bug that makes people abandon a notes app, and it must be designed for on day
one:

- keep a version number per note and refuse a write that is based on an old version,
- or store an append-only log of edits and fold them together when syncing.

## The design I would pick

Local-first. Every note lives in IndexedDB on the device and is the source of truth for
reading. Syncing is a background reconciliation, not a requirement. That way the app is
fast, works on a plane, and a dead network never means a blank screen.

## What you need to do

1. Nothing new. Same Firebase project as the rest.

## First three steps

1. An editor with local storage and no sync at all. Use it for a week and see if it holds.
2. Sync, with the version check, and a visible "conflict" screen when it triggers.
3. Export to plain `.md` files, so leaving is always possible.
