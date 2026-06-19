import Image from 'next/image'

interface ClaraLogoProps {
  size?: number
  className?: string
  showText?: boolean
  thinking?: boolean
  textSize?: string
}

export default function ClaraLogo({
  size = 40,
  className = '',
  showText = false,
  thinking = false,
  textSize = 'text-xl',
}: ClaraLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        style={{ width: size, height: size }}
        className={`relative flex-shrink-0 ${thinking ? 'logo-thinking' : ''}`}
      >
        <Image
          src="/icons/clara-logo.png"
          alt="Clara"
          width={size}
          height={size}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span
          className={`font-semibold tracking-tight text-white ${textSize}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Clara
        </span>
      )}
    </div>
  )
}
