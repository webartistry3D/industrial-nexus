So I have a challenge with a progressive web app frontend dashboard. There's a realtime analog clock widget as one of the dashboard components. The problem is when I scroll downwards, it triggers several visual distortions on screen.

That behavior is usually not caused by the PWA itself, but by the way the analog clock is being rendered and updated while the page is scrolling.

Here are the most common causes, in order of likelihood:

1. Too many React re-renders ⭐ (Most likely)

If your clock updates every second (or more frequently) and is inside the dashboard component, the entire dashboard may be re-rendering.

Fix:

Wrap the clock in React.memo().
Keep its state isolated from the rest of the dashboard.
Use useRef for the clock hands instead of React state if possible.
2. CSS transforms conflicting with scrolling

Analog clocks usually rotate hands using:

transform: rotate(...)

If the parent container also uses transforms during scrolling, the browser may constantly repaint.

Fix:

.clock {
  will-change: transform;
  transform: translateZ(0);
}
3. Canvas or SVG repainting

If you're redrawing the entire clock on a <canvas> every frame, scrolling forces additional paints.

Fix

Draw only once.
Update only the hands.
Prefer SVG/CSS transforms over redrawing the entire canvas.
4. Updating at 60 FPS

If you're using:

requestAnimationFrame()

for a normal clock, that's unnecessary.

Use:

setInterval(updateClock, 1000);

instead.

5. Layout shifts

If the clock's size changes while rendering, scrolling can cause visible distortions.

Ensure:

width: 220px;
height: 220px;
aspect-ratio: 1;
6. Hardware acceleration

Try:

.clock,
.clock-hand {
    backface-visibility: hidden;
    will-change: transform;
    transform: translateZ(0);
}
To diagnose quickly

Please share:

Is the clock built with CSS, SVG, or Canvas?
Are you using React/Next.js?
Is it updating with setInterval() or requestAnimationFrame()?