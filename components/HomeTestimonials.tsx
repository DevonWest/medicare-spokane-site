"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FocusEvent, TouchEvent } from "react";
import { testimonials } from "@/lib/testimonials";

const AUTO_ROTATE_MS = 6000;
const MOBILE_BREAKPOINT = 768;
const DESKTOP_BREAKPOINT = 1024;
const MIN_TESTIMONIAL_CARD_HEIGHT = "19rem";
const SWIPE_THRESHOLD = 50;

function getItemsPerView(width: number) {
  if (width >= DESKTOP_BREAKPOINT) {
    return 3;
  }

  if (width >= MOBILE_BREAKPOINT) {
    return 2;
  }

  return 1;
}

function useItemsPerView() {
  const [itemsPerView, setItemsPerView] = useState(1);

  useEffect(() => {
    const updateItemsPerView = () => {
      setItemsPerView(getItemsPerView(window.innerWidth));
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);

    return () => {
      window.removeEventListener("resize", updateItemsPerView);
    };
  }, []);

  return itemsPerView;
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return prefersReducedMotion;
}

export default function HomeTestimonials() {
  const featuredFirstTestimonials = useMemo(
    () =>
      [...testimonials].sort(
        (left, right) => (right.featured ? 1 : 0) - (left.featured ? 1 : 0),
      ),
    [],
  );
  const [page, setPage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const itemsPerView = useItemsPerView();
  const prefersReducedMotion = usePrefersReducedMotion();
  const touchStartX = useRef<number | null>(null);
  const pageStartIndices = useMemo(() => {
    const starts: number[] = [];
    const maxStartIndex = Math.max(featuredFirstTestimonials.length - itemsPerView, 0);

    for (let index = 0; index <= maxStartIndex; index += itemsPerView) {
      starts.push(index);
    }

    if (starts[starts.length - 1] !== maxStartIndex) {
      starts.push(maxStartIndex);
    }

    return starts;
  }, [featuredFirstTestimonials.length, itemsPerView]);
  const pageCount = pageStartIndices.length;
  const currentPage = Math.min(page, Math.max(pageCount - 1, 0));
  const startIndex = pageStartIndices[currentPage] ?? 0;
  const isPaused = isHovered || isFocusWithin;

  const goToPage = useCallback(
    (nextPage: number) => {
      if (pageCount === 0) {
        return;
      }

      setPage((nextPage + pageCount) % pageCount);
    },
    [pageCount],
  );

  useEffect(() => {
    if (prefersReducedMotion || isPaused || pageCount <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setPage((currentPage) => (currentPage + 1) % pageCount);
    }, AUTO_ROTATE_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPaused, pageCount, prefersReducedMotion]);

  const handleBlurCapture = (event: FocusEvent<HTMLElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setIsFocusWithin(false);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const deltaX = touchStartX.current - endX;
    touchStartX.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) {
      return;
    }

    goToPage(deltaX > 0 ? currentPage + 1 : currentPage - 1);
  };

  return (
    <section className="py-20 px-4 bg-slate-50 border-y border-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="inline-block text-blue-700 text-sm font-semibold uppercase tracking-wider mb-3">
            Social Proof
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Spokane Clients Say
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Real feedback from Spokane-area residents we&apos;ve helped navigate Medicare.
          </p>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocusCapture={() => setIsFocusWithin(true)}
          onBlurCapture={handleBlurCapture}
        >
          <div
            className="overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="-mx-3">
              <div
                className="flex [--cards-per-view:1] md:[--cards-per-view:2] lg:[--cards-per-view:3] transition-transform duration-500 ease-out motion-reduce:transition-none"
                style={{
                  transform: `translateX(calc(${startIndex} * -100% / var(--cards-per-view)))`,
                }}
              >
                {featuredFirstTestimonials.map((testimonial) => (
                  <div
                    key={testimonial.name}
                    className="basis-[calc(100%/var(--cards-per-view))] shrink-0 px-3"
                  >
                    <figure
                      className="h-full rounded-3xl border border-gray-200 bg-white p-7 shadow-sm"
                      style={{ minHeight: MIN_TESTIMONIAL_CARD_HEIGHT }}
                    >
                      <div className="mb-4 text-xl tracking-[0.2em] text-amber-500" aria-label="5 out of 5 stars">
                        ★★★★★
                      </div>
                      <blockquote className="text-lg leading-relaxed text-gray-900">
                        “{testimonial.text}”
                      </blockquote>
                      <figcaption className="mt-6 border-t border-gray-100 pt-5">
                        <p className="text-base font-semibold text-gray-900">{testimonial.name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <span>{testimonial.location}</span>
                          <span aria-hidden="true">•</span>
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                            {testimonial.source} Review
                          </span>
                        </div>
                      </figcaption>
                    </figure>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {pageCount > 1 ? (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between md:flex">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  className="pointer-events-auto -ml-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                  aria-label="Show previous testimonials"
                >
                  <span aria-hidden="true">←</span>
                </button>
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  className="pointer-events-auto -mr-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                  aria-label="Show next testimonials"
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-4 md:hidden">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                  aria-label="Show previous testimonials"
                >
                  <span aria-hidden="true">←</span>
                </button>
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                  aria-label="Show next testimonials"
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </>
          ) : null}
        </div>

        {pageCount > 1 ? (
          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
            aria-label="Testimonial carousel navigation"
            role="tablist"
          >
            {Array.from({ length: pageCount }, (_, pageIndex) => (
               <button
                 key={pageIndex}
                 type="button"
                 onClick={() => goToPage(pageIndex)}
                 className="inline-flex h-6 w-6 items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                 aria-label={`Show testimonial set ${pageIndex + 1}`}
                 role="tab"
                 aria-selected={pageIndex === currentPage}
               >
                 <span
                   className={`h-3 w-3 rounded-full transition ${
                     pageIndex === currentPage ? "bg-blue-700" : "bg-blue-200 hover:bg-blue-300"
                   }`}
                 />
               </button>
             ))}
           </div>
        ) : null}

        <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-gray-600">
          Reviews sourced from Google. More reviews available on Google.
        </p>

        <div className="mt-8 text-center">
          <Link
            href="/testimonials"
            className="inline-flex items-center justify-center text-blue-700 hover:text-blue-800 font-semibold underline-offset-4 hover:underline"
          >
            Read more client reviews →
          </Link>
        </div>
      </div>
    </section>
  );
}
