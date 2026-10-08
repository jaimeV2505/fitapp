"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Check } from "lucide-react";
import { useRef } from "react";
import { fireCelebration } from "@/lib/celebrate";

gsap.registerPlugin(useGSAP);

interface FinishedCelebrationProps {
  focus: string;
  name: string;
  durationLabel: string;
  sets: number;
  volumeKg: number;
  exercisesDone: number;
  exercisesTotal: number;
  recordsCount: number;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The one place GSAP is used: the "workout finished" moment is a sequence (ring draws, check pops,
 * title lifts, stats rise, numbers count up, confetti fires on the pop), and a timeline expresses that
 * more clearly than chained component states. Loaded lazily, only after a workout is finished.
 * With reduced motion nothing animates: the final state is simply shown.
 */
export default function FinishedCelebration({ focus, name, durationLabel, sets, volumeKg, exercisesDone, exercisesTotal, recordsCount }: FinishedCelebrationProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo(q("[data-ring]"), { strokeDashoffset: CIRCUMFERENCE }, { strokeDashoffset: 0, duration: 0.85, ease: "power2.inOut" })
          .fromTo(q("[data-check]"), { scale: 0, rotate: -30, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.5, ease: "back.out(2.4)" }, "-=0.3")
          .fromTo(q("[data-title]"), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.35")
          .fromTo(q("[data-stat]"), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.08 }, "-=0.2")
          .call(() => void fireCelebration("finish"), [], 0.95);

        q<HTMLElement>("[data-count]").forEach((element, index) => {
          const target = Number(element.dataset.count ?? "0");
          const suffix = element.dataset.suffix ?? "";
          const counter = { value: 0 };
          element.textContent = `0${suffix}`;
          tl.to(
            counter,
            {
              value: target,
              duration: 0.9,
              ease: "power2.out",
              onUpdate: () => {
                element.textContent = `${Math.round(counter.value).toLocaleString("en-US")}${suffix}`;
              },
            },
            1 + index * 0.08,
          );
        });

        return () => tl.kill();
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  const stats = [
    { label: "Duration", node: <span className="tnum">{durationLabel}</span> },
    { label: "Sets", node: <span className="tnum" data-count={sets}>{sets.toLocaleString("en-US")}</span> },
    { label: "Volume", node: <span className="tnum" data-count={Math.round(volumeKg)} data-suffix=" kg">{`${Math.round(volumeKg).toLocaleString("en-US")} kg`}</span> },
  ];

  return (
    <div ref={root} className="flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <div className="relative size-24 shrink-0">
          <svg viewBox="0 0 96 96" className="size-24 -rotate-90" aria-hidden>
            <circle cx="48" cy="48" r={RADIUS} fill="none" strokeWidth="8" className="stroke-muted" />
            <circle
              data-ring
              cx="48"
              cy="48"
              r={RADIUS}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className="stroke-success"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={0}
            />
          </svg>
          <span data-check className="absolute inset-0 flex items-center justify-center text-success">
            <Check className="size-10" strokeWidth={3.2} />
          </span>
        </div>
        <div className="min-w-0" data-title>
          <p className="text-sm font-medium text-muted-foreground">Workout complete</p>
          <h1 className="display-xl truncate">{focus}</h1>
          <p className="truncate text-muted-foreground">
            {name} · {exercisesDone} of {exercisesTotal} exercises
            {recordsCount > 0 ? ` · ${recordsCount} ${recordsCount === 1 ? "record" : "records"}` : ""}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} data-stat className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            <p className="font-display mt-1 text-2xl font-bold tracking-tight">{stat.node}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
