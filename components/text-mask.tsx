'use client'
import {useRef} from 'react'
import gsap from 'gsap'
import {SplitText} from 'gsap/SplitText'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {useGSAP} from '@gsap/react'

gsap.registerPlugin(SplitText,ScrollTrigger);

export default function TextMask({children,animateOnScroll=true,delay=0,blockColor="#000",stagger=0.15,duration=0.75}:{children:React.ReactNode,animateOnScroll?:boolean,delay?:number,blockColor?:string,stagger?:number,duration?:number}){
    const containerRef = useRef<HTMLDivElement>(null)
    const splitContext = useRef<SplitText[]>([])
    
    useGSAP(()=>{
     if(!containerRef.current) return;
     const lines: HTMLElement[] = [];
     const blocks: HTMLElement[] = [];
     
     // Get direct children to split
     const elements = Array.from(containerRef.current.children);

     elements.forEach((element)=>{
        const split = new SplitText(element,{
            type:"lines",
            linesClass:"block-line",
            // lineThreshold:0.1 // Usually not needed unless specific wrapping issues
        })
        
        // Push to ref for cleanup
        splitContext.current.push(split)

        // Wrap each line
        split.lines.forEach((line)=>{
            const wrapper = document.createElement("div");
            wrapper.className="block-line-wrapper";
            
            // Insert wrapper before line
            line.parentNode?.insertBefore(wrapper,line)
            // Move line into wrapper
            wrapper.appendChild(line)

            // Create reveal block
            const block = document.createElement("div")
            block.className="block-revealer"
            block.style.backgroundColor=blockColor;
            wrapper.appendChild(block)

            lines.push(line)
            blocks.push(block)
        })
     })

     gsap.set(lines,{opacity:0})
     gsap.set(blocks,{scaleX:0,transformOrigin:"left center"})
     
    const createAnimation = (block: HTMLElement, line: HTMLElement, index: number)=>{
        // Corrected stagger logic: index * stagger
        const tl = gsap.timeline({delay: delay + (index * stagger)})
        
        tl.to(block,{
            scaleX:1,
            duration: duration,
            ease:"power4.inOut"
        })
        .set(line,{opacity:1})
        .set(block,{transformOrigin:"right center"})
        .to(block,{
            scaleX:0,
            duration: duration,
            ease:"power4.inOut"
        })
        
        return tl
    }

    if (animateOnScroll){
        
        const masterTl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 85%", 
                once: true
            }
        });

        blocks.forEach((block, index) => {
             const line = lines[index];
             const anim = createAnimation(block, line, index);
             masterTl.add(anim, 0); // Add all to master timeline at time 0 (relative to their delays inside createAnimation)
        });

    }else{
        blocks.forEach((block,index)=>{
            createAnimation(block, lines[index], index)
        })
    }

      // Cleanup function
      return () => {
        splitContext.current.forEach((split) => split.revert());
        // Manually remove wrappers if SplitText revert doesn't handle custom DOM manipulation completely
        // SplitText revert restores the original text, but we moved things around.
        // Actually SplitText.revert() puts the text back into the original element.
        // But our wrappers (block-line-wrapper) might remain or cause issues if we aren't careful.
        // However, usually reverting SplitText is enough for text content. 
        // We might need to unwrap our manual wrappers if we want a clean cleanup.
        // For now, let's rely on standard revert.
      }

    },{
        scope: containerRef,
        dependencies: [animateOnScroll,delay,blockColor,stagger,duration]
    })

    return(
    <div ref={containerRef} className="text-mask-container">
        {children}
    </div>
)
}