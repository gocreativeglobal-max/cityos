'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BannerSlide {
  id: string;
  image: string;
  alt: string;
  title?: string;
  categoryId?: string;
  targetSectionId?: string;
  linkUrl?: string;
}

/**
 * Default banner slides for 9jaLive Market.
 * To add more images to the slider:
 * 1. Place your image file in public/images/banners/ (e.g. hero-banner-2.jpg)
 * 2. Add an entry to this array with its path (/images/banners/hero-banner-2.jpg)
 */
export const DEFAULT_BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'hero-all-in-one',
    image: '/images/banners/hero-banner-1.jpg',
    alt: '9jaLive - Everything You Need. All in One Place. From fashion to groceries, electronics to home essentials.',
    targetSectionId: 'market-catalog-section',
  },
];

export interface MarketHeroSliderProps {
  slides?: BannerSlide[];
  onSelectCategory?: (categoryId: string) => void;
  className?: string;
}

export default function MarketHeroSlider({
  slides = DEFAULT_BANNER_SLIDES,
  onSelectCategory,
  className,
}: MarketHeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const totalSlides = slides.length;
  const hasMultipleSlides = totalSlides > 1;

  const nextSlide = useCallback(() => {
    if (!hasMultipleSlides) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [hasMultipleSlides, totalSlides]);

  const prevSlide = useCallback(() => {
    if (!hasMultipleSlides) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [hasMultipleSlides, totalSlides]);

  // Autoplay only when there is more than 1 slide
  useEffect(() => {
    if (!hasMultipleSlides || isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [hasMultipleSlides, isPaused, nextSlide]);

  const handleSlideClick = (slide: BannerSlide) => {
    if (slide.linkUrl) {
      window.location.href = slide.linkUrl;
      return;
    }

    if (slide.categoryId && onSelectCategory) {
      onSelectCategory(slide.categoryId);
    }

    const targetId = slide.targetSectionId || 'market-catalog-section';
    if (typeof window !== 'undefined') {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!hasMultipleSlides || !touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (totalSlides === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <div
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/80 bg-slate-900 select-none cursor-pointer',
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => handleSlideClick(currentSlide)}
      role="region"
      aria-label="Promotional Banners"
    >
      {/* Aspect Ratio Container (1024x409 -> 2.5:1) */}
      <div className="relative w-full aspect-[2.5/1] min-h-[140px] sm:min-h-[190px] md:min-h-[240px]">
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={slide.id || idx}
              className={cn(
                'absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out',
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              )}
            >
              <Image
                src={slide.image}
                alt={slide.alt || 'Promotional Banner'}
                fill
                priority={idx === 0}
                className="w-full h-full object-cover object-center"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
              />
            </div>
          );
        })}
      </div>

      {/* Prev / Next Arrows (Visible on multiple slides, with hover transition) */}
      {hasMultipleSlides && (
        <div className="absolute inset-y-0 inset-x-2 sm:inset-x-4 flex items-center justify-between z-20 pointer-events-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Previous Banner"
            className="pointer-events-auto w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm flex items-center justify-center border border-white/20 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Next Banner"
            className="pointer-events-auto w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm flex items-center justify-center border border-white/20 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      )}

      {/* Indicator Dots (Visible on multiple slides) */}
      {hasMultipleSlides && (
        <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 pointer-events-auto">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
              className={cn(
                'h-1.5 sm:h-2 rounded-full transition-all duration-300',
                idx === currentIndex
                  ? 'w-5 sm:w-6 bg-white shadow-xs'
                  : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/80'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
