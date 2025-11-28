import { useState, useLayoutEffect } from "react"

export const useScroll = (): boolean => {    const [isScrolled,setIsScrolled] = useState(false)

   useLayoutEffect(() => {
  const handleScroll = () => {
    requestAnimationFrame(() => {
      setIsScrolled(window.scrollY > 0);
    });
  };
  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

    return isScrolled

}