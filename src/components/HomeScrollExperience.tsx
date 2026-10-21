"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

const sections = [
  { title: "شروع", short: "۰۱" },
  { title: "دسته‌بندی‌ها", short: "۰۲" },
  { title: "تازه‌ها", short: "۰۳" },
  { title: "پایان", short: "۰۴" },
];

/**
 * Desktop: one deliberate wheel gesture = one section, animated with GSAP.
 * Touch, shorter screens and reduced-motion users keep native scrolling.
 * The main page is the only route mounting this controller.
 */
export function HomeScrollExperience() {
  const [active, setActive] = useState(0);
  const navigateRef = useRef<((index: number) => void) | null>(null);

  useEffect(() => {
    gsap.registerPlugin(Observer, ScrollToPlugin);

    const panels = Array.from(document.querySelectorAll<HTMLElement>("[data-home-panel]"));
    const footer = document.querySelector<HTMLElement>("footer");
    const stops: HTMLElement[] = footer ? [...panels, footer] : panels;
    const header = document.querySelector<HTMLElement>("header.home-header");
    if (panels.length !== 3) return;

    const desktop = window.matchMedia("(min-width: 1024px) and (min-height: 760px) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let index = 0;
    let animating = false;
    let scrollTween: gsap.core.Tween | null = null;
    let observer: ReturnType<typeof Observer.create> | null = null;
    const entranceTweens: gsap.core.Tween[] = [];

    const headerHeight = () => header?.getBoundingClientRect().height ?? 0;
    const scrollYFor = (element: HTMLElement) =>
      Math.max(0, Math.round(window.scrollY + element.getBoundingClientRect().top - headerHeight()));

    function closestIndex() {
      const position = window.scrollY;
      let nearest = 0;
      let smallest = Infinity;
      for (let i = 0; i < stops.length; i++) {
        const distance = Math.abs(position - scrollYFor(stops[i]));
        if (distance < smallest) {
          smallest = distance;
          nearest = i;
        }
      }
      return nearest;
    }

    function reveal(panel: HTMLElement) {
      if (panel.dataset.homeRevealed === "true") return;
      panel.dataset.homeRevealed = "true";
      if (reduced.matches) return;
      const elements = Array.from(panel.querySelectorAll<HTMLElement>("[data-home-reveal]"));
      if (elements.length === 0) return;
      entranceTweens.push(
        gsap.fromTo(
          elements,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.85,
            ease: "power3.out",
            stagger: 0.11,
            clearProps: "opacity,visibility,transform",
          },
        ),
      );
    }

    function navigate(next: number) {
      const targetIndex = Math.max(0, Math.min(stops.length - 1, next));
      if (animating || targetIndex === index) return;
      index = targetIndex;
      setActive(index);
      scrollTween?.kill();
      const target = stops[index];
      if (target.matches("[data-home-panel]")) reveal(target);
      if (reduced.matches) {
        window.scrollTo({ top: scrollYFor(target), behavior: "instant" });
        return;
      }
      animating = true;
      scrollTween = gsap.to(window, {
        duration: 0.95,
        ease: "power3.inOut",
        scrollTo: { y: scrollYFor(target), autoKill: false },
        overwrite: true,
        onComplete: () => {
          animating = false;
          index = closestIndex();
          setActive(index);
        },
        onInterrupt: () => { animating = false; },
      });
    }

    function syncFromScroll() {
      if (animating) return;
      const nearest = closestIndex();
      if (nearest !== index) {
        index = nearest;
        setActive(index);
      }
    }

    function configure() {
      document.documentElement.style.setProperty("--home-header-height", `${headerHeight()}px`);
      // Do not intercept wheel input if any panel cannot fit into the viewport.
      const available = window.innerHeight - headerHeight();
      const fit = panels.every((panel) => panel.scrollHeight <= available + 36);
      if (desktop.matches && !reduced.matches && fit) {
        if (!observer) {
          observer = Observer.create({
            target: window,
            type: "wheel",
            preventDefault: true,
            tolerance: 18,
            onDown: () => navigate(index + 1),
            onUp: () => navigate(index - 1),
          });
        }
      } else {
        observer?.kill();
        observer = null;
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (!desktop.matches || reduced.matches || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (target instanceof Element && target.closest("a,button,input,select,textarea,[contenteditable='true']")) return;
      let next: number;
      if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") next = index + 1;
      else if (event.key === "ArrowUp" || event.key === "PageUp") next = index - 1;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = stops.length - 1;
      else return;
      if (observer) {
        event.preventDefault();
        navigate(next);
      }
    }

    const intersection = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) reveal(entry.target as HTMLElement);
        }
      },
      { threshold: 0.22 },
    );

    panels.forEach((panel) => intersection.observe(panel));
    index = closestIndex();
    setActive(index);
    navigateRef.current = navigate;
    configure();
    window.addEventListener("resize", configure);
    window.addEventListener("scroll", syncFromScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", configure);
    reduced.addEventListener("change", configure);

    return () => {
      navigateRef.current = null;
      observer?.kill();
      scrollTween?.kill();
      entranceTweens.forEach((tween) => tween.kill());
      intersection.disconnect();
      panels.forEach((panel) => delete panel.dataset.homeRevealed);
      window.removeEventListener("resize", configure);
      window.removeEventListener("scroll", syncFromScroll);
      window.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", configure);
      reduced.removeEventListener("change", configure);
      document.documentElement.style.removeProperty("--home-header-height");
    };
  }, []);

  return (
    <nav className="home-step-nav" aria-label="جابجایی بین بخش‌های صفحهٔ اصلی">
      <span className="home-step-counter" aria-hidden="true">
        {sections[active].short} / ۰۴
      </span>
      {sections.map((section, i) => (
        <button
          key={section.title}
          type="button"
          aria-label={`رفتن به بخش ${section.title}`}
          aria-current={active === i ? "step" : undefined}
          className={`home-step-dot ${active === i ? "is-active" : ""}`}
          onClick={() => navigateRef.current?.(i)}
        >
          <span className="sr-only">{section.title}</span>
        </button>
      ))}
    </nav>
  );
}
