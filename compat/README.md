# Open-tab asset compatibility

Production logs after the v11 publication showed old browser tabs requesting the v10 `ActionWorld-DeXf8GqX.js` lazy chunk and receiving 404s. Removing every previous hashed filename during publication breaks a tab that has not loaded a game yet.

`previous-client-assets.json.gz` contains only the immutable client JS/CSS/build manifests from the preceding Site releases and their inherited dependency graphs; the current pack includes 472 files through Site v21. It contains no room snapshots, sessions, credentials or server modules. The readable manifest records original source commits, byte lengths and SHA-256 hashes. Most shared chunks deduplicate by filename.

The Sites and Pages postbuild hooks restore missing immutable URLs, verifying every file and refusing path traversal or a differing file at the same immutable URL. Current build files always remain authoritative. No old JavaScript is loaded by a new page unless that page explicitly requests an older URL. Existing game error boundaries retain their manual reload/reconnect fallback.

When rolling this pack forward, use the last two successful publication archives, preserve full filename dependency closure, regenerate the readable manifest and deterministic gzip, and rerun the retained-import regression. Record the two latest source publications separately from the inherited releases. Preserve their existing immutable dependency closure when updating the pack.
