Given your setup (Next.js + React.memo + SVG + setInterval(1000)), I actually don't think the clock itself is the problem. An SVG clock updating once per second is extremely lightweight.

Based on what you've described ("scrolling downwards triggers several visual distortions"), I'd investigate the dashboard layout instead.

1. Check if the dashboard uses backdrop-filter (Most likely culprit)

Industrial Nexus has a modern glassmorphism UI. If you're using cards like:

backdrop-filter: blur(20px);

or

filter: blur(...)

Chrome (especially Android Chrome PWAs) struggles when scrolling many blurred elements and simultaneously repainting an SVG.

This often causes:

flickering
tearing
ghosting
delayed paints
2. Check if every dashboard card animates on scroll

For example:

transition: all .3s;

or

transform: translateY(...)

on dozens of widgets.

If the browser is repainting:

cards
charts
SVG clock
gradients
shadows

all together during scrolling, you'll see distortions.

Instead:

transition:
    transform .25s ease,
    opacity .25s ease;

Avoid:

transition: all;
3. Heavy box-shadows

Large shadows like

box-shadow:
0 20px 60px rgba(...)

on many cards are expensive while scrolling.

4. CSS Filters

These are expensive:

filter: blur(...)
filter: brightness(...)
filter: drop-shadow(...)

especially inside scrolling containers.

5. GPU compositing

Try forcing only the clock onto its own layer.

.clock-widget {
    transform: translateZ(0);
    will-change: transform;
    contain: paint;
}

or

svg {
    transform: translate3d(0,0,0);
}
6. Sticky containers

If the clock is inside

position: sticky;

or

overflow: auto;

with nested scrolling, Chrome sometimes repaints SVGs incorrectly.

7. Next.js Hydration

If the clock initially renders one time on the server and then immediately changes on the client, you can get a brief mismatch.

Make sure it's client-only:

'use client';

or dynamically import it:

const AnalogClock = dynamic(() => import('./AnalogClock'), {
  ssr: false,
});
What I'd inspect first (in order)
backdrop-filter
filter
Large box-shadow
transition: all
Sticky containers
Nested overflow: auto
Hardware acceleration (translateZ(0))