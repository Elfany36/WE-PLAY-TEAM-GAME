declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    CASUAL_ROOMS?: DurableObjectNamespace;
    BUCKET?: R2Bucket;
  }
}
