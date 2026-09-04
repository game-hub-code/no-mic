# Fluid Jellyfish

WebGL fluid simulation background + a soft-body jellyfish (ported from
`particulate-medusae`). Drag to orbit camera, click to nudge, double-click/tap
to send the jellyfish swimming toward that point.

**Colorful / rainbow theme** — fluid background cycles through random hues
continuously (`COLORFUL: true`), no fixed purple/pink bias. Jellyfish body
parts (hood, tentacles, tail, mouth) each carry a distinct hue across the
spectrum — gold, cyan, green, orange, blue, teal, yellow, red — so no single
color dominates the creature either.

## Live demo

**https://game-hub-code.github.io/colourful-jellyfish/**

## Run locally

Open `index.html` in a browser. No build step, no server required (works via
`file://`, though some browsers restrict WebGL on `file://` — if so, serve it:
`python3 -m http.server` from this folder, then visit `localhost:8000`).

## Also usable as a Lively Wallpaper package

Lively Wallpaper -> Add wallpaper (+) -> Browse local file -> select this
`FluidMedusae` folder.

## License

This package aggregates code under two licenses:

- Original code in this repo (`index.html` wiring, `LivelyInfo.json`) and
  the modifications listed below: no additional restriction beyond the
  licenses of the code they modify.
- Ported code (`vendor/medusa-*.js`) from `particulate-medusae` by Ash Weeks:
  **Artistic License 2.0** — full text in `LICENSE-particulate-medusae.txt`.
- `vendor/particulate.js`, `vendor/three.js` + examples, `vendor/noise.js`,
  and the CDN-loaded `webgl-fluid`: **MIT**. See `THIRD-PARTY-NOTICES.txt`
  for full attribution and source links.

## Modified Version notice (Artistic License 2.0 §4)

This is a Modified Version of `particulate-medusae`. Changes from the
Standard Version, in `vendor/medusa-parts.js`, `vendor/medusa-shaders.js`,
and `vendor/medusa-scene.js`:

- **Dust particle count/spread**: `particleCount` raised 8000 -> 20000,
  `area` raised 300 -> 600, for denser full-screen coverage.
- **Dust brightness**: removed the radius-based illumination falloff in the
  `dust-frag` shader (previously particles dimmed toward the edge of a
  fixed-radius sphere around world origin, causing dark corners). Particles
  now render at uniform, constant alpha (`opacity`) regardless of position.
- **Head-yaw tracking**: added `item.rotation.y` interpolation in the swim
  update loop so the jellyfish turns to face the exact point of the last
  double-click/tap (`_swimDest`), rather than relying on the small lean-tilt
  alone.
- Earlier deviations from the Standard Version (audio removed, dev FPS
  panel removed, UI chrome replaced by a keydown toggle) are documented
  inline at the top of `vendor/medusa-scene.js`.

Distributed under Artistic License 2.0 §4(c)(ii): this Modified Version's
source is freely available, under the same license terms, to anyone who
receives it.
