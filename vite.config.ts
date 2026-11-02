import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { readExecutionProfile } from "./scripts/execution-profile.mjs";
import { configureToolEnvironment } from "./scripts/tool-environment.mjs";
import { sites } from "./scripts/vite/sites-vite-plugin";
import { connectorPreview } from "./scripts/vite/connector-preview-plugin.mjs";

// Real D1 database (site-creator-d1) used by `wrangler deploy` on Cloudflare.
// Override with the D1_DATABASE_ID / D1_DATABASE_NAME build variables if the
// database is ever recreated or deployed to a different account.
const DEFAULT_D1_DATABASE_ID = "89871452-465b-4ebf-bfac-2c4b4c3aaf72";
const D1_DATABASE_ID = process.env.D1_DATABASE_ID || DEFAULT_D1_DATABASE_ID;
const D1_DATABASE_NAME = process.env.D1_DATABASE_NAME || "site-creator-d1";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
const managedLinux = readExecutionProfile() === "managed-linux";

// The we-play-team-game build trigger sets WE_PLAY_REGIONAL_DEPLOY=1.
// Keep its regional settings out of Sites builds and local previews.
const regionalDeployment = process.env.WE_PLAY_REGIONAL_DEPLOY === "1";
const localBindingConfig = {
  ...(regionalDeployment ? {
    placement: { region: "aws:ap-southeast-1" },
    observability: { enabled: true, head_sampling_rate: 0.1, redact_query_string: true,
      logs: { enabled: true, invocation_logs: true, persist: true, head_sampling_rate: 0.1 } },
  } : {}),
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  // One Durable Object per casual room keeps game state in memory, so a poll
  // no longer needs a D1 read and write (the "server work" lag).
  durable_objects: {
    bindings: [{ name: "CASUAL_ROOMS", class_name: "CasualRoom" },{name:"ARENA_ROOMS",class_name:"ArenaRoom"}],
  },
  migrations: [{ tag: "casual-rooms-v1", new_sqlite_classes: ["CasualRoom"] },{tag:"room-authorities-v2",new_sqlite_classes:["ArenaRoom"]}],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: D1_DATABASE_NAME,
          database_id: D1_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async ({ command }) => {
  configureToolEnvironment(process.cwd());

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: {
      ...(managedLinux
        ? { host: "0.0.0.0", allowedHosts: ["terminal.local"] }
        : {}),
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      vinext(),
      sites({ mockAuth: !managedLinux }),
      connectorPreview(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: {
          ...localBindingConfig,
          ...(command === "serve"
            ? {
                services: [
                  {
                    binding: "CONNECTORS",
                    service: "sites-connector-preview",
                    entrypoint: "ConnectorPreview",
                  },
                ],
              }
            : {}),
        },
        ...(command === "serve"
          ? {
              auxiliaryWorkers: [
                {
                  config: {
                    name: "sites-connector-preview",
                    main: "./scripts/connector-preview/worker.mjs",
                    compatibility_date: "2026-05-15",
                  },
                },
              ],
            }
          : {}),
      }),
    ],
  };
});
