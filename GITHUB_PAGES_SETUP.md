# GitHub Pages deployment

The selected repository is `Elfany36/WE-PLAY-TEAM-GAME`.

## Enable the repository's Pages source

1. Open https://github.com/Elfany36/WE-PLAY-TEAM-GAME/settings/pages .
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Open **Actions → Publish Markup to GitHub Pages** and run or re-run the workflow.
4. Confirm that the deploy job succeeds before treating https://elfany36.github.io/WE-PLAY-TEAM-GAME/ as live.

The connected GitHub tools used here support source commits and workflow inspection but do not expose the Pages-enablement administration operation. The normal workflow token cannot enable Pages automatically. If Pages is not already configured, repository settings need this one-time change. The build job still uploads the static artifact before the deploy job checks Pages configuration.

## Build without GitHub Actions

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm run build:pages
```

Upload the **contents** of `dist-pages/`, including `.nojekyll`, to the chosen Pages publishing source. The download also includes a ready-built `github-pages/` directory. Do not upload just the framework source and expect GitHub Pages to execute its server code.

## Multiplayer service

The frontend uses https://markup-learn-play-together.brightbunch.chatgpt.site for shared rooms when served from github.io. The server allowlist includes `https://elfany36.github.io`. This must be a publicly accessible service for public Pages users; otherwise visitors receive its access gate. Site audience is controlled separately in Sites sharing settings.

If hosting a separate compatible service, set `VITE_ROOM_API_ORIGIN` when building, then update `lib/room-origin.ts` with the exact frontend origin. This is public configuration, not a secret. Keep private room bearer tokens only in each player's session storage.

Before calling multiplayer publicly live, create a room from the deployed Pages URL and join it from another device. Check all three coding modes, chat, departure cleanup and recovery. The local eight-browser tests do not establish that public hosting and access configuration have completed.
