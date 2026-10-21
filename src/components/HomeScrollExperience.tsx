"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const steps = [
  { id: "home-intro", title: "شروع" },
  { id: "home-collections", title: "دسته‌بندی‌ها" },
  { id: "home-new", title: "تازه‌ها" },
  { id: "home-how", title: "راهنمای خرید" },
  { id: "footer", title: "پایان" },
];

/** Progressive GSAP motion, scoped strictly to the homepage. */
export function HomeScrollExperience() {
  const [active, setActive] = useState(0);
  const [canStep, setCanStep] = useState(false);
  const navigateRef = useRef<((next: number) => void) | null>(null);

  useEffect(() => {
    gsap.registerPlugin(Observer, ScrollToPlugin, ScrollTrigger);
    const root = document.querySelector<HTMLElement>("#home-experience");
    const panels = Array.from(root?.querySelectorAll<HTMLElement>("[data-home-panel]") ?? []);
    const footer = document.querySelector<HTMLElement>("footer");
    const header = document.querySelector<HTMLElement>("header.home-header");
    if (!root || panels.length !== 4 || !footer) return;

    const stops = [...panels, footer];
    const desktop = window.matchMedia("(min-width: 1100px) and (min-height: 820px) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let current = 0;
    let locked = false;
    let enabled = false;
    let lastTransition = 0;
    let observer: ReturnType<typeof Observer.create> | null = null;
    let scrollTween: gsap.core.Tween | null = null;
    const played = new WeakSet<HTMLElement>();
    const timelines: gsap.core.Timeline[] = [];
    const triggers: ScrollTrigger[] = [];

    const offset = () => header?.getBoundingClientRect().height ?? 0;
    const yOf = (node: HTMLElement) => Math.max(0, window.scrollY + node.getBoundingClientRect().top - offset());

    function nearest() {
      let best = 0;
      let distance = Number.POSITIVE_INFINITY;
      stops.forEach((node, index) => {
        const delta = Math.abs(window.scrollY - yOf(node));
        if (delta < distance) {
          distance = delta;
          best = index;
        }
      });
      return best;
    }

    function reveal(panel: HTMLElement) {
      if (played.has(panel) || reduced.matches) return;
      played.add(panel);
      const pick = (part: string) =>
        Array.from(panel.querySelectorAll<HTMLElement>('[data-motion="' + part + '"]'));
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      const label = pick("label");
      const title = pick("title");
      const copy = pick("copy");
      const visual = pick("visual");
      const actions = pick("actions");
      const cards = pick("card");
      const detail = pick("detail");

      if (label.length) tl.fromTo(label, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .5, clearProps: "opacity,transform" });
      if (title.length) tl.fromTo(title, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: .85, clearProps: "opacity,transform" }, "-=.21");
      if (copy.length) tl.fromTo(copy, { opacity: 0, y: 17 }, { opacity: 1, y: 0, duration: .7, clearProps: "opacity,transform" }, "-=.52");
      if (visual.length) tl.fromTo(visual, { opacity: 0, scale: .965, y: 14 }, { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: "power2.out", clearProps: "opacity,transform" }, .06);
      if (actions.length) tl.fromTo(actions, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .58, clearProps: "opacity,transform" }, "-=.45");
      if (cards.length) tl.fromTo(cards, { opacity: 0, y: 23, scale: .985 }, { opacity: 1, y: 0, scale: 1, duration: .78, stagger: .13, clearProps: "opacity,transform" }, "-=.33");
      if (detail.length) tl.fromTo(detail, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .6, clearProps: "opacity,transform" }, "-=.3");
      timelines.push(tl);
    }

    panels.forEach((panel) => {
      triggers.push(ScrollTrigger.create({
        trigger: panel,
        start: "top 83%",
        onEnter: () => reveal(panel),
        onEnterBack: () => reveal(panel),
      }));
    });

    const parallax = root.querySelector<HTMLElement>("[data-parallax]");
    const animations = gsap.matchMedia();
    if (parallax) {
      animations.add("(min-width: 1100px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(parallax, { yPercent: -1.5 }, {
          yPercent: 2.5,
          ease: "none",
          scrollTrigger: { trigger: panels[0], start: "top top", end: "bottom top", scrub: 1.15 },
        });
      });
    }

    function navigate(next: number) {
      const targetIndex = Math.max(0, Math.min(stops.length - 1, next));
      if (locked || targetIndex === current || performance.now() - lastTransition < 260) return;
      current = targetIndex;
      setActive(current);
      const destination = current === stops.length - 1
        ? Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
        : yOf(stops[current]);
      if (current < panels.length) reveal(panels[current]);
      scrollTween?.kill();
      locked = true;
      lastTransition = performance.now();
      if (reduced.matches) {
        window.scrollTo(0, destination);
        locked = false;
        return;
      }
      scrollTween = gsap.to(window, {
        scrollTo: { y: destination, autoKill: false },
        duration: 1.12,
        ease: "power2.inOut",
        overwrite: true,
        onComplete: () => { locked = false; lastTransition = performance.now(); },
        onInterrupt: () => { locked = false; },
      });
    }
    navigateRef.current = navigate;

    function sync() {
      if (locked) return;
      const next = nearest();
      if (next !== current) { current = next; setActive(next); }
    }

    function configure() {
      document.documentElement.style.setProperty("--home-header-height", offset() + "px");
      const fits = panels.every((panel) => panel.scrollHeight <= window.innerHeight - offset() + 12);
      const shouldEnable = desktop.matches && !reduced.matches && fits;
      if (enabled === shouldEnable) return;
      enabled = shouldEnable;
      setCanStep(enabled);
      observer?.kill();
      observer = shouldEnable ? Observer.create({
        target: window,
        type: "wheel",
        preventDefault: true,
        tolerance: 30,
        onDown: () => navigate(current + 1),
        onUp: () => navigate(current - 1),
      }) : null;
    }

    function handleKey(event: KeyboardEvent) {
      if (!enabled || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.target instanceof HTMLElement &&
          event.target.closest("a,button,input,select,textarea,[contenteditable]")) return;
      let destination: number | null = null;
      if (["ArrowDown", "PageDown", " "].includes(event.key)) destination = current + 1;
      if (["ArrowUp", "PageUp"].includes(event.key)) destination = current - 1;
      if (event.key === "Home") destination = 0;
      if (event.key === "End") destination = stops.length - 1;
      if (destination !== null) { event.preventDefault(); navigate(destination); }
    }

    const resizeObserver = new ResizeObserver(configure);
    panels.forEach((panel) => resizeObserver.observe(panel));
    if (header) resizeObserver.observe(header);
    current = nearest();
    setActive(current);
    configure();
    ScrollTrigger.refresh();

    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", configure);
    window.addEventListener("keydown", handleKey);
    desktop.addEventListener("change", configure);
    reduced.addEventListener("change", configure);

    return () => {
      navigateRef.current = null;
      observer?.kill();
      scrollTween?.kill();
      timelines.forEach((tl) => tl.kill());
      triggers.forEach((trigger) => trigger.kill());
      animations.revert();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", configure);
      window.removeEventListener("keydown", handleKey);
      desktop.removeEventListener("change", configure);
      reduced.removeEventListener("change", configure);
      document.documentElement.style.removeProperty("--home-header-height");
    };
  }, []);

  return (
    <nav className={"home-story-nav" + (canStep ? " is-enabled" : "")} aria-label="راهنمای بخش‌های صفحهٔ اصلی">
      <span className="home-story-caption" aria-hidden="true">EXPLORE</span>
      {steps.map((step, index) => (
        <button
          key={step.id}
          className={"home-story-step" + (active === index ? " is-current" : "")}
          type="button"
          title={step.title}
          aria-label={"رفتن به بخش " + step.title}
          aria-current={active === index ? "step" : undefined}
          onClick={() => navigateRef.current?.(index)}
        >
          <span className="home-story-bullet" aria-hidden="true" />
          <span className="home-story-text">{step.title}</span>
        </button>
      ))}
      <span className="home-story-counter" aria-hidden="true">
        {String(active + 1).padStart(2, "0")} / 05
      </span>
    </nav>
  );
}
