'use client'
import gsap from 'gsap'
import {useGSAP} from '@gsap/react'
import Image from 'next/image'
import {ScrollTrigger} from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function HowWeHelp(){
useGSAP(()=>{
    ScrollTrigger.create({
        trigger:'.services',
        start:'top bottom',
        end:'top top',
        scrub:1,
        onUpdate:(self)=>{
            const headers = document.querySelectorAll('.services-header');
            gsap.set(headers[0],{x:`${100- self.progress*100}%`})
            gsap.set(headers[1],{x:`${-100+ self.progress*100}%`})
            gsap.set(headers[2],{x:`${100- self.progress*100}%`})
        }
    })
    ScrollTrigger.create({
        trigger:'.services',
        start:'top top',
        end:`+=${window.innerHeight * 2}`,
        scrub:1,
        pin:true,
        pinSpacing:false,
        onUpdate:(self)=>{
            const headers = document.querySelectorAll(".services-header")

            if(self.progress <= 0.5){
                const yProgress = self.progress/0.5;
                gsap.set(headers[0],{y:`${yProgress * 100}%`})
                   gsap.set(headers[2],{y:`${yProgress * -100}%`})           
            }
            else{
                   gsap.set(headers[0],{y:'100%'})
                      gsap.set(headers[2],{y:'-100%'})
                      const scaleProgress = (self.progress - 0.5)/0.5;
                      const minScale = window.innerWidth <= 1000?0.3:0.1;
                      const scale = 1 - scaleProgress * (1 - minScale)
                      headers.forEach((header)=>gsap.set(header,{scale}))
                    }
        }
        
    })
})    
    return(
     <section className="services">
        <div className="services-header p-4"><Image  src="/text.svg"  fill className="object-contain" alt="how we help you"/></div>
        <div className="services-header p-4"><Image  src="/text.svg"  fill className="object-contain" alt="how we help you"/></div>
        <div className="services-header p-4"><Image  src="/text.svg" fill className="object-contain" alt="how we help you"/></div>

     </section>
    )
}