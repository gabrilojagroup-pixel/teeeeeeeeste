interface DecorativeLinesProps {
  className?: string;
}

const DecorativeLines = ({ className = "" }: DecorativeLinesProps) => {
  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(220 20% 85%)" stopOpacity="0.3" />
          <stop offset="50%" stopColor="hsl(270 50% 85%)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="hsl(220 20% 85%)" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      
      {/* Curved lines */}
      <path
        d="M-100 100 Q 200 50 400 120 T 800 80 T 1200 150 T 1600 100"
        stroke="url(#lineGradient)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M-100 250 Q 250 180 500 280 T 900 200 T 1300 320 T 1600 250"
        stroke="url(#lineGradient)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M-100 400 Q 300 320 550 430 T 950 350 T 1350 480 T 1600 400"
        stroke="url(#lineGradient)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M-100 550 Q 200 480 450 580 T 850 500 T 1250 630 T 1600 550"
        stroke="url(#lineGradient)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M-100 700 Q 250 620 500 730 T 900 650 T 1300 780 T 1600 700"
        stroke="url(#lineGradient)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M-100 850 Q 300 780 550 880 T 950 800 T 1350 930 T 1600 850"
        stroke="url(#lineGradient)"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
};

export default DecorativeLines;