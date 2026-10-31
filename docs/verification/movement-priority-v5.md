# Kart and Snake movement implementation

Kart rendering and authoritative collisions now use one cached scenery layout. Trunks/buildings have collision footprints, the outer shoulder constrains the kart centre, start positions fit the model footprints, and zero-distance overlaps separate deterministically. Pickups, projectiles and oil use model-scale contact radii. These rules are shared with prediction. Static scenery is raster-cached instead of rebuilding its gradients per frame; cars/scenery draw in depth order, followed by readable labels. The enlarged tracks and validated lap/checkpoint rules remain.

An eight-bot simulation completed all three tracks, with mean lap times of 58.1 s Meadow, 60.7 s Coast and 62.1 s Night. Four targeted collision/lap checks passed. These are deterministic simulation measurements, not human lap guarantees or Internet latency results.

Snake uses an incremental grid prediction cache. It builds each next grid step once per snapshot/input, then interpolates into reusable point arrays. The drawing points also reuse their buffers. This replaces repeated full-body simulation/allocation on every animation frame. Remote extrapolation in the new sampling path is capped at 200 ms; local prediction remains bounded separately. Respawn/protection epochs reset the relevant body history, while ordinary network correction remains bounded and smooth. Solid roster colors and no names over snake bodies are retained.

Three targeted Snake buffer checks passed: turn/growth/collision equivalence without authority mutation, stable buffers across 144 Hz sample times, and capped remote extrapolation/respawn separation. This does not certify rendering on a physical 144 Hz display.
