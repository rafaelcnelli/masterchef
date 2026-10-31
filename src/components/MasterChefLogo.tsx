import React from 'react';

interface MasterChefLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

/**
 * Iconic MasterChef emblem: The stylized spiral stove-burner 'm' topped with a chef's hat (toque),
 * rendered in glowing MasterChef orange over deep studio black.
 */
export const MasterChefLogo: React.FC<MasterChefLogoProps> = ({
  size = 'md',
  showText = true,
  animated = false,
  className = '',
}) => {
  const dimensions = {
    sm: { svg: 40, text: 'text-lg', sub: 'text-[10px]' },
    md: { svg: 64, text: 'text-2xl', sub: 'text-xs' },
    lg: { svg: 96, text: 'text-3xl', sub: 'text-xs' },
    xl: { svg: 132, text: 'text-4xl', sub: 'text-sm' },
  }[size];

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        {animated && (
          <div
            className="absolute inset-0 rounded-full bg-orange-500/20 blur-xl animate-pulse pointer-events-none"
            aria-hidden="true"
          />
        )}
        <svg
          width={dimensions.svg}
          height={dimensions.svg}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Logo MasterChef"
          className="drop-shadow-[0_0_16px_rgba(255,107,0,0.65)]"
        >
          <defs>
            <linearGradient id="mcFlameGrad" x1="15" y1="10" x2="105" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFB800" />
              <stop offset="45%" stopColor="#FF6B00" />
              <stop offset="100%" stopColor="#EA3800" />
            </linearGradient>
            <linearGradient id="mcInnerGlow" x1="60" y1="0" x2="60" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF8A00" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FF4500" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Subtle ambient dark disc */}
          <circle cx="60" cy="64" r="50" fill="url(#mcInnerGlow)" />

          {/* Chef's Toque (Crown of the MasterChef Emblem) */}
          <path
            d="M46 21C42.5 21 39.5 18.4 39.5 15C39.5 11.8 42.2 9.4 45.4 9.7C47.1 6.2 51.1 4 55.5 4C58.8 4 61.8 5.3 63.7 7.5C65.6 5.3 68.6 4 72 4C76.4 4 80.4 6.2 82.1 9.7C85.3 9.4 88 11.8 88 15C88 18.4 85 21 81.5 21H46Z"
            stroke="url(#mcFlameGrad)"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Toque headband */}
          <path
            d="M45 25.5H82.5"
            stroke="url(#mcFlameGrad)"
            strokeWidth="4.2"
            strokeLinecap="round"
          />

          {/* Outer Spiral Circle of the MasterChef Burner */}
          <path
            d="M36 28.5C21.8 36.8 13 52.2 14.2 69.5C15.7 92.2 34.8 110.3 57.5 111.3C82.4 112.4 103.5 93.3 105.5 68.5C106.9 51.3 98.2 35.6 84 27.5"
            stroke="url(#mcFlameGrad)"
            strokeWidth="5.2"
            strokeLinecap="round"
          />

          {/* Middle Concentric Spiral Loop */}
          <path
            d="M32.5 42C24.5 50.8 21.5 63.2 25.2 75.5C30.2 91.8 47.4 101.5 64.2 98.2C80.8 95 92.5 80.2 92.5 63.2C92.5 51.2 86.2 40.5 76.5 34.5"
            stroke="url(#mcFlameGrad)"
            strokeWidth="4.8"
            strokeLinecap="round"
          />

          {/* Iconic Stylized 'm' Arches inside the Spiral */}
          <path
            d="M38 82V58.5C38 51.6 43.4 46 50 46C56.6 46 60 51.2 60 57.5V79"
            stroke="url(#mcFlameGrad)"
            strokeWidth="6.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M60 58.5C60 51.6 65.4 46 72 46C78.6 46 82 51.6 82 58.5V82"
            stroke="url(#mcFlameGrad)"
            strokeWidth="6.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="mt-1.5 flex flex-col items-center leading-none">
          <span
            className={`font-display font-bold tracking-tight text-orange-500 mc-text-glow ${dimensions.text}`}
          >
            Master<span className="text-amber-400">Chef</span>
          </span>
          <span
            className={`mt-1 font-mono uppercase tracking-[0.28em] text-orange-400/80 ${dimensions.sub}`}
          >
            Cronômetro Oficial
          </span>
        </div>
      )}
    </div>
  );
};
