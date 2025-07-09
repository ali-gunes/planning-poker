import React, { useRef, useState } from 'react';

interface VotingCardBarProps {
  cards: (number | string)[];
  selected: number | string | null;
  disabled: boolean;
  onSelect: (card: number | string) => void;
}

/**
 * VotingCardBar – fixed bottom bar that shows voting cards with left/right navigation arrows.
 * Keeps styling consistent with existing dark theme (Tailwind classes match other components).
 */
export const VotingCardBar: React.FC<VotingCardBarProps> = ({
  cards,
  selected,
  disabled,
  onSelect,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Update arrow visibility based on scroll position
  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4); // tiny buffer
  };

  const handleScroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8; // Scroll by 80% of the visible width
    el.scrollBy({
      left: dir === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Evaluate arrows whenever component renders
  React.useEffect(() => {
    updateScrollButtons();
  });

  // Also update on window resize
  React.useEffect(() => {
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, []);

  const scrollable = canScrollLeft || canScrollRight;

  return (
    <div className="fixed inset-x-2 md:inset-x-4 bottom-4 z-40 pointer-events-none">
      <div className="relative max-w-5xl mx-auto bg-gray-900/80 backdrop-blur-md rounded-2xl px-2 py-4 md:px-6 md:py-6 flex items-center shadow-2xl pointer-events-auto">
        
        {/* Left arrow */}
        {scrollable && canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 bg-gray-800 text-blue-400 hover:bg-gray-700 flex items-center justify-center rounded-lg mr-2"
          >
            ◀
          </button>
        )}

        {/* Cards container */}
        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className={`overflow-x-auto flex no-scrollbar flex-1 ${scrollable ? '' : 'justify-center'}`}
        >
          {cards.map((value) => {
            const isSelected = selected === value;
            return (
              <button
                key={value}
                disabled={disabled}
                onClick={() => onSelect(value)}
                className={`
                  relative
                  w-16 h-24 md:w-24 md:h-36 lg:w-28 lg:h-40 
                  flex-shrink-0 flex items-center justify-center 
                  text-2xl md:text-4xl lg:text-5xl font-bold 
                  rounded-lg md:rounded-xl m-1 md:m-2
                  transition-colors duration-200
                  ${disabled ? 'bg-gray-700 cursor-not-allowed text-gray-500' : 
                    isSelected ? 'bg-blue-600 text-white border-4 border-blue-400 shadow-lg synthwave-selected-card' : 
                    'bg-gray-800 text-blue-400 hover:bg-gray-700'}
                `}
                data-selected={isSelected ? "true" : "false"}
              >
                {/* Special selection indicator for themed cards */}
                {isSelected && (
                  <>
                    <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-pink-500 theme-indicator-left hidden">▶</span>
                    <span className="absolute -right-3 top-1/2 -translate-y-1/2 text-pink-500 theme-indicator-right hidden">◀</span>
                  </>
                )}
                {value}
              </button>
            );
          })}
        </div>

        {/* Right arrow */}
        {scrollable && canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 bg-gray-800 text-blue-400 hover:bg-gray-700 flex items-center justify-center rounded-lg ml-2"
          >
            ▶
          </button>
        )}
      </div>
    </div>
  );
}; 