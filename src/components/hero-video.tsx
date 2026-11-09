"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type Props = {
  mp4: string;
  webm?: string;
  /** Portrait cut served to phones, so the models stay in frame. */
  mobileMp4?: string;
  poster: string;
  mobilePoster?: string;
  title: string;
  cta: string;
  href: string;
};

/**
 * Full-screen, muted campaign film that loops without stopping. The browser can pause a video on
 * its own (tab switches, low-power mode, returning from the back button), so it is restarted
 * whenever that happens. Visitors who ask for reduced motion see a still image instead.
 *
 * When the screen is too short to show the whole frame, `hero-tilt` drifts slowly from the upper
 * body to the feet and back, so visitors still see the full outfit. On screens that fit the
 * height it has nothing to move, so the film simply sits still.
 */
export function HeroVideo({ mp4, webm, mobileMp4, poster, mobilePoster, title, cta, href }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      return;
    }
    v.muted = true;
    const play = () => {
      if (!document.hidden && v.paused) v.play().catch(() => {});
    };
    const restart = () => {
      v.currentTime = 0;
      play();
    };

    play();
    v.addEventListener("pause", play);
    v.addEventListener("canplay", play);
    v.addEventListener("ended", restart);
    document.addEventListener("visibilitychange", play);
    window.addEventListener("pageshow", play);
    // Low-power mode blocks autoplay until the visitor first touches the page.
    window.addEventListener("pointerdown", play, { once: true });
    return () => {
      v.removeEventListener("pause", play);
      v.removeEventListener("canplay", play);
      v.removeEventListener("ended", restart);
      document.removeEventListener("visibilitychange", play);
      window.removeEventListener("pageshow", play);
      window.removeEventListener("pointerdown", play);
    };
  }, []);

  return (
    <section aria-label={title} className="relative h-[min(100svh,177.78vw)] min-h-[560px] w-full md:h-[100svh] overflow-hidden bg-ink">
      <picture>
        {mobilePoster && <source srcSet={mobilePoster} media="(max-width: 767px)" />}
        <img src={poster} alt="" fetchPriority="high" className="hero-tilt absolute inset-0 h-full w-full object-cover" />
      </picture>
      <video
        ref={ref}
        className="hero-tilt absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        preload="auto"
        aria-hidden
      >
        {mobileMp4 && <source src={mobileMp4} type="video/mp4" media="(max-width: 767px)" />}
        {webm && <source src={webm} type="video/webm" />}
        <source src={mp4} type="video/mp4" />
      </video>
      {/* Shades keep the white header and title legible over bright footage. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/0 via-25% to-black/0" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 via-20% to-black/0 to-45%" />
      <div className="rise gutter absolute inset-x-0 bottom-12 text-center text-white sm:bottom-16">
        <h1 className="display text-[44px] sm:text-[64px]">{title}</h1>
        <Link href={href} className="caps link-line mt-3">
          {cta}
        </Link>
      </div>
    </section>
  );
}
