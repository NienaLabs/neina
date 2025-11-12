import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import { motion } from "motion/react";

const testimonials = [
  {
    text: "The AI resume builder helped me land interviews at top tech companies. I went from no responses to multiple offers in just two weeks!",
    image: "https://randomuser.me/api/portraits/men/1.jpg",
    name: "Michael Chen",
    role: "Senior Software Engineer at Google",
  },
  {
    text: "The interview preparation tools were a game-changer. The AI mock interviews helped me practice and build confidence before the real thing.",
    image: "https://randomuser.me/api/portraits/women/2.jpg",
    name: "Jessica Williams",
    role: "Product Manager at Microsoft",
  },
  {
    text: "I was able to tailor my application for each job using their AI suggestions. The difference in response rate was incredible!",
    image: "https://randomuser.me/api/portraits/men/3.jpg",
    name: "David Kim",
    role: "Data Scientist at Amazon",
  },
  {
    text: "The job matching algorithm found opportunities I would have never discovered on my own. Got my dream job in just a month!",
    image: "https://randomuser.me/api/portraits/women/4.jpg",
    name: "Sarah Johnson",
    role: "UX Designer at Spotify",
  },
  {
    text: "The salary negotiation tips helped me increase my offer by $25,000. This platform paid for itself a hundred times over!",
    image: "https://randomuser.me/api/portraits/men/5.jpg",
    name: "Robert Taylor",
    role: "Engineering Lead at Stripe",
  },
  {
    text: "As a career changer, the skills gap analysis was invaluable. It showed me exactly what I needed to learn to break into tech.",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
    name: "Emily Rodriguez",
    role: "Frontend Developer at Airbnb",
  },
  {
    text: "The AI-powered resume review caught issues I'd missed for years. My interview invitations tripled after making their suggested changes.",
    image: "https://randomuser.me/api/portraits/men/7.jpg",
    name: "James Wilson",
    role: "DevOps Engineer at Netflix",
  },
  {
    text: "I was skeptical about AI helping with job search, but the personalized cover letter generator saved me hours and got me noticed.",
    image: "https://randomuser.me/api/portraits/women/8.jpg",
    name: "Olivia Martin",
    role: "Marketing Director at HubSpot",
  },
  {
    text: "The interview question predictor was scarily accurate. I walked into every interview feeling prepared and confident.",
    image: "https://randomuser.me/api/portraits/men/9.jpg",
    name: "Daniel Lee",
    role: "Senior Product Designer at Slack",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);


const Testimonials = () => {
  return (
    <section className="bg-background my-20 relative">

      <div className="container z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="border py-1 px-4 rounded-lg">Testimonials</div>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5">
            What our users say
          </h2>
          <p className="text-center mt-5 opacity-75">
            See what our customers have to say about us.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;