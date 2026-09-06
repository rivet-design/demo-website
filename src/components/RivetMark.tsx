import { useEffect, useRef } from 'react';

import { useInView } from '../hooks/use-in-view';
import { MARK_ART, MARK_DEFS } from '../lib/rivetMarkArt';

/**
 * The Rivet mark swinging between state 2 and state 3 of the brand's motion
 * study.
 *
 *   state 2 — the whole lockup rests at +150°, rocking gently like a pen tip
 *             planted on paper, while the hand-drawn doodle writes itself on.
 *   state 3 — the chevron flips to a downward V (the "heart"), the whole mark
 *             lands with one soft bounce, then the chevron pulses lub-dub.
 *
 * The artwork is not re-drawn here: MARK_DEFS/MARK_ART are lifted verbatim out
 * of rivet-brand/animations/logo-motion.html (see scripts/extract-logo-motion.mjs),
 * grain filters and ink doodle included. This file is the port of that page's
 * *runtime* — the same pose targets, spring constants, stagger, wiggle, bounce
 * and heartbeat values, running the same integrator — with states 1 and 4 (and
 * their IDLE gesture) dropped, since the site only wants the two-pose swing.
 *
 * CSS keyframes can't stand in for this. The pieces are separate bodies on
 * different springs, the diamond LEADS the chevron by 100ms, and the bounce and
 * heartbeat are real damped springs kicked by velocity — a keyframe timeline
 * would lock all of that to one curve.
 */

/* ---- pose targets, in the source artboard's units ---------- */
type Pose = { tx: number; ty: number; rot: number };
type Stage = 2 | 3;

const CHEVRON_STATES: Record<Stage, Pose> = {
  2: { tx: 22.39, ty: 75.07, rot: 150 }, // whole lockup rotated rigidly in place
  3: { tx: 0, ty: -30, rot: 180 }, // flips to a downward V, lifted to recentre
};
const DIAMOND_STATES: Record<Stage, Pose> = {
  2: { tx: -45.48, ty: -165.9, rot: 150 }, // same rotation about the shared pivot
  3: { tx: 0, ty: 30, rot: 0 }, // centred below the V's tip, clear of it
};

// Chevron is the heavier body; the diamond is lighter and a touch livelier.
const CHEVRON_SPRING = { stiffness: 170, damping: 15 };
const DIAMOND_SPRING = { stiffness: 190, damping: 16 };
// The hop INTO state 2 travels faster, same overshoot character — the source
// uses these for its own 1→2 hop, and they matter more here: the pen starts
// writing the moment the stage begins, so the mark needs to be planted early.
const CHEVRON_SPRING_TO_2 = { stiffness: 300, damping: 20 };
const DIAMOND_SPRING_TO_2 = { stiffness: 340, damping: 21 };
// Diamond leads, chevron settles just after — that lag is the character.
const CHEVRON_STAGGER_MS = 60;
const DIAMOND_STAGGER_MS = -40;

/* ---- how long each pose holds ------------------------------ */
// A beat of stillness added to BOTH poses once their own motion has fully
// resolved, so the swing reads as two deliberate poses rather than one
// continuous churn. Deliberately applied after each state's own settle, not
// folded into it, so it can be tuned without disturbing the motion timings.
const EXTRA_HOLD_MS = 450;

// State 2 runs on the ink's own clock: the pen writes, then holds briefly once
// the doodle is fully drawn.
const INK_REVEAL_MS = 2000;
const INK_HOLD_MS = 300;
const STATE_2_MS = INK_REVEAL_MS + INK_HOLD_MS + EXTRA_HOLD_MS;
// State 3's own motion covers the bounce landing (BOUNCE_SETTLE_MS), two full
// heartbeat cycles, then the pulse's fade + still beat below, so neither the
// bounce nor the pulse is ever cut short.
const STATE_3_PULSE_MS = 2900;
const STATE_3_MS = STATE_3_PULSE_MS + EXTRA_HOLD_MS;
// The pulse eases to exactly zero before its own window closes, then sits still,
// so the swing back to state 2 always starts from a static frame.
const PULSE_FADE_MS = 200;
const PULSE_STATIC_MS = 80;

// The scribble doesn't get cut when the pose changes — it starts fading just
// before the mark swings away and finishes shortly after, so the pen reads as
// lifting off the page rather than the ink blinking out.
const INK_FADE_LEAD_MS = 250; // fade begins this long before state 2 ends
const INK_FADE_MS = 600;
const INK_OPACITY = 0.92;

/* ---- WIGGLE — state 2 only --------------------------------- */
// The lockup rocks side to side in place, like a hand trembling slightly on a
// planted pen. Applied at render time only, so it never touches the springs.
const WIGGLE = { ampPx: 7, rotDeg: 2.8, hz: 1.7, rotPhase: 0.9 };
const WIGGLE_SETTLE_MS = 160; // finishes inside INK_HOLD_MS, so the cut never lands mid-rock

/* ---- BOUNCE — state 3 only, whole mark --------------------- */
// One soft physical bounce as the pose lands: a light upward toss, decelerating
// under the spring's pull, one small rebound, settled. Same offset goes to both
// bodies, so the gap between them never changes.
const BOUNCE = { stiffness: 120, damping: 9, v0: 900 };
const BOUNCE_SETTLE_MS = 900; // the heartbeat waits this out — land first, then pulse

/* ---- HEARTBEAT — state 3, chevron only --------------------- */
// A stronger beat (lub), a quieter quicker one just after (dub), then a long
// relaxed pause — never a metronome. Each beat is a velocity kick into a real
// spring, not a scripted bump.
const HEARTBEAT = {
  cycleMs: 850, // ~70bpm, a resting heart rate
  lubAt: 60,
  lubKick: 4.1,
  dubAt: 215,
  dubKick: 2.22,
  spring: { stiffness: 400, damping: 16 },
  bouncePxPerUnit: 45, // a small lift riding along with each beat
};

/* ---- the ink doodle ---------------------------------------- */
// The doodle's own thin tail-tip, in its native 142×39 coordinates — the point
// pinned to the chevron's contact point, so the scrawl reads as written from
// there rather than floating on its own.
const INK_TIP_LOCAL = { x: 141.8, y: 22 };
const INK_SCALE = 0.9;
// Spine for the trim-path reveal, traced tip → outer loop → inner coil: the
// order the pen "wrote" it. Not a pixel-exact centreline, just enough for the
// mask stroke to uncover the artwork in a believable order.
const INK_SPINE_POINTS = [
  { x: 133, y: 18 }, { x: 110, y: 6 }, { x: 88, y: 2 }, { x: 52, y: 1 },
  { x: 15, y: 8 }, { x: 2, y: 22 }, { x: 15, y: 33 }, { x: 39, y: 37 },
  { x: 65, y: 33 }, { x: 82, y: 27 }, { x: 78, y: 15 }, { x: 55, y: 8 },
  { x: 36, y: 16 }, { x: 55, y: 16 },
];

type Point = { x: number; y: number };
type Spring = Pose & { vtx: number; vty: number; vrot: number };
type SpringCfg = { stiffness: number; damping: number };

const makeSpring = (from: Pose): Spring => ({ ...from, vtx: 0, vty: 0, vrot: 0 });

// Damped harmonic spring per degree of freedom (force = -k(x - target) - c·v),
// semi-implicit Euler, one pass per frame — the source's own integrator.
const stepSpring = (cur: Spring, target: Pose, cfg: SpringCfg, dt: number) => {
  (['tx', 'ty', 'rot'] as const).forEach((k) => {
    const vk = `v${k}` as const;
    const force = -cfg.stiffness * (cur[k] - target[k]) - cfg.damping * cur[vk];
    cur[vk] += force * dt;
    cur[k] += cur[vk] * dt;
  });
};

/** Catmull-Rom through the spine points, as a cubic path. */
const buildInkSpineD = (points: Point[]) => {
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
  }
  return d;
};

const transformPoint = (pt: Point, pivot: Point, pose: Pose): Point => {
  const rad = (pose.rot * Math.PI) / 180;
  const dx = pt.x - pivot.x;
  const dy = pt.y - pivot.y;
  return {
    x: pivot.x + pose.tx + dx * Math.cos(rad) - dy * Math.sin(rad),
    y: pivot.y + pose.ty + dx * Math.sin(rad) + dy * Math.cos(rad),
  };
};

const RivetMark = ({ className = '' }: { className?: string }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { ref: hostRef, inView } = useInView<HTMLDivElement>({ rootMargin: '120px' });

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const pick = <T extends SVGElement>(id: string) =>
      svg.querySelector<T>(`#rm-${id}`);
    const pieceA = pick<SVGGElement>('piece-a');
    const pieceB = pick<SVGGElement>('piece-b');
    const pieceC = pick<SVGGElement>('piece-c');
    const inkBlob = pick<SVGGElement>('ink-blob');
    const inkStroke = pick<SVGPathElement>('ink-reveal-stroke');
    if (!pieceA || !pieceB || !pieceC || !inkBlob || !inkStroke) return;

    /* ---- wiring: pivots measured from the rendered geometry --- */
    const firstPath = (el: SVGGElement) =>
      el.querySelector('path') as SVGPathElement;
    const bboxCenterOf = (el: SVGGElement): Point => {
      const b = firstPath(el).getBBox();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    };
    const bboxCorners = (el: SVGGElement): Point[] => {
      const b = firstPath(el).getBBox();
      return [
        { x: b.x, y: b.y },
        { x: b.x + b.width, y: b.y },
        { x: b.x, y: b.y + b.height },
        { x: b.x + b.width, y: b.y + b.height },
      ];
    };

    const centerA = bboxCenterOf(pieceA);
    const centerB = bboxCenterOf(pieceB);
    // Pieces A and B are one permanently-joined body, so they share one pivot —
    // the midpoint of their own bbox centres — and always take the identical
    // transform. That's what freezes their overlap.
    const chevronPivot = {
      x: (centerA.x + centerB.x) / 2,
      y: (centerA.y + centerB.y) / 2,
    };
    const diamondCenter = bboxCenterOf(pieceC);

    // The lowest point of the chevron in its state-2 rest pose — the ink sits
    // just below it and slightly right, as if the pen had just left it there.
    const inkRaw = [...bboxCorners(pieceA), ...bboxCorners(pieceB)]
      .map((pt) => transformPoint(pt, chevronPivot, CHEVRON_STATES[2]))
      .reduce((lowest, pt) => (pt.y > lowest.y ? pt : lowest));
    const inkAnchor = { x: inkRaw.x + 145, y: inkRaw.y - 30 };

    inkStroke.setAttribute('d', buildInkSpineD(INK_SPINE_POINTS));
    const inkStrokeLen = inkStroke.getTotalLength();
    inkStroke.setAttribute('stroke-dasharray', `${inkStrokeLen} ${inkStrokeLen}`);
    inkStroke.setAttribute('stroke-dashoffset', String(inkStrokeLen));

    /* ---- render ------------------------------------------------ */
    const applyChevron = (
      s: Spring,
      w: { dx: number; drot: number },
      bounceDy: number,
      hb: { scale: number; dy: number },
    ) => {
      const p = chevronPivot;
      // The bounce's whole-mark toss and the heartbeat's own per-beat lift add
      // into the same vertical offset; the pulse scales about the same pivot.
      const m = `translate(${p.x + s.tx + w.dx} ${p.y + s.ty + bounceDy + hb.dy}) rotate(${s.rot + w.drot}) scale(${hb.scale}) translate(${-p.x} ${-p.y})`;
      pieceA.setAttribute('transform', m);
      pieceB.setAttribute('transform', m);
    };
    const applyDiamond = (
      s: Spring,
      w: { dx: number; drot: number },
      bounceDy: number,
    ) => {
      const c = diamondCenter;
      pieceC.setAttribute(
        'transform',
        `translate(${c.x + s.tx + w.dx} ${c.y + s.ty + bounceDy}) rotate(${s.rot + w.drot}) translate(${-c.x} ${-c.y})`,
      );
    };

    const chevronSpring = makeSpring(CHEVRON_STATES[3]);
    const diamondSpring = makeSpring(DIAMOND_STATES[3]);

    const still = { dx: 0, drot: 0 };
    const noPulse = { scale: 1, dy: 0 };

    // Reduced motion, or off screen: hold state 3, no loop, no ink.
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !inView
    ) {
      inkBlob.setAttribute('opacity', '0');
      applyChevron(chevronSpring, still, 0, noPulse);
      applyDiamond(diamondSpring, still, 0);
      return;
    }

    let stage: Stage = 3;
    let stageStartedAt = performance.now();
    let last = stageStartedAt;
    let raf = 0;

    let bounce: { y: number; vy: number } | null = null;
    let pulse: { y: number; vy: number } | null = null;
    let pulseStartedAt: number | null = null;
    let pulseCyclePos = -1;
    let inkStartedAt: number | null = null;
    let inkPlaced = false;
    // Non-null once the scribble has begun fading out; it outlives state 2 by
    // design, so leaving the stage must not clear it.
    let inkFadeStartedAt: number | null = null;

    // Hide and rearm the doodle — only ever called once its fade has finished.
    const resetInk = () => {
      inkStartedAt = null;
      inkPlaced = false;
      inkFadeStartedAt = null;
      inkBlob.setAttribute('opacity', '0');
      inkStroke.setAttribute('stroke-dashoffset', String(inkStrokeLen));
    };

    const enterStage = (next: Stage) => {
      stage = next;
      stageStartedAt = performance.now();
      bounce = null;
      pulse = null;
      pulseStartedAt = null;
      pulseCyclePos = -1;
    };

    // Eases the scribble out over INK_FADE_MS, then clears it. Runs in both
    // stages: the fade starts at the tail of state 2 and carries into state 3.
    const stepInkFade = (now: number) => {
      if (inkFadeStartedAt === null) return;
      const p = Math.min((now - inkFadeStartedAt) / INK_FADE_MS, 1);
      if (p >= 1) {
        resetInk();
        return;
      }
      const eased = 0.5 * (1 + Math.cos(Math.PI * p)); // 1 → 0, no hard edges
      inkBlob.setAttribute('opacity', String(INK_OPACITY * eased));
    };

    const frame = (now: number) => {
      // Clamped: a long frame (tab hidden, main thread busy) would otherwise
      // integrate a huge dt and fling the springs apart.
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const elapsed = now - stageStartedAt;

      if (elapsed > (stage === 2 ? STATE_2_MS : STATE_3_MS)) {
        enterStage(stage === 3 ? 2 : 3);
        requestAnimationFrame(frame);
        return;
      }

      // The stagger is a delay on when each body starts travelling — that's
      // what makes the diamond lead.
      if (elapsed >= CHEVRON_STAGGER_MS) {
        stepSpring(
          chevronSpring,
          CHEVRON_STATES[stage],
          stage === 2 ? CHEVRON_SPRING_TO_2 : CHEVRON_SPRING,
          dt,
        );
      }
      if (elapsed >= DIAMOND_STAGGER_MS) {
        stepSpring(
          diamondSpring,
          DIAMOND_STATES[stage],
          stage === 2 ? DIAMOND_SPRING_TO_2 : DIAMOND_SPRING,
          dt,
        );
      }

      /* --- BOUNCE (state 3) --- */
      if (stage === 3) {
        if (bounce === null) bounce = { y: 0, vy: -BOUNCE.v0 };
        const force = -BOUNCE.stiffness * bounce.y - BOUNCE.damping * bounce.vy;
        bounce.vy += force * dt;
        bounce.y += bounce.vy * dt;
      }
      const bounceDy = bounce ? bounce.y : 0;

      /* --- HEARTBEAT (state 3, after the bounce has landed) --- */
      let hb = noPulse;
      if (stage === 3 && elapsed >= BOUNCE_SETTLE_MS) {
        if (pulse === null) {
          pulse = { y: 0, vy: 0 };
          pulseStartedAt = now;
          pulseCyclePos = -1;
        }
        const cyc = (now - (pulseStartedAt as number)) % HEARTBEAT.cycleMs;
        if (pulseCyclePos < HEARTBEAT.lubAt && cyc >= HEARTBEAT.lubAt) {
          pulse.vy += HEARTBEAT.lubKick;
        }
        if (pulseCyclePos < HEARTBEAT.dubAt && cyc >= HEARTBEAT.dubAt) {
          pulse.vy += HEARTBEAT.dubKick;
        }
        pulseCyclePos = cyc;

        const cfg = HEARTBEAT.spring;
        const force = -cfg.stiffness * pulse.y - cfg.damping * pulse.vy;
        pulse.vy += force * dt;
        pulse.y += pulse.vy * dt;

        // Ease the pulse to exactly zero before the cut, so it's never chopped
        // off mid-beat.
        let y = pulse.y;
        const fadeStart = STATE_3_PULSE_MS - PULSE_FADE_MS - PULSE_STATIC_MS;
        if (elapsed > fadeStart) {
          const p = Math.min(Math.max((elapsed - fadeStart) / PULSE_FADE_MS, 0), 1);
          y *= 0.5 * (1 + Math.cos(Math.PI * p));
        }
        hb = { scale: 1 + y, dy: -y * HEARTBEAT.bouncePxPerUnit };
      }

      /* --- WIGGLE + ink (state 2) --- */
      let w = still;
      if (stage === 2) {
        if (inkStartedAt === null) inkStartedAt = now;
        if (!inkPlaced && inkFadeStartedAt === null) {
          // Set once, at the doodle's own angle — the ink is inert once it
          // exists. Only the trim-path reveal below is animated.
          inkBlob.setAttribute('opacity', '0.92');
          inkBlob.setAttribute(
            'transform',
            `translate(${inkAnchor.x} ${inkAnchor.y}) scale(${INK_SCALE}) translate(${-INK_TIP_LOCAL.x} ${-INK_TIP_LOCAL.y})`,
          );
          inkPlaced = true;
        }
        const t = Math.min((now - inkStartedAt) / INK_REVEAL_MS, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        inkStroke.setAttribute('stroke-dashoffset', String(inkStrokeLen * (1 - eased)));

        // Start lifting the pen a moment before the pose changes.
        if (inkFadeStartedAt === null && elapsed > STATE_2_MS - INK_FADE_LEAD_MS) {
          inkFadeStartedAt = now;
        }

        // The pen only rocks while it's actually writing — once the reveal
        // finishes it settles out rather than hard-cutting.
        const sinceDone = now - inkStartedAt - INK_REVEAL_MS;
        const amp = sinceDone > 0 ? Math.max(0, 1 - sinceDone / WIGGLE_SETTLE_MS) : 1;
        const phase = (now / 1000) * WIGGLE.hz * Math.PI * 2;
        w = {
          dx: Math.sin(phase) * WIGGLE.ampPx * amp,
          drot: Math.sin(phase + WIGGLE.rotPhase) * WIGGLE.rotDeg * amp,
        };
      }

      stepInkFade(now);
      applyChevron(chevronSpring, w, bounceDy, hb);
      applyDiamond(diamondSpring, w, bounceDy);
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [inView, hostRef]);

  return (
    <div ref={hostRef} className={className}>
      {/* Cropped to the artwork's own 318px box so the mark sits flush with the
          column edge at rest; overflow stays visible so state 2's ink and state
          3's bounce can swing outside it without being clipped — the same
          reason the source page sets overflow:visible on its stage. */}
      <svg
        ref={svgRef}
        viewBox="81 81 318 318"
        fill="none"
        aria-hidden
        className="block w-full overflow-visible"
        dangerouslySetInnerHTML={{ __html: MARK_DEFS + MARK_ART }}
      />
    </div>
  );
};

export default RivetMark;
