import { inngest } from "./client";
import { createNetwork, createState } from "@inngest/agent-kit";
import prisma from "@/lib/prisma";
import { parserAgent, analysisAgent, jobExtractorAgent, autofixAgent } from "./agents";
import { generateEmbedding } from "@/lib/embeddings";
import { cosineSimilarity, parseVectorString } from "@/lib/utils";

interface AgentState {
  parserAgent:string;
  analyserAgent:string;
  autofixAgent:string;
}

// 1. Parser Network (Extraction Only) -> Runs on Raw Resume Content
const parserNetwork = createNetwork({
  name: 'tailored-resume-parser-network',
  agents: [parserAgent],
  defaultState: createState<AgentState>({
    parserAgent:"",
    analyserAgent:"",
    autofixAgent:""
  }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return parserAgent;
  },
});

// 2. Issue Analysis Network (Analysis Only) -> Runs on Full Context
const issueNetwork = createNetwork({
  name: 'tailored-resume-analysis-network',
  defaultState: createState<AgentState>({
    parserAgent:"",
    analyserAgent:"",
    autofixAgent:""
  }),
  agents: [analysisAgent],
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return analysisAgent;
  },
});

// 3. Autofix Network
const autofixNetwork = createNetwork({
  name: 'tailored-resume-autofix-network',
  agents: [autofixAgent],
  defaultState: createState<AgentState>({
    parserAgent:"",
    analyserAgent:"",
    autofixAgent:""
  }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return autofixAgent;
  },
});

const jobExtractionNetwork = createNetwork({
  name: 'job-extraction-network',
  agents: [jobExtractorAgent],
  defaultState: createState<{ jobExtractorAgent: string }>({
    jobExtractorAgent: ''
  }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return jobExtractorAgent;
  }
});

export const tailoredResumeCreated = inngest.createFunction(
  { id: "tailored-resume-AI-workflow" },
  { event: "app/tailored-resume.created" },
  async ({step,event}) => {
    try {
        const resumeText =`
        #Resume
        ${event.data.content}
        
        #Targetted Role
        ${event.data.role}
        #Job Description
        ${event.data.description}
        `
        
        // 1. Run Parser (Raw Content Only)
        const parserResult = await parserNetwork.run(event.data.content);
        const parserData = parserResult.state.data.parserAgent;

        // 2. Run Analysis (Full Context)
        const analysisResult = await issueNetwork.run(resumeText);
        const analysisDataRaw = analysisResult.state.data.analyserAgent;

        // 3. Run Autofix (Using Issues from Analysis)
        let mergedAnalysisData = analysisDataRaw;

        if (analysisDataRaw) {
            try {
                const autofixInput = `
                ${resumeText}

                ---------------------------------------------------
                # ANALYZED ISSUES
                ${analysisDataRaw}
                ---------------------------------------------------
                `;

                const autofixResult = await autofixNetwork.run(autofixInput);
                const autofixDataRaw = autofixResult.state.data.autofixAgent;

                if (autofixDataRaw && analysisDataRaw) {
                    const analysisJson = JSON.parse(analysisDataRaw);
                    const autofixJson = JSON.parse(autofixDataRaw);

                    if (analysisJson.fixes) {
                        for (const [sectionName, issues] of Object.entries(analysisJson.fixes)) {
                           if (autofixJson[sectionName] && Array.isArray(issues)) {
                               (issues as any[]).forEach(issue => {
                                   issue.autoFix = autofixJson[sectionName];
                               });
                           }
                        }
                    }
                    mergedAnalysisData = JSON.stringify(analysisJson);
                }
            } catch (e) {
                console.error("Autofix generation failed:", e);
            }
        }

        // Extract skills and responsibilities (Moved out of step.run to avoid NESTING_STEPS)
        let extractedSkills: string[] = [];
        let extractedResponsibilities: string[] = [];
        try {
          const extractionState = createState<{ jobExtractorAgent: string }>({
            jobExtractorAgent: ''
          });
          const extractionResult = await jobExtractionNetwork.run(event.data.description, { state: extractionState });
          const extracted = JSON.parse(extractionResult.state.data.jobExtractorAgent || '{}');
          extractedSkills = extracted.skills || [];
          extractedResponsibilities = extracted.responsibilities || [];
        } catch (err) {
          console.error('[tailoredResumeCreated] Failed to extract job data with LLM:', err);
        }

        const { jobDescriptionEmbedding, jobSkillsEmbedding, jobResponsibilitiesEmbedding, scores } = await step.run("generate-embedding-and-score", async () => {
          // Generate embeddings for job description, skills, and responsibilities
          const jobDescriptionEmbedding = await generateEmbedding(event.data.description);
          const jobSkillsEmbedding = extractedSkills.length > 0
            ? await generateEmbedding(extractedSkills.join('\n'))
            : [];
          const jobResponsibilitiesEmbedding = extractedResponsibilities.length > 0
            ? await generateEmbedding(extractedResponsibilities.join('\n'))
            : [];

          // Fetch full resume embedding
          const fullResumeResult: { embedding: string }[] = await prisma.$queryRaw`
            SELECT embedding FROM "resume" WHERE "id" = ${event.data.primaryResumeId}
          `;
          const fullResumeEmbedding = parseVectorString(fullResumeResult[0]?.embedding);

          // Fetch skills and experience embeddings from resume
          const skillsResult: { embedding: string }[] = await prisma.$queryRaw`
            SELECT embedding FROM "resume_skills" WHERE "resume_id" = ${event.data.primaryResumeId}
          `;
          const skillsEmbedding = parseVectorString(skillsResult[0]?.embedding);

          const experienceResult: { embedding: string }[] = await prisma.$queryRaw`
            SELECT embedding FROM "resume_experience" WHERE "resume_id" = ${event.data.primaryResumeId}
          `;
          const experienceEmbedding = parseVectorString(experienceResult[0]?.embedding);

          // Calculate scores
          const overallScore = fullResumeEmbedding.length > 0 && jobDescriptionEmbedding.length > 0
            ? cosineSimilarity(fullResumeEmbedding, jobDescriptionEmbedding)
            : 0;

          const skillsScore = skillsEmbedding.length > 0 && jobSkillsEmbedding.length > 0
            ? cosineSimilarity(skillsEmbedding, jobSkillsEmbedding)
            : 0;

          const experienceScore = experienceEmbedding.length > 0 && jobResponsibilitiesEmbedding.length > 0
            ? cosineSimilarity(experienceEmbedding, jobResponsibilitiesEmbedding)
            : 0;
          
          // Weighted final score: 0.4*overall + 0.3*skills + 0.3*experience
          const finalScore = 0.4 * overallScore + 0.3 * skillsScore + 0.3 * experienceScore;

          return {
            jobDescriptionEmbedding,
            jobSkillsEmbedding,
            jobResponsibilitiesEmbedding,
            scores: {
              overallScore,
              skillsScore,
              experienceScore,
              finalScore,
            },
          };
        });

        await step.run("save-tailored-resume", async () => {
          // Update existing tailored resume
          const tailoredResume = await prisma.tailoredResume.update({
            where: { id: event.data.resumeId },
            data: {
              name: event.data.name,
              content: event.data.content,
              role: event.data.role,
              jobDescription: event.data.description,
              extractedData: parserData,
              analysisData: mergedAnalysisData,
              scores: {...scores },
              status: "COMPLETED"
            }
          });

          const formattedJobDescVector = `[${jobDescriptionEmbedding.join(',')}]`;
          const formattedSkillsVector = jobSkillsEmbedding.length > 0 ? `[${jobSkillsEmbedding.join(',')}]` : null;
          const formattedRespVector = jobResponsibilitiesEmbedding.length > 0 ? `[${jobResponsibilitiesEmbedding.join(',')}]` : null;
          
          if (formattedSkillsVector && formattedRespVector) {
            await prisma.$executeRaw`
              UPDATE "tailored_resume"
              SET "jobDescriptionEmbedding" = ${formattedJobDescVector}::vector,
                  "jobSkillsEmbedding" = ${formattedSkillsVector}::vector,
                  "jobResponsibilitiesEmbedding" = ${formattedRespVector}::vector
              WHERE "id" = ${tailoredResume.id}
            `;
          } else if (formattedSkillsVector) {
            await prisma.$executeRaw`
              UPDATE "tailored_resume"
              SET "jobDescriptionEmbedding" = ${formattedJobDescVector}::vector,
                  "jobSkillsEmbedding" = ${formattedSkillsVector}::vector
              WHERE "id" = ${tailoredResume.id}
            `;
          } else if (formattedRespVector) {
            await prisma.$executeRaw`
              UPDATE "tailored_resume"
              SET "jobDescriptionEmbedding" = ${formattedJobDescVector}::vector,
                  "jobResponsibilitiesEmbedding" = ${formattedRespVector}::vector
              WHERE "id" = ${tailoredResume.id}
            `;
          } else {
            await prisma.$executeRaw`
              UPDATE "tailored_resume"
              SET "jobDescriptionEmbedding" = ${formattedJobDescVector}::vector
              WHERE "id" = ${tailoredResume.id}
            `;
          }
        })

        return { scores, analysisData: mergedAnalysisData }
    } catch (error) {
        console.error("Error in tailoredResumeCreated workflow:", error);
        // Delete the tailored resume since creation failed
        await step.run("delete-failed-tailored-resume", async () => {
            await prisma.tailoredResume.delete({
                where: { id: event.data.resumeId }
            });
        });
        throw error;
    } 
  }
);

export const tailoredResumeUpdated = inngest.createFunction(
  { id: "tailored-resume-updated-workflow" },
  { event: "app/tailored-resume.updated" },
  async ({step,event}) => {
    try {
    let resumeText =`
    #Resume
    ${event.data.content}
    
    #Targetted Role
    ${event.data.role}
    #Job Description
    ${event.data.description}
    `
    
    if (event.data.previousAnalysis) {
            let prevFixes = "";
             try {
                const prev = typeof event.data.previousAnalysis === 'string' 
                    ? JSON.parse(event.data.previousAnalysis) 
                    : event.data.previousAnalysis;
                if (prev && prev.fixes) {
                    // Sanitize prev.fixes to remove massive 'autoFix' content from legacy data
                    const sanitizedFixes: any = {};
                    for (const [section, issues] of Object.entries(prev.fixes)) {
                        if (Array.isArray(issues)) {
                            sanitizedFixes[section] = issues.map((issue: any) => {
                                const { autoFix, ...rest } = issue; // Destructure to exclude autoFix
                                return rest;
                            });
                        } else {
                            sanitizedFixes[section] = issues;
                        }
                    }
                    prevFixes = JSON.stringify(sanitizedFixes, null, 2);
                }
             } catch (e) {
                console.error("Failed to parse previous analysis", e);
             }

             if (prevFixes) {
                 resumeText += `
        
        ---------------------------------------------------
        # PREVIOUS ISSUES CHECKLIST (META-DATA)
        The following is a list of issues found in a PREVIOUS version of this resume.
        YOUR GOAL: Check if these specific issues have been fixed in the CURRENT RESUME content above.
        - If an issue is fixed, IGNORE it.
        - If an issue is NOT fixed, Re-report it.
        - DO NOT hallucinate that these issues exist if the current text shows they are fixed.
        
        ${prevFixes}
        ---------------------------------------------------
                 `
             }
    }
    
    // 1. Run Parser (Raw Content Only)
    // Note: In an update, we usually want to re-parse the content to ensure extraction matches current text.
    const parserResult = await parserNetwork.run(event.data.content);
    const parserData = parserResult.state.data.parserAgent;

    // 2. Run Analysis (Full Context)
    const analysisResult = await issueNetwork.run(resumeText);
    const analysisDataRaw = analysisResult.state.data.analyserAgent;

    // 2. Run Autofix
    let mergedAnalysisData = analysisDataRaw;

    if (analysisDataRaw) {
        try {
            const autofixInput = `
            ${resumeText}

            ---------------------------------------------------
            # ANALYZED ISSUES
            ${analysisDataRaw}
            ---------------------------------------------------
            `;

            const autofixResult = await autofixNetwork.run(autofixInput);
            const autofixDataRaw = autofixResult.state.data.autofixAgent;

            if (autofixDataRaw && analysisDataRaw) {
                const analysisJson = JSON.parse(analysisDataRaw);
                const autofixJson = JSON.parse(autofixDataRaw);

                if (analysisJson.fixes) {
                    for (const [sectionName, issues] of Object.entries(analysisJson.fixes)) {
                       if (autofixJson[sectionName] && Array.isArray(issues)) {
                           (issues as any[]).forEach(issue => {
                               issue.autoFix = autofixJson[sectionName];
                           });
                       }
                    }
                }
                mergedAnalysisData = JSON.stringify(analysisJson);
            }
        } catch (e) {
            console.error("Autofix generation failed:", e);
        }
    }


    // Extract skills and responsibilities (Moved out of step.run to avoid NESTING_STEPS)
    let extractedSkills: string[] = [];
    let extractedResponsibilities: string[] = [];
    try {
      const extractionState = createState<{ jobExtractorAgent: string }>({
        jobExtractorAgent: ''
      });
      const extractionResult = await jobExtractionNetwork.run(event.data.description, { state: extractionState });
      const extracted = JSON.parse(extractionResult.state.data.jobExtractorAgent || '{}');
      extractedSkills = extracted.skills || [];
      extractedResponsibilities = extracted.responsibilities || [];
    } catch (err) {
      console.error('[tailoredResumeUpdated] Failed to extract job data with LLM:', err);
    }

    const { jobDescriptionEmbedding, jobSkillsEmbedding, jobResponsibilitiesEmbedding, scores } = await step.run("generate-embedding-and-score", async () => {
      // Generate embeddings for job description, skills, and responsibilities
      const jobDescriptionEmbedding = await generateEmbedding(event.data.description);
      const jobSkillsEmbedding = extractedSkills.length > 0
        ? await generateEmbedding(extractedSkills.join('\n'))
        : [];
      const jobResponsibilitiesEmbedding = extractedResponsibilities.length > 0
        ? await generateEmbedding(extractedResponsibilities.join('\n'))
        : [];

      // Fetch full resume embedding (from primary resume)
      const fullResumeResult: { embedding: string }[] = await prisma.$queryRaw`
        SELECT embedding FROM "resume" WHERE "id" = ${event.data.primaryResumeId}
      `;
      const fullResumeEmbedding = parseVectorString(fullResumeResult[0]?.embedding);
      
      // Fetch skills and experience embeddings from primary resume
      const skillsResult: { embedding: string }[] = await prisma.$queryRaw`
        SELECT embedding FROM "resume_skills" WHERE "resume_id" = ${event.data.primaryResumeId}
      `;
      const skillsEmbedding = parseVectorString(skillsResult[0]?.embedding);
      
      const experienceResult: { embedding: string }[] = await prisma.$queryRaw`
        SELECT embedding FROM "resume_experience" WHERE "resume_id" = ${event.data.primaryResumeId}
      `;
      const experienceEmbedding = parseVectorString(experienceResult[0]?.embedding);

      // Calculate scores
      const overallScore = fullResumeEmbedding.length > 0 && jobDescriptionEmbedding.length > 0
        ? cosineSimilarity(fullResumeEmbedding, jobDescriptionEmbedding)
        : 0;

      const skillsScore = skillsEmbedding.length > 0 && jobSkillsEmbedding.length > 0
        ? cosineSimilarity(skillsEmbedding, jobSkillsEmbedding)
        : 0;
      
      const experienceScore = experienceEmbedding.length > 0 && jobResponsibilitiesEmbedding.length > 0
        ? cosineSimilarity(experienceEmbedding, jobResponsibilitiesEmbedding)
        : 0;
      
      // Weighted final score: 0.4*overall + 0.3*skills + 0.3*experience
      const finalScore = 0.4 * overallScore + 0.3 * skillsScore + 0.3 * experienceScore;

      return {
        jobDescriptionEmbedding,
        jobSkillsEmbedding,
        jobResponsibilitiesEmbedding,
        scores: {
          overallScore,
          skillsScore,
          experienceScore,
          finalScore,
        },
      };
    });

    await step.run("update-tailored-resume", async () => {
      await prisma.tailoredResume.update({
        where: {
            id: event.data.resumeId,
            userId: event.data.userId
        },
        data: {
          name: event.data.name,
          content: event.data.content,
          role: event.data.role,
          jobDescription: event.data.description,
          extractedData: parserData,
          analysisData: mergedAnalysisData,
          scores: {...scores },
          status: "COMPLETED"
        }
      });

      const formattedJobDescVector = `[${jobDescriptionEmbedding.join(',')}]`;
      const formattedSkillsVector = jobSkillsEmbedding.length > 0 ? `[${jobSkillsEmbedding.join(',')}]` : null;
      const formattedRespVector = jobResponsibilitiesEmbedding.length > 0 ? `[${jobResponsibilitiesEmbedding.join(',')}]` : null;
      
      if (formattedSkillsVector && formattedRespVector) {
        await prisma.$executeRaw`
          UPDATE "tailored_resume"
          SET "jobDescriptionEmbedding" = ${formattedJobDescVector}::vector,
              "jobSkillsEmbedding" = ${formattedSkillsVector}::vector,
              "jobResponsibilitiesEmbedding" = ${formattedRespVector}::vector
          WHERE "id" = ${event.data.resumeId}
        `;
      } else if (formattedSkillsVector) {
        await prisma.$executeRaw`
          UPDATE "tailored_resume"
          SET "jobDescriptionEmbedding" = ${formattedJobDescVector}::vector,
              "jobSkillsEmbedding" = ${formattedSkillsVector}::vector
          WHERE "id" = ${event.data.resumeId}
        `;
      } else if (formattedRespVector) {
        await prisma.$executeRaw`
          UPDATE "tailored_resume"
          SET "jobDescriptionEmbedding" = ${formattedJobDescVector}::vector,
              "jobResponsibilitiesEmbedding" = ${formattedRespVector}::vector
          WHERE "id" = ${event.data.resumeId}
        `;
      } else {
        await prisma.$executeRaw`
          UPDATE "tailored_resume"
          SET "jobDescriptionEmbedding" = ${formattedJobDescVector}::vector
          WHERE "id" = ${event.data.resumeId}
        `;
      }
    })

    return { scores, analysisData: mergedAnalysisData } 
  } catch (error) {
      console.error("Error in tailoredResumeUpdated workflow:", error);
      // Reset status to COMPLETED to preserve old analysis data
      await step.run("reset-tailored-resume-status", async () => {
          await prisma.tailoredResume.update({
              where: { id: event.data.resumeId },
              data: { status: "COMPLETED" }
          });
      });
      throw error;
  }
  }
);
