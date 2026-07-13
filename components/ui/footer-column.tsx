"use client"
import {
  Instagram,
  Linkedin,
  Mail,
  Phone,
  Twitter
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image'
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const data = {
  instaLink: 'https://instagram.com/nienalabs',
  twitterLink: 'https://x.com/LabsNiena86233',
  linkedinLink: 'https://www.linkedin.com/company/niena-labs/',
  services: {
    webdev: '/web-development',
    webdesign: '/web-design',
  },
  company: {
    history: '/company-history',
    team: '/meet-the-team',
    careers: '/careers',
  },
  contact: {
    email: 'hello@nienalabs.com',
    phone: '+233556732796',
  },
  brand: {
    name: 'niena',
    description:
      'We chase problems others avoid. Our mission is relentless and simple: create something that matters, shapes the future and leaves the world different from how we found it.',
    logo: '/logo.webp',
  },
};

const socialLinks = [
  { icon: Linkedin, label: 'LinkedIn', href: data.linkedinLink },
  { icon: Twitter, label: 'Twitter', href: data.twitterLink },
  { icon: Instagram, label: 'Instagram', href: data.instaLink },
];

export default function Footer4Col() {
  const footerRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    // Animate grid columns
    const columns = footerRef.current?.querySelectorAll(".footer-col")

    gsap.from(columns || [], {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: footerRef.current,
        start: "top 90%"
      }
    })

    // Animate the giant NIENA text
    const textRef = footerRef.current?.querySelector(".giant-text");
    if (textRef) {
      gsap.from(textRef, {
        y: 100,
        opacity: 0,
        scale: 0.95,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: textRef,
          start: "top 95%",
        }
      });
    }

    // Animate cloud
    const cloudRefs = footerRef.current?.querySelectorAll(".cloud-gradient");
    if (cloudRefs && cloudRefs.length > 0) {
      gsap.fromTo(cloudRefs, 
        { opacity: 0, scale: 0.8, y: 50 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.5,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 90%",
          }
        }
      );
    }
  }, { scope: footerRef })

  return (
    <footer ref={footerRef} id="footer" className="relative bg-secondary/30 dark:bg-secondary/10 mt-16 w-full rounded-t-3xl overflow-hidden border-t border-border/40">
      {/* Top Section - Reduced items */}
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 lg:px-8 relative z-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          
          {/* Brand Col */}
          <div className="footer-col flex flex-col items-center lg:items-start text-center lg:text-left">
            <Image
              src={'/niena-logo.png'}
              alt="Niena logo"
              width={40}
              height={52}
              className="object-contain dark:invert mb-6"
            />
            <p className="text-foreground/70 max-w-md text-sm md:text-base leading-relaxed">
              {data.brand.description}
            </p>
            <ul className="mt-8 flex gap-6">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-foreground/60 hover:text-primary transition-colors duration-300"
                  >
                    <span className="sr-only">{label}</span>
                    <Icon className="size-6" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Grid - Simplified to 3 small columns */}
          <div className="footer-col grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
            {/* Services */}
            <div>
              <p className="text-lg font-semibold text-foreground mb-6">Services</p>
              <ul className="space-y-4 text-sm">
                <li><Link href={data.services.webdev} className="text-foreground/60 hover:text-primary transition-colors">Web Development</Link></li>
                <li><Link href={data.services.webdesign} className="text-foreground/60 hover:text-primary transition-colors">Web Design</Link></li>
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <p className="text-lg font-semibold text-foreground mb-6">Company</p>
              <ul className="space-y-4 text-sm">
                <li><Link href={data.company.history} className="text-foreground/60 hover:text-primary transition-colors">History</Link></li>
                <li><Link href={data.company.team} className="text-foreground/60 hover:text-primary transition-colors">Team</Link></li>
                <li><Link href={data.company.careers} className="text-foreground/60 hover:text-primary transition-colors">Careers</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-lg font-semibold text-foreground mb-6">Contact</p>
              <ul className="space-y-4 text-sm">
                <li>
                  <a href={`mailto:${data.contact.email}`} className="text-foreground/60 hover:text-primary transition-colors flex items-center justify-center sm:justify-start gap-2">
                    <Mail className="size-4" /> Email Us
                  </a>
                </li>
                <li>
                  <a href={`tel:${data.contact.phone.replace(/[^0-9+]/g, '')}`} className="text-foreground/60 hover:text-primary transition-colors flex items-center justify-center sm:justify-start gap-2">
                    <Phone className="size-4" /> Call Us
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Small Bottom Text */}
        <div className="footer-col mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-foreground/50">
          <p>&copy; {new Date().getFullYear()} {data.brand.name.toUpperCase()}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>

      {/* Giant Niena Text & Cloud Gradient Background */}
      <div className="relative w-full flex justify-center items-end mt-12 md:mt-16 pt-10 pb-4 overflow-hidden pointer-events-none select-none">
        {/* Cloud Gradients */}
        <div className="cloud-gradient absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[120%] md:w-[80%] h-[300px] bg-gradient-to-t from-[#9333ea]/50 via-[#a855f7]/30 to-transparent blur-[80px] rounded-[100%] dark:mix-blend-screen z-0"></div>
        <div className="cloud-gradient absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[150px] bg-[hsl(265,85%,60%)]/40 blur-[60px] rounded-full z-0"></div>
        
        {/* Text */}
        <h1 className="giant-text w-full text-center text-[18vw] md:text-[19vw] font-extrabold leading-[0.75] tracking-tighter text-foreground dark:text-foreground/90 uppercase z-10" style={{ fontFamily: "'Syne', sans-serif", textShadow: "0 20px 60px rgba(0,0,0,0.1)" }}>
          NIENA
        </h1>
      </div>
    </footer>
  );
}
