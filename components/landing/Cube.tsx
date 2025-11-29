'use client'
import Image from 'next/image'
import {useIsMobile} from '@/hooks/use-mobile'
/**
 * 3D Tumbling Cube Component 
 * Fixed: Uses inline styles for 3D transforms to ensure depth renders correctly
 * regardless of Tailwind configuration.
 */
const Cube = () => {
  // Size of the cube (width/height). 
  const isMobile =useIsMobile()
  const sizeClass = "w-32 h-32 md:w-50 md:h-50"; 
  const translateOffset = isMobile?"4rem": "6.25rem"; // 64px (Half of w-32)

  // Common styles for all 6 faces
  const faceCommon = `
    absolute inset-0 
    flex items-center justify-center 
    bg-indigo-900/20 backdrop-blur-sm
    shadow-[0_0_15px_rgba(99,102,241,0.3)]
    text-white font-bold text-xl
    backface-visible
  `;

  return (
    <div className="relative group perspective-container">
      <style>{`
      @keyframes tumble {
          0% { 
            transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); 
          }
          100% { 
            transform: rotateX(720deg) rotateY(720deg) rotateZ(360deg); 
          }
        }
        .animate-tumble {
          animation: tumble 20s infinite linear;
           will-change: transform; 
        }
        .group:hover .animate-tumble {
          animation-play-state: paused;
        }
      `}</style>

      {/* FIX: using inline styles for perspective and transformStyle.
         This guarantees the 3D space is created even if Tailwind classes fail.
      */}
      <div 
        className={`relative ${sizeClass}`} 
        style={{ perspective: '1000px' }}
      >
        <div 
          className="w-full h-full relative animate-tumble" 
          style={{ transformStyle: 'preserve-3d',transform: 'translateZ(0)',
 }}
        >
          
          {/* Front Face */}
          <div 
            className={faceCommon}
            style={{ transform: `rotateY(0deg) translateZ(${translateOffset})` }}
          >
            <Image objectFit='cover' fill alt="side1" src="/side1.jpg"/>  
                  </div>

          {/* Back Face */}
          <div 
            className={faceCommon}
            style={{ transform: `rotateY(180deg) translateZ(${translateOffset})` }}
          >
            <Image objectFit='cover' fill alt="side1" src="/side2.jpg"/> 
          </div>

          {/* Right Face */}
          <div 
            className={faceCommon}
            style={{ transform: `rotateY(90deg) translateZ(${translateOffset})` }}
          >
             <Image objectFit='cover' fill alt="side1" src="/side3.jpg"/> 
          </div>

          {/* Left Face */}
          <div 
            className={faceCommon}
            style={{ transform: `rotateY(-90deg) translateZ(${translateOffset})` }}
          >
             <Image objectFit='cover' fill alt="side1" src="/side4.jpg"/> 
          </div>

          {/* Top Face */}
          <div 
            className={faceCommon}
            style={{ transform: `rotateX(90deg) translateZ(${translateOffset})` }}
          >
              <Image objectFit='cover' fill alt="side1" src="/side5.jpg"/> 
          </div>

          {/* Bottom Face */}
          <div 
            className={faceCommon}
            style={{ transform: `rotateX(-90deg) translateZ(${translateOffset})` }}
          >
             <Image objectFit='cover' fill alt="side1" src="/side6.jpg"/> 
          </div>

        </div>
      </div>
    </div>
  );
};



export default Cube;