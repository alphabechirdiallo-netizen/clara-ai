interface ClaraLogoProps {
  size?: number
  className?: string
  showText?: boolean
}

export default function ClaraLogo({ size = 40, className = '', showText = false }: ClaraLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo mark */}
      <div
        style={{ width: size, height: size }}
        className="relative flex-shrink-0"
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer ring */}
          <circle cx="24" cy="24" r="23" stroke="#f97316" strokeWidth="1.5" opacity="0.3" />
          {/* Inner ring */}
          <circle cx="24" cy="24" r="18" stroke="#f97316" strokeWidth="1" opacity="0.15" />
          {/* Core shape - stylized C for Clara */}
          <path
            d="M30 14C27.2 12.7 24 12 20.5 13C14.5 14.8 10.5 20.5 11.5 26.8C12.5 33 18.5 37.2 24.8 36.2C27.5 35.8 29.8 34.5 31.5 32.6"
            stroke="#f97316"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Inner dot */}
          <circle cx="24" cy="24" r="3" fill="#f97316" />
          {/* Accent lines */}
          <line x1="24" y1="8" x2="24" y2="12" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <line x1="36.5" y1="12.5" x2="33.5" y2="15.5" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          <line x1="40" y1="24" x2="36" y2="24" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        </svg>
      </div>
      {showText && (
        <span
          style={{ fontSize: size * 0.5 }}
          className="font-semibold tracking-tight text-[#fafafa]"
        >
          Clara
        </span>
      )}
    </div>
  )
}
