# Kart and Snake motion audit (baseline before revision 2 edits)

Read-only review of the current files under `/workspace/sites/markup`. No application source was changed by this audit.

## Confirmed critical kart input defect

`components/casual/ActionWorld.tsx`, `input()` initializes held keys to `{}` but converts directions with `Number(keys.up || keys.w)` (similarly the other three axes). Untouched keys evaluate to `undefined`, so `Number(undefined)` is `NaN`. Pressing only Up produces `throttle: NaN, steer: NaN`; serializing yields `{ "throttle": null, "steer": null }`. The API rejects these values, while local prediction can already be fed NaN speed/position. The current UI smoke test starts games without checking finite movement, so it did not detect this.

Fix: coerce each boolean first, e.g. `Number(!!(keys.up || keys.w))`, or use an extracted pure input helper. Test empty keys, every single held key, two held axes, release, E-only, R-only, and pointer controls. Assert finite bounded values, real server acceptance, movement after holding throttle, and finite canvas poses.

## Measured lap baseline

I ran `stepCircuit` at its exact 50 ms server step with one bot, no other racers, seed 1 and the stock track. Centerline lengths and bot lap durations:

| Track | Length (world units) | First lap | Subsequent laps |
| --- | ---: | ---: | ---: |
| Clover / meadow | 3,819.49 | 9.25 s | 8.85 s |
| Harbor / coast | 3,990.38 | 9.45 s | 9.00 s |
| Moonlit / night | 4,081.52 | 9.50 s | 9.10 s |

At 440 world units/s, these are intrinsically tiny tracks. To approach ~60 s per lap without making controls feel slow, expand centerline length around 6–7 times and retain lively local speed. Add bends/straights, then measure bots and skilled drive paths. Do not enforce an artificial minimum lap timer. Test approximately 50–80 s clean bot lap durations per track and all three laps completing before the game deadline.

Expansion pitfalls: current world bounds are hardcoded to 2000 × 1400 in physics, scenery and minimap transforms; all must use shared track geometry metadata. Current road detection compares only the nearest of 96 sampled vertices, not distance to the polyline segments. Scaling the track creates sample gaps wider than the road and falsely marks straight road stretches as off-road. Use a distance-to-segment calculation (with cached segments/spatial bins if needed) or increase sampling density. Checkpoint/finish gating must remain ordered and valid across larger dimensions.

## Other concrete kart issues

- `stepCircuit` turns at a base 1.1 radians/s even at zero speed. Holding left/right while stopped spins the kart and chase camera. Use speed-dependent yaw with a small stationary deadzone; invert yaw for reverse only once actually moving backward.
- Off-road entry clamps a 440-unit/s kart directly to 145, producing a sharp speed discontinuity. Ease toward the off-road maximum using deceleration while preserving collision rules.
- The grid has 28-unit lateral spacing but racer collision diameter is 34. Racers therefore repel each other immediately. Use two lateral columns and four longitudinal rows with at least 40-unit spacing (and ≥60 longitudinal spacing).
- The chase camera rotates by `-own.angle - π/2`, keeping forward motion at screen-up. The isometric SVG cart points diagonally; applying a flat rotation to that drawing does not make its model front match motion. Use an original top-down kart with local front at −Y (rendered at `angle + π/2`), or a proper heading-indexed sprite set. Wheels, steering, exhaust and drift sparks can animate in local cart coordinates.
- The camera uses the reconciled own angle directly. Smooth the camera angle separately with shortest-angle interpolation and slight look-ahead; do not add that smoothing to the driver's control simulation.
- `drawCircuit` recomputes 65 trees × 96 track-point distances every animation frame and rebuilds the track path. Precompute scenery and Path2D geometry. On much larger maps, cull scenery to the camera view rather than caching a huge full-resolution world bitmap.

## Snake delay and stutter causes

- Remote snakes are displayed at `clock - 220` ms unconditionally, then receive an additional exponential body filter (~24 ms). This adds intentional latency even on a fast local room. Use a smaller bounded interpolation budget derived from actual snapshot spacing/RTT, and avoid double-filtering normal interpolation.
- Local prediction is capped at `g.lastTickAt + max(400, speed*2)` and four steps; remote extrapolation stops after 350 ms. At a 200 ms poll interval plus a 300–500 ms request, prediction reaches its cap before the next snapshot arrives, then visibly freezes/corrects. Derive a bounded horizon from measured network timing, keep movement continuous while the connection is briefly delayed, and visibly separate a true disconnect from a single slow request.
- `predictSnake` creates an obstacle Set and copies all body points every call; remote fallback can do that per worm per frame. Cache obstacle occupancy by map/size/round; use shared cached lookups for body tests. Continue caching the static map scene.
- History frames are currently keyed only by `tick/startAt`; an acknowledgment-only update may not change tick, so historical queue/input metadata can be stale. Own prediction uses the latest direct snapshot, but remote history/extrapolation still deserves an explicit epoch/tick test.
- New server snapshots reroot predicted body geometry. The blanket smoothing filter applies to every segment if body length matches, but snaps all segments on growth. Preserve a stable presented path/arc length through turns/growth, reconcile corrections only on new snapshots, and reset explicitly for respawn/death epochs.
- Touch direction buttons currently use `onClick`, applying the turn after pointer release. Use immediate pointer-down direction handling while retaining keyboard accessibility and preventing duplicate turn submission.

## Shared transport bottleneck

`ControlChannel` allows only one request in flight. A delayed direction/drive request can hold every newer turn or key release for up to its 2 s timeout, even though the state packets are sequenced. This is especially noticeable with fast successive turns. Latest-state coalescing helps only after the old promise settles. Consider one bounded overlapping fresh control request or cancellation/supersession for stale held-state inputs; keep monotonically increasing sequences and one-shot item/recover flags. Preserve ordered corner inputs for Snake.

The service is HTTP polling with D1 JSON-state optimistic writes. Eight clients polling every 200 ms plus controls can generate ~40 GETs/s plus POSTs, each reading/projecting the full room and many saving the full state; CAS retries can amplify load. Test under real concurrent delayed traffic before simply increasing polling rates. Longer-term a shared room actor/WebSocket fanout is more appropriate, but it is a larger architectural change than the immediate input/render fixes.

## Focused regression tests

1. Extract pure drive-input conversion; every state is finite and accepted by the actual API.
2. Kart remains stationary in position and angle with no throttle; turning while moving has correct sign forward and reverse.
3. Eight-grid start positions do not overlap collision radii.
4. All track polyline segments classify as road at their midpoints, including after world-size scaling.
5. Three clean bot laps meet the timing target and finish without skipping ordered checkpoints.
6. Simulate 100/250/450 ms RTT with jitter: a new steer/release cannot remain behind stale traffic for the old 2 s timeout.
7. Snake own direction is visually acknowledged before the network response; two rapid legal corners retain order. Include growth, crash and respawn without a frame-length discontinuity or NaNs.
8. Browser hold throttle for ≥2 s and assert kart moves a meaningful distance, all positions stay finite, and no control API request returns 400. The previous startup-only smoke test would miss the confirmed defect.

No production network tests were performed by this bounded audit; lap measurements are deterministic local simulation.
