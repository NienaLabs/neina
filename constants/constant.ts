import {
  Blocks,
  Home,
  Inbox,
  MessageCircleQuestion,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react"


export const data = {
  navMain: [
    {
      title: "Job Search",
      url: "/job-search",
      icon: Search,
     
    },
    {
      title: "Resume AI",
      url: "/resume",
      icon: Sparkles,
      
    },
    {
      title: "Home",
      url: "/dashboard",
      icon: Home,
      
    },
    {
      title: "Interview AI",
      url: "/interview",
      icon: Inbox
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
    },
    {
      title: "Templates",
      url: "#",
      icon: Blocks,
    },
    {
      title: "Help",
      url: "#",
      icon: MessageCircleQuestion,
    },
  ],
  }

  export const resumeTags =[
   "critical",
   "urgent"
  ]