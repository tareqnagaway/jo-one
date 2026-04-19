import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const ads = [
  { id: 1, title: 'من الأردن للعالم', subtitle: 'خدمات Jo One الشاملة', color: 'bg-primary' },
  { id: 2, title: 'احجز رحلتك الآن', subtitle: 'استمتع بأفضل الأسعار', color: 'bg-secondary' },
  { id: 3, title: 'اشحن رصيدك', subtitle: 'طرق دفع سهلة وآمنة', color: 'bg-blue-600' },
];

export default function PromoCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const intervalId = setInterval(() => {
      const { scrollLeft, clientWidth, scrollWidth } = scrollContainer;
      
      // Calculate next scroll position
      let nextScrollLeft = scrollLeft + clientWidth;
      
      // If we reached the end, reset to the start
      if (nextScrollLeft >= scrollWidth - 10) { // Small buffer
        nextScrollLeft = 0;
      }

      scrollContainer.scrollTo({
        left: nextScrollLeft,
        behavior: 'smooth'
      });
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div 
      ref={scrollRef}
      className="overflow-x-auto flex gap-4 p-4 pb-2 snap-x scroll-smooth"
    >
      {ads.map((ad) => (
        <motion.div
          key={ad.id}
          className={cn("min-w-[200px] h-32 rounded-[2rem] p-6 text-white snap-center shrink-0", ad.color)}
        >
          <h3 className="text-lg font-black mb-1">{ad.title}</h3>
          <p className="text-white/80 text-xs font-medium">{ad.subtitle}</p>
        </motion.div>
      ))}
    </div>
  );
}
