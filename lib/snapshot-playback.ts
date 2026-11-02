/**
 * Remote entities play confirmed simulation steps. The receipt clock deliberately stays
 * one step behind the newest head: guessing an unknown turn makes the next
 * packet look like a teleport. Transit latency changes freshness, not speed.
 */
export class SnapshotPlaybackClock {
 private latest = 0;
 private received = 0;
 private value = 0;
 private frame = 0;
 private jitter = 0;
 private initialized = false;

 sample(at: number, received: number, step: number) {
  if (!this.initialized) {
   this.latest = at;
   this.received = received;
   this.frame = received;
   this.value = at - step * 1.25;
   this.initialized = true;
   return;
  }
  if (at <= this.latest) return;
  // Ignore duplicate receipts; keep a bounded estimate of arrival jitter.
  const variation = Math.abs((received - this.received) - (at - this.latest));
  this.jitter = Math.min(step * 2, Math.max(variation, this.jitter * .9));
  this.latest = at;
  this.received = received;
 }

 read(time: number, step: number) {
  if (!this.initialized) return 0;
  const elapsed = Math.max(0, Math.min(50, time - this.frame));
  this.frame = Math.max(this.frame, time);
  const target = Math.min(this.latest, this.latest + Math.max(0, time - this.received) - step * 1.25 - this.jitter);
  const rate = Math.max(.8, Math.min(1.2, 1 + (target - this.value) / Math.max(step * 4, 1)));
  this.value = Math.min(this.latest, this.value + elapsed * rate);
  return this.value;
 }

 reset() { this.initialized = false; this.jitter = 0; }
}
