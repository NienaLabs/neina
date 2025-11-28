import { Testimonial } from "@/components/ui/testimonial-card"
import { Star } from "lucide-react"
import Image from 'next/image'

const testimonials = [
  {
    name: "Michael Chen",
    role: "Software Engineer",
    company: "TechCorp",
    rating: 5,
    image: "https://i.pravatar.cc/150?u=michael",
    testimonial: "This platform cut my job search time in half! The AI helped me land 5 interviews in just 2 weeks by optimizing my applications for each role. The automated follow-ups were a game-changer."
  },
  {
    name: "Sarah Johnson",
    role: "Product Manager",
    company: "InnoTech",
    rating: 5,
    image: "https://i.pravatar.cc/150?u=sarah",
    testimonial: "As someone switching careers, I was struggling to get noticed. The AI helped me translate my experience into tech-relevant skills, and I got my first product manager interview within a week!"
  },
  {
    name: "David Kim",
    role: "Recent Graduate",
    company: "State University",
    rating: 4,
    image: "https://i.pravatar.cc/150?u=david",
    testimonial: "The platform's resume builder and cover letter generator are incredible. I went from no responses to multiple interview requests after using the AI suggestions to improve my application materials."
  },
  {
    name: "Priya Patel",
    role: "UX Designer",
    company: "DesignHub",
    rating: 5,
    image: "https://i.pravatar.cc/150?u=priya",
    testimonial: "The interview preparation tools were a lifesaver! The AI mock interviews helped me practice and refine my answers. I felt so much more confident in my actual interviews."
  },
  {
    name: "James Wilson",
    role: "Senior Developer",
    company: "CodeForge",
    rating: 5,
    image: "https://i.pravatar.cc/150?u=james",
    testimonial: "After 10 years in the industry, I was skeptical about needing help, but the AI found ways to improve my resume I never considered. I landed a leadership role with a 30% salary increase!"
  },
  {
    name: "Emily Rodriguez",
    role: "Marketing Specialist",
    company: "BrandVista",
    rating: 4,
    image: "https://i.pravatar.cc/150?u=emily",
    testimonial: "The job matching algorithm is spot-on. It found positions that were a perfect fit for my skills and experience that I wouldn't have found on my own. The application tracker kept me organized throughout the process."
  }
]

export function TestimonialDemo() {
  return (
    <section className="relative py-16 sm:py-24 lg:py-28">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)]" />
      </div>
      
      <div className="container px-4 mx-auto sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Loved by Job Hunters across different domains
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Join the satisfied users who have transformed their careers with our tools.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.name}
              className="h-full transition-transform duration-300 hover:scale-[1.02]"
            >
              <Testimonial 
                {...testimonial} 
                className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/20"
              />
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-muted-foreground bg-muted/50 rounded-full">
            <div className="flex -space-x-2">
              {testimonials.slice(0, 3).map((testimonial, index) => (
                <Image
                  key={index}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border-2 border-background"
                  src={testimonial.image}
                  alt={testimonial.name}
                />
              ))}
            </div>
            <span>Trusted by job seekers around the world</span>
          </div>
        </div>
      </div>
    </section>
  )
}