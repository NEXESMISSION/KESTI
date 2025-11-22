import { useEffect, useState } from 'react'

interface ImageSliderProps {
  images: string[]
  autoPlayInterval?: number
}

const labels = ['لوحة التحكم', 'التقارير', 'نقطة البيع', 'الأرباح', 'المخزون']
const icons = ['🎯', '📊', '📱', '💰', '📈']

export default function ImageSlider({ images, autoPlayInterval = 3000 }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [images.length, autoPlayInterval])

  const getVisibleImages = () => {
    const visibleCount = 5
    const result = []
    
    for (let i = -2; i <= 2; i++) {
      const index = (currentIndex + i + images.length) % images.length
      result.push({
        src: images[index],
        position: i,
        key: `${index}-${i}`
      })
    }
    
    return result
  }

  const getImageStyles = (position: number) => {
    const baseScale = 0.65
    const centerScale = 1.1
    const zIndex = 5 - Math.abs(position)
    const opacity = Math.max(0.4, 1 - Math.abs(position) * 0.25)
    
    // Calculate scale based on distance from center
    const scale = position === 0 
      ? centerScale 
      : baseScale - Math.abs(position) * 0.08

    // Calculate horizontal offset for RTL
    const translateX = position * -42 // negative for right-to-left
    
    return {
      transform: `translateX(${translateX}%) scale(${scale})`,
      zIndex,
      opacity,
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }

  return (
    <div className="relative w-full h-64 md:h-80 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        {getVisibleImages().map(({ src, position, key }, idx) => {
          const imageIndex = (currentIndex + position + images.length) % images.length
          return (
            <div
              key={key}
              className="absolute"
              style={getImageStyles(position)}
            >
              <div className="relative w-44 h-44 md:w-60 md:h-60 bg-white/20 backdrop-blur-md rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden border-2 border-white/40">
                {/* Placeholder for actual images */}
                <div className="text-center p-6">
                  <div className="text-5xl md:text-6xl mb-2">
                    {icons[imageIndex]}
                  </div>
                  <p className="text-white text-xs md:text-sm font-bold drop-shadow-lg">
                    {labels[imageIndex]}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Navigation dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-white w-8' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
