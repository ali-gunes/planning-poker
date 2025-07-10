import React, { useRef, useState, useEffect } from 'react';

interface VotingCardBarProps {
  cards: (number | string)[];
  selected: number | string | null;
  disabled: boolean;
  onSelect: (card: number | string) => void;
  roomId: string; // Add roomId prop to create unique localStorage keys
  gameState?: string; // Optional game state to conditionally show/hide the component
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
  roomId,
  gameState,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(`voting-cards-collapsed-${roomId}`);
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, [roomId]);

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`voting-cards-collapsed-${roomId}`, isCollapsed.toString());
  }, [isCollapsed, roomId]);

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

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Evaluate arrows whenever component renders
  useEffect(() => {
    updateScrollButtons();
  }, [cards]); // Add cards dependency to update when cards change

  // Also update on window resize
  useEffect(() => {
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, []);

  const scrollable = canScrollLeft || canScrollRight;

  // Don't render anything if we're in the revealed state
  if (gameState === 'revealed') {
    return null;
  }

  return (
    <div className="fixed inset-x-2 md:inset-x-4 bottom-4 z-40 pointer-events-none">
      {/* Card bar - conditionally shown based on collapsed state */}
      <div 
        className={`relative max-w-5xl mx-auto bg-gray-900/80 backdrop-blur-md rounded-2xl px-2 py-2 md:px-4 md:py-3 flex items-center shadow-2xl pointer-events-auto transition-all duration-300 ${
          isCollapsed ? 'opacity-0 translate-y-20 pointer-events-none' : 'opacity-100'
        }`}
      >
        
        {/* Left arrow */}
        {scrollable && canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 bg-gray-800 text-blue-400 hover:bg-gray-700 flex items-center justify-center rounded-lg mr-2"
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
                  w-12 h-16 md:w-16 md:h-24 lg:w-20 lg:h-28 
                  flex-shrink-0 flex items-center justify-center 
                  text-lg md:text-2xl lg:text-3xl font-bold 
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
            className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 bg-gray-800 text-blue-400 hover:bg-gray-700 flex items-center justify-center rounded-lg ml-2"
          >
            ▶
          </button>
        )}

        {/* Collapse button inside the card bar */}
        <button
          onClick={toggleCollapse}
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900/80 backdrop-blur-md text-blue-400 hover:bg-gray-800 rounded-t-lg px-4 py-1 shadow-lg pointer-events-auto transition-colors"
        >
          <span className="mr-1">▼</span> Kartları Gizle
        </button>
      </div>

      {/* Expand button - shown only when collapsed */}
      {isCollapsed && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full flex justify-center">
          <button
            onClick={toggleCollapse}
            className="bg-gray-900/80 backdrop-blur-md text-blue-400 hover:bg-gray-800 rounded-t-lg px-4 py-1 shadow-lg pointer-events-auto transition-colors"
          >
            <span className="mr-1">▲</span> Kartları Göster
          </button>
        </div>
      )}
    </div>
  );
}; 