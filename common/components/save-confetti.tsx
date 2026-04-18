import { useEffect, useState } from 'react'

const COLORS = ['#ff89ad', '#59faba', '#9de1ff', '#FFD700', '#ff709f', '#47ecad']

interface SaveConfettiProps {
  trigger: number
}

export function SaveConfetti({ trigger }: SaveConfettiProps) {
  const [pieces, setPieces] = useState<{ id: number; left: number; color: string; delay: number; size: number }[]>([])

  useEffect(() => {
    if (trigger === 0) return
    const next = Array.from({ length: 48 }, (_, i) => ({
      id: trigger * 1000 + i,
      left: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.4,
      size: 6 + Math.random() * 6,
    }))
    setPieces(next)
    const t = setTimeout(() => setPieces([]), 2800)
    return () => clearTimeout(t)
  }, [trigger])

  if (pieces.length === 0) return null

  return (
    <>
      <style jsx global>{`
        @keyframes piggy-confetti-fall {
          0% {
            transform: translateY(-5vh) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(720deg) scale(0.6);
            opacity: 0;
          }
        }
        .piggy-confetti-piece {
          position: absolute;
          top: -12px;
          border-radius: 2px;
          animation: piggy-confetti-fall 2.4s ease-out forwards;
          pointer-events: none;
        }
      `}</style>
      <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
        {pieces.map((p) => (
          <span
            key={p.id}
            className="piggy-confetti-piece"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
    </>
  )
}
