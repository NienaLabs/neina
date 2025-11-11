import { analysisPrompt, extractionPrompt, scorePrompt } from "@/constants/prompts";
import { inngest } from "./client";
import { createAgent, createNetwork, openai } from "@inngest/agent-kit";

// 1️⃣ Define your agents
const parserAgent = createAgent({
  name: "parser-agent",
  system: extractionPrompt,
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
  }),
});

const analysisAgent = createAgent({
  name: "analysis-agent",
  system: analysisPrompt,
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
  }),
});

const scoreAgent = createAgent({
  name: "score-agent",
  system: scorePrompt,
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
  }),
});

// 2️⃣ Define a clean pipeline sequence
const pipeline = [parserAgent, analysisAgent, scoreAgent];

// 3️⃣ Create the network with static routing logic
const network = createNetwork({
  name:'resume-processing-network',
  agents: pipeline,
  router: ({ callCount }) => {
    // Route strictly based on sequence
    const nextAgent = pipeline[callCount];
    return nextAgent ?? undefined; // Stop when done
  },
});

// 4️⃣ Example Inngest function
export const helloWorld = inngest.createFunction(
  { id: "resume-parser-demo" },
  { event: "test/hello.world" },
  async () => {
    const resumeText = `
 
 
Adusei Williams  
swiftwilliams868@gmail.com| 0556732796  
[https://github.com/Williamboy868]                                  
(https://www.linkedin.com/in/williams-adusei-a1053a366?utm_source=share&utm_campaign=share_vi
 a&utm_content=profile&utm_medium=android_app) 
 
PROFILE  
 
I am a self-motivated undergraduate graduate pursuing a degree in Computer Science. My academic background and experience has 
equipped me with strong skills in software development . I am recognized for my excellent communication, supervisory, and 
exceptional problem solving abilities, and I am adept at building enthusiastic teams and achieving exceptional results. I excel in 
competitive, efficient, and quality-driven environments, and I am eager to leverage my skills and education to drive growth and 
deliver outstanding results in the software industry. 
EDUCATION 
 
BSc. Computer Science , Expected to graduate September 2027 
Kwame Nkrumah University of Science and Technology (KNUST), Kumasi, Ghana 
 
W.A.S.S.C.E (General Science)  September 2021 – September 2023 
Osei Kyeretwie Senior High School , Kumasi, Ghana 
 
WORK EXPERIENCE   
Intern, Zap Technologies 
September 2024 – November 2024  
● Assisted in the development of an ecommerce brand store app and an educational app 
   Erecox 
   Mobile App Developer  
    February 2025 - March 2025 
●    Worked as the mobile app developer for the  
                  development of a multi-tenancy fintech 
                  application   called Copsys but project was    
                  abandoned before completion  
  
VOLUNTARY/EXTRA-CURRICULAR ACTIVITY 
●  Engineered a robust, full-stack Chat and Video Calling application using cutting-edge technologies like TypeScript ,React 
Native and Supabase demonstrating end-to-end development capabilities. 
● Developed an intelligent Terminal Password Checker in Python, a security-focused tool designed to assess password 
vulnerability against known breaches, highlighting proactive problem-solving and scripting skills. 
 
 
SKILLS AND ABILITIES 
● Mastery in React Native: Possessing deep expertise in developing high-performance mobile applications. 
● Advanced Proficiency in Java: Highly skilled in Java and its critical frameworks, including Spring Boot and Spring 
Security, for robust backend development. 
● Proficiency in C++ and TypeScript: Competent in leveraging these languages for diverse development needs. 
●  Skilled in Python: Capable of utilizing Python for scripting, automation, and development tasks. 
● Database Management: Experienced with SQL and SQL Server for database design, querying, and management. 
● Foundational Knowledge in C#: Developing skills in C#. 
● Exceptional Problem Solving & Critical Thinking: Proven ability to analyze complex issues and devise effective 
solutions. 
 
 
 
 
 
 
 
REFEREES  
Operations Manager, Zap Technologies 
Name: Samuel Agyemang  
Email: agyemangsamuel235@gmail.com 
Phone Number: 0559911251 
Erecox  
Name: Eric Mensah  
Email: ericmensah@erecox.com 
Phone Number: 0246092155 
`;

    // Run through the network (parser → analysis → score)
    const result = await network.run(resumeText);

    return result // Final stage (scoreAgent) output
  }
);
