import { inngest } from "./client";
import { createNetwork, createState } from "@inngest/agent-kit";
import prisma from "@/lib/prisma";
import { parserAgent, analysisAgent, jobExtractorAgent, autofixAgent, resumeScopeExtractorAgent, resumeSummaryAgent, domainTranslationAgent, roleClassifierAgent } from "./agents";
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

const resumeScopeNetwork = createNetwork({
  name: 'resume-scope-network',
  agents: [resumeScopeExtractorAgent],
  defaultState: createState<{ resumeScopeExtractorAgent: string }>({
    resumeScopeExtractorAgent: ''
  }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return resumeScopeExtractorAgent;
  }
});


function normalizeScope(scope: any) {
  const seniorityMap: Record<string, number> = {
    "Entry": 0, "Mid": 0.25, "Senior": 0.5, "Manager": 0.75, "Director": 0.85, "VP": 0.95, "C-Level": 1.0
  };
  
  const normTeam = Math.min(Math.log10((scope.teamSize || 0) + 1) / 3, 1); // Max 1000 -> 1
  const normBudget = Math.min(Math.log10((scope.budget || 0) + 1) / 8, 1); // Max 100M -> 1
  const normGeo = Math.min((scope.geographies?.length || 0) / 5, 1); // Max 5 countries -> 1
  const normSeniority = seniorityMap[scope.seniorityLevel as string] || 0.1; 

  return [normTeam, normBudget, normGeo, normSeniority];
}

const resumeSummaryNetwork = createNetwork({
  name: 'resume-summary-network',
  agents: [resumeSummaryAgent],
  defaultState: createState<{ resumeSummaryAgent: string }>({
    resumeSummaryAgent: ''
  }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return resumeSummaryAgent;
  }
});

const domainTranslationNetwork = createNetwork({
  name: 'domain-translation-network',
  agents: [domainTranslationAgent],
  defaultState: createState<{ domainTranslationAgent: string }>({
    domainTranslationAgent: ''
  }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return domainTranslationAgent;
  }
});

const roleClassifierNetwork = createNetwork({
  name: 'role-classifier-network',
  agents: [roleClassifierAgent],
  defaultState: createState<{ roleClassifierAgent: string }>({
    roleClassifierAgent: ''
  }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return roleClassifierAgent;
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
        const parsedResume = JSON.parse(parserData || '{}');

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

        // 0. Role Classification (Universal Scoring Step)
        let roleArchetype = "Generalist";
        try {
            const classifierState = createState<{ roleClassifierAgent: string }>({ roleClassifierAgent: '' });
            const classifierInput = `Title: ${event.data.role}\nDescription: ${event.data.description.substring(0, 1000)}`;
            const classifierResult = await roleClassifierNetwork.run(classifierInput, { state: classifierState });
            const classifierData = JSON.parse(classifierResult.state.data.roleClassifierAgent || '{}');
            roleArchetype = classifierData.archetype || "Generalist";
            console.log('[Universal Scoring] Role Archetype:', roleArchetype);
        } catch(err) {
            console.error('[Universal Scoring] Classification failed, defaulting to Generalist:', err);
        }

        // 4. Extract Job Data (Skills, Responsibilities, Scope, Location, Summary)
        let extractedJob: any = {};
        try {
          const extractionState = createState<{ jobExtractorAgent: string }>({
            jobExtractorAgent: ''
          });
          const extractionResult = await jobExtractionNetwork.run(event.data.description, { state: extractionState });
          extractedJob = JSON.parse(extractionResult.state.data.jobExtractorAgent || '{}');
        } catch (err) {
          console.error('[tailoredResumeCreated] Failed to extract job data:', err);
        }

        // 5. Extract Resume Scope Data
        let extractedResumeScope: any = {};
        try {
            const scopeState = createState<{ resumeScopeExtractorAgent: string }>({ resumeScopeExtractorAgent: '' });
            const scopeResult = await resumeScopeNetwork.run(event.data.content, { state: scopeState });
            const scopeData = JSON.parse(scopeResult.state.data.resumeScopeExtractorAgent || '{}');
            extractedResumeScope = scopeData.scope || {};
        } catch(err) {
            console.error('[tailoredResumeCreated] Failed to extract resume scope:', err);
        }

        // 6. Generate Professional Resume Summary
        let resumeSummary = "";
        try {
            const summaryState = createState<{ resumeSummaryAgent: string }>({ resumeSummaryAgent: '' });
            const summaryResult = await resumeSummaryNetwork.run(event.data.content, { state: summaryState });
            const summaryData = JSON.parse(summaryResult.state.data.resumeSummaryAgent || '{}');
            resumeSummary = summaryData.summary || "";
        } catch(err) {
            console.error('[tailoredResumeCreated] Failed to generate resume summary:', err);
        }

        // 7. Domain Translation (Skills + Highlights)
        let translatedSkills: string[] = [];
        let relevantHighlights: string[] = [];
        try {
            // Fetch raw skills and experience from DB
            const skillsResult: { skill_text: string }[] = await prisma.$queryRaw`
                SELECT "skill_text" FROM "resume_skills" WHERE "resume_id" = ${event.data.primaryResumeId}
            `;
            const rawSkills = skillsResult[0]?.skill_text || "";

            // FIXED: Fetch ALL experience bullets, not just the first one
            const experienceResult: { bullet_text: string }[] = await prisma.$queryRaw`
                SELECT "bullet_text" FROM "resume_experience" WHERE "resume_id" = ${event.data.primaryResumeId}
            `;
            // Concatenate all experience bullets
            const rawExperience = experienceResult.map(row => row.bullet_text).join('\n\n') || "";

            console.log('═════════════════════════════════════════════════');
            console.log('[DEBUG EXPERIENCE] Fetched experience rows:', experienceResult.length);
            console.log('[DEBUG EXPERIENCE] Total raw experience length:', rawExperience.length, 'chars');
            console.log('[DEBUG EXPERIENCE] Raw experience preview:', rawExperience.substring(0, 300));
            console.log('═════════════════════════════════════════════════');

            // Prepare translation input (Use Extracted Data for precision)
            const targetSkills = extractedJob.skills?.join(', ') || "";
            const targetResponsibilities = extractedJob.responsibilities?.join('\n- ') || "";
            
            const translationInput = `
Resume Skills: ${rawSkills}

Resume Experience: ${rawExperience}

Target Role: ${event.data.role}

Target Job Skills (Vocabulary to align with):
${targetSkills}

Target Job Responsibilities (Key themes to highlight):
- ${targetResponsibilities}
            `;

            // Call network directly (NOT inside step.run to avoid nesting)
             const translationState = createState<{ domainTranslationAgent: string }>({ domainTranslationAgent: '' });
             const translationResult = await domainTranslationNetwork.run(translationInput, { state: translationState });
             const translationData = JSON.parse(translationResult.state.data.domainTranslationAgent || '{}');
             
             translatedSkills = translationData.translatedSkills || [];
             relevantHighlights = translationData.relevantHighlights || [];
             
             console.log('[DEBUG] Domain Translation - Original Skills:', rawSkills.substring(0, 100));
             console.log('[DEBUG] Domain Translation - Translated Skills Count:', translatedSkills.length);
             console.log('═════════════════════════════════════════════════');
             console.log('[DEBUG EXPERIENCE] Relevant Highlights Count:', relevantHighlights.length);
             console.log('[DEBUG EXPERIENCE] Highlights Sample 1:', relevantHighlights[0] || 'NONE');
             console.log('[DEBUG EXPERIENCE] Highlights Sample 2:', relevantHighlights[1] || 'NONE');
             console.log('═════════════════════════════════════════════════');
             
         } catch(err) {
             console.error('[tailoredResumeCreated] Failed to translate domain:', err);
         }

        const { jobDescriptionEmbedding, jobSkillsEmbedding, jobResponsibilitiesEmbedding, scores } = await step.run("generate-embedding-and-score", async () => {
          // A. Generate Embeddings
          
          // Job Embeddings
          // Summary: Use extracted job summary if available, else raw description
          const jobSummaryText = extractedJob.summary || event.data.description.substring(0, 500);
          console.log('[DEBUG] Job Summary Text:', jobSummaryText);
          const jobDescriptionEmbedding = await generateEmbedding(jobSummaryText);

          // Job Skills: Augment with "Seniority Verbs" (Ensure Job side matches Resume side)
          const jobSeniority = extractedJob.scope?.seniorityLevel || "Mid";
          let jobSeniorityKeywords = "";
          if (["Director", "VP", "C-Level"].includes(jobSeniority)) {
             jobSeniorityKeywords = "Strategic Planning, Executive Leadership, P&L Management, Organizational Development, Board Relations, Change Management, Visionary Leadership";
          } else if (["Manager", "Senior"].includes(jobSeniority)) {
             jobSeniorityKeywords = "Team Leadership, Project Management, Stakeholder Management, Mentorship, Process Improvement";
          }
          const augmentedJobSkillsText = `${extractedJob.skills?.join('\n') || ''}\n${jobSeniorityKeywords}`.trim();
          console.log('[DEBUG] Job Skills (Base):', extractedJob.skills?.join(', ') || 'NONE');
          console.log('[DEBUG] Job Skills (Augmented Length):', augmentedJobSkillsText.length);
          const jobSkillsEmbedding = augmentedJobSkillsText ? await generateEmbedding(augmentedJobSkillsText) : [];

          const jobResponsibilitiesEmbedding = (extractedJob.responsibilities?.length > 0)
            ? await generateEmbedding(extractedJob.responsibilities.join('\n')) : [];
          
          // Job Location (Semantic)
          const jobLocationText = extractedJob.location?.join(", ") || "";
          const jobLocationEmbedding = jobLocationText ? await generateEmbedding(jobLocationText) : [];

          // Job Scope (Structured Vector)
          const jobScopeVector = normalizeScope(extractedJob.scope || {});

          // Resume Embeddings
          // 1. Overall: Use AI-Generated Resume Summary for focused matching
          console.log('[DEBUG] Resume Summary:', resumeSummary || 'FALLBACK TO SUBSTRING');
          const fullResumeEmbedding = await generateEmbedding(resumeSummary || event.data.content.substring(0, 500)); 

          // 2. Experience: Use RELEVANT HIGHLIGHTS matching (Single Vector - Cost Efficient)
          // We embed the curated highlights block as a single vector.
          const highlightsText = relevantHighlights.length > 0 ? relevantHighlights.join('\n') : '';
          console.log('[DEBUG] Experience Embedding - Using highlights:', highlightsText.length > 0);
          
          // Generate ONE embedding for experience (Low Cost)
          const experienceEmbedding = highlightsText ? await generateEmbedding(highlightsText) : [];
          
          // Calculate R score using standard cosine similarity
          const R = (experienceEmbedding.length > 0 && jobResponsibilitiesEmbedding.length > 0)
            ? cosineSimilarity(experienceEmbedding, jobResponsibilitiesEmbedding) : 0;

          // 3. Augmented Skills Embedding (Use TRANSLATED skills + seniority keywords)
          const translatedSkillsText = translatedSkills.length > 0 ? translatedSkills.join(', ') : '';
          console.log('[DEBUG] Skills Embedding - Using translated:', translatedSkillsText.length > 0);

          // Derive "Seniority Verbs" from Resume Scope
          const seniorityLevel = extractedResumeScope.seniorityLevel;
          let seniorityKeywords = "";
          if (["Director", "VP", "C-Level"].includes(seniorityLevel)) {
             seniorityKeywords = "Strategic Planning, Executive Leadership, P&L Management, Organizational Development, Board Relations, Change Management, Visionary Leadership";
          } else if (["Manager", "Senior"].includes(seniorityLevel)) {
             seniorityKeywords = "Team Leadership, Project Management, Stakeholder Management, Mentorship, Process Improvement";
          }

          // Combine for Augmented Embedding
          const augmentedSkillsText = `${translatedSkillsText}\n${seniorityKeywords}`.trim();
          console.log('[DEBUG] Resume Skills (Translated + Augmented):', translatedSkillsText.substring(0, 150));
          console.log('[DEBUG] Resume Seniority Level:', seniorityLevel);
          console.log('[DEBUG] Resume Skills (Final Augmented Length):', augmentedSkillsText.length);
          const skillsEmbedding = await generateEmbedding(augmentedSkillsText);

          // Resume Location (From Scoped Data geographies)
          const resumeLocationText = extractedResumeScope.geographies?.join(", ") || "";
          const resumeLocationEmbedding = resumeLocationText ? await generateEmbedding(resumeLocationText) : [];

          // Resume Scope (Structured Vector)
          const resumeScopeVector = normalizeScope(extractedResumeScope);

          // C. Calculate Similarities
          const S = (skillsEmbedding.length > 0 && jobSkillsEmbedding.length > 0) 
            ? cosineSimilarity(skillsEmbedding, jobSkillsEmbedding) : 0;
            
          // R is already calculated above
            
          const C = cosineSimilarity(resumeScopeVector, jobScopeVector); // Scope
          
          const L = (resumeLocationEmbedding.length > 0 && jobLocationEmbedding.length > 0)
            ? cosineSimilarity(resumeLocationEmbedding, jobLocationEmbedding) : 0;
            
          // Overall Score should now generally be higher due to focused summary matching
          const O = (fullResumeEmbedding.length > 0 && jobDescriptionEmbedding.length > 0)
            ? cosineSimilarity(fullResumeEmbedding, jobDescriptionEmbedding) : 0;

          console.log('[DEBUG] Similarity Scores - S:', (S*100).toFixed(1) + '%', 'R:', (R*100).toFixed(1) + '%', 'C:', (C*100).toFixed(1) + '%', 'L:', (L*100).toFixed(1) + '%', 'O:', (O*100).toFixed(1) + '%');

          // C. Weighted Score - DYNAMIC UNIVERSAL MATRIX
          // Weights adapt to the Role Archetype
          // S=Skills, R=Experience, C=Scope, L=Location, O=Overall
          
          let weights = { S: 0.40, R: 0.30, C: 0.15, L: 0.05, O: 0.10 }; // Default Generalist

          if (roleArchetype === "Executive") {
             // Executive: Balanced Scope (40%) + Verified Skills (30%)
             // Skills are now translated/augmented, so we trust them more.
             weights = { S: 0.30, R: 0.20, C: 0.40, L: 0.05, O: 0.05 };
          } else if (roleArchetype === "Technical") {
             // Technical: Skills are king (60%)
             weights = { S: 0.60, R: 0.20, C: 0.05, L: 0.05, O: 0.10 };
          } else if (roleArchetype === "Creative") {
             // Creative: Overall/Portfolio matters (boosted O), Skills matter
             weights = { S: 0.30, R: 0.20, C: 0.10, L: 0.05, O: 0.35 }; 
          }
          
          console.log(`[Universal Scoring] Using ${roleArchetype} Weights:`, weights);

          let finalScore = (weights.S * S) + (weights.R * R) + (weights.C * C) + (weights.L * L) + (weights.O * O);

          // D. Seniority Boost (Optional implementation as per plan)
          // Add 0.05 if Title >= GM/VP (approx mapped to >0.85 seniority)
          if (resumeScopeVector[3] >= 0.85) finalScore += 0.05;
          // Add 0.03 if P&L > $50M (normBudget > log10(50M)/8 ~= 7.7/8 =~ 0.96)
          // Let's settle for > $10M for now which is log10(10M)=7 -> 7/8 = 0.875
          if (resumeScopeVector[1] >= 0.875) finalScore += 0.03;

          // Cap at 1.0
          finalScore = Math.min(finalScore, 1.0);

          return {
            jobDescriptionEmbedding,
            jobSkillsEmbedding,
            jobResponsibilitiesEmbedding,
            scores: {
              skillsScore: S,
              experienceScore: R,
              responsibilitiesScore: R,
              scopeScore: C,
              locationScore: L,
              overallScore: O,
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
                    // Extract Job Content for Autofix Context
                    // Note: ExtractedJob isn't fully ready yet at this line in the original flow order?
                    // Ah, extraction happens at step 4 (line 609). We need to move Extraction EARLIER 
                    // or extract it temporarily here. 
                    // Workaround: We have event.data.role and description.
                    
                    const autofixInput = `
                    ${resumeText}
        
                    ---------------------------------------------------
                    # TARGET JOB CONTEXT (For Semantic Mirroring)
                    Role: ${event.data.role}
                    Job Description Preview: ${event.data.description.substring(0, 500)}...
                    ---------------------------------------------------
        
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



    // 0. Role Classification (Universal Scoring Step)
    let roleArchetype = "Generalist";
    try {
        const classifierState = createState<{ roleClassifierAgent: string }>({ roleClassifierAgent: '' });
        const classifierInput = `Title: ${event.data.role}\nDescription: ${event.data.description.substring(0, 1000)}`;
        const classifierResult = await roleClassifierNetwork.run(classifierInput, { state: classifierState });
        const classifierData = JSON.parse(classifierResult.state.data.roleClassifierAgent || '{}');
        roleArchetype = classifierData.archetype || "Generalist";
        console.log('[Universal Scoring] Role Archetype:', roleArchetype);
    } catch(err) {
        console.error('[Universal Scoring] Classification failed, defaulting to Generalist:', err);
    }

    // 4. Extract Job Data (Skills, Responsibilities, Scope, Location)
    let extractedJob: any = {};
    try {
      const extractionState = createState<{ jobExtractorAgent: string }>({
        jobExtractorAgent: ''
      });
      const extractionResult = await jobExtractionNetwork.run(event.data.description, { state: extractionState });
      extractedJob = JSON.parse(extractionResult.state.data.jobExtractorAgent || '{}');
    } catch (err) {
      console.error('[tailoredResumeUpdated] Failed to extract job data:', err);
    }


    // 5. Extract Resume Scope Data
    let extractedResumeScope: any = {};
    try {
        const scopeState = createState<{ resumeScopeExtractorAgent: string }>({ resumeScopeExtractorAgent: '' });
        const scopeResult = await resumeScopeNetwork.run(event.data.content, { state: scopeState });
        const scopeData = JSON.parse(scopeResult.state.data.resumeScopeExtractorAgent || '{}');
        extractedResumeScope = scopeData.scope || {};
    } catch(err) {
        console.error('[tailoredResumeUpdated] Failed to extract resume scope:', err);
        console.error('[tailoredResumeUpdated] Failed to extract resume scope:', err);
    }
    
        // 7. Domain Translation (Skills + Highlights)
        // Ensure Updates use the same advanced logic as creation
        let translatedSkills: string[] = [];
        let relevantHighlights: string[] = [];
        try {
            // Fetch raw skills and experience from DB
            const skillsResult: { skill_text: string }[] = await prisma.$queryRaw`
                SELECT "skill_text" FROM "resume_skills" WHERE "resume_id" = ${event.data.primaryResumeId}
            `;
            const rawSkills = skillsResult[0]?.skill_text || "";

            // Fetch ALL experience bullets
            const experienceResult: { bullet_text: string }[] = await prisma.$queryRaw`
                SELECT "bullet_text" FROM "resume_experience" WHERE "resume_id" = ${event.data.primaryResumeId}
            `;
            const rawExperience = experienceResult.map(row => row.bullet_text).join('\n\n') || "";

            // Prepare translation input (Use Extracted Data for precision)
            const targetSkills = extractedJob.skills?.join(', ') || "";
            const targetResponsibilities = extractedJob.responsibilities?.join('\n- ') || "";
            
            const translationInput = `
Resume Skills: ${rawSkills}

Resume Experience: ${rawExperience}

Target Role: ${event.data.role}

Target Job Skills (Vocabulary to align with):
${targetSkills}

Target Job Responsibilities (Key themes to highlight):
- ${targetResponsibilities}
            `;

            // Call network directly
             const translationState = createState<{ domainTranslationAgent: string }>({ domainTranslationAgent: '' });
             const translationResult = await domainTranslationNetwork.run(translationInput, { state: translationState });
             const translationData = JSON.parse(translationResult.state.data.domainTranslationAgent || '{}');
             
             translatedSkills = translationData.translatedSkills || [];
             relevantHighlights = translationData.relevantHighlights || [];
             
             console.log('[Universal Scoring Update] Translated Skills Count:', translatedSkills.length);
             console.log('[Universal Scoring Update] Relevant Highlights Count:', relevantHighlights.length);
             
         } catch(err) {
             console.error('[tailoredResumeUpdated] Failed to translate domain:', err);
         }

    // 6. Generate Professional Resume Summary
    let resumeSummary = "";
    try {
        const summaryState = createState<{ resumeSummaryAgent: string }>({ resumeSummaryAgent: '' });
        const summaryResult = await resumeSummaryNetwork.run(event.data.content, { state: summaryState });
        const summaryData = JSON.parse(summaryResult.state.data.resumeSummaryAgent || '{}');
        resumeSummary = summaryData.summary || "";
    } catch(err) {
        console.error('[tailoredResumeUpdated] Failed to generate resume summary:', err);
    }

    const { jobDescriptionEmbedding, jobSkillsEmbedding, jobResponsibilitiesEmbedding, scores } = await step.run("generate-embedding-and-score", async () => {
      // A. Generate Embeddings
      
      // Job Embeddings
      const jobDescriptionEmbedding = await generateEmbedding(event.data.description);
      const jobSkillsEmbedding = (extractedJob.skills?.length > 0)
        ? await generateEmbedding(extractedJob.skills.join('\n')) : [];
      const jobResponsibilitiesEmbedding = (extractedJob.responsibilities?.length > 0)
        ? await generateEmbedding(extractedJob.responsibilities.join('\n')) : [];
      
      // Job Location (Semantic)
      const jobLocationText = extractedJob.location?.join(", ") || "";
      const jobLocationEmbedding = jobLocationText ? await generateEmbedding(jobLocationText) : [];

      // Job Scope (Structured Vector)
      const jobScopeVector = normalizeScope(extractedJob.scope || {});

      // Resume Embeddings
      // 1. Overall: Use AI-Generated Resume Summary for focused matching
      const fullResumeEmbedding = await generateEmbedding(resumeSummary || event.data.content.substring(0, 500));
      
      // 2. Experience: Use RELEVANT HIGHLIGHTS matching (Single Vector - Cost Efficient)
      const highlightsText = relevantHighlights.length > 0 ? relevantHighlights.join('\n') : "";
      console.log('[DEBUG Update] Experience Embedding - Using highlights:', highlightsText.length > 0);
      const experienceEmbedding = highlightsText ? await generateEmbedding(highlightsText) : [];

      // 3. Augmented Skills Embedding (New Implementation)
      // Fetch raw skill text from DB
      const skillsTextResult: { skill_text: string }[] = await prisma.$queryRaw`
        SELECT "skill_text" FROM "resume_skills" WHERE "resume_id" = ${event.data.primaryResumeId}
      `;
      let rawSkillsText = skillsTextResult[0]?.skill_text || "";

      // Derive "Seniority Verbs" from Resume Scope
      const seniorityLevel = extractedResumeScope.seniorityLevel;
      let seniorityKeywords = "";
      if (["Director", "VP", "C-Level"].includes(seniorityLevel)) {
          seniorityKeywords = "Strategic Planning, Executive Leadership, P&L Management, Organizational Development, Board Relations, Change Management, Visionary Leadership";
      } else if (["Manager", "Senior"].includes(seniorityLevel)) {
          seniorityKeywords = "Team Leadership, Project Management, Stakeholder Management, Mentorship, Process Improvement";
      }

      // Combine for Augmented Embedding (Use Translated Skills)
      const translatedSkillsText = translatedSkills.length > 0 ? translatedSkills.join(', ') : "";
      const augmentedSkillsText = `${translatedSkillsText}\n${seniorityKeywords}`.trim();
      const skillsEmbedding = await generateEmbedding(augmentedSkillsText);

      // Resume Location (From Scoped Data geographies)
      const resumeLocationText = extractedResumeScope.geographies?.join(", ") || "";
      const resumeLocationEmbedding = resumeLocationText ? await generateEmbedding(resumeLocationText) : [];

      // Resume Scope (Structured Vector)
      const resumeScopeVector = normalizeScope(extractedResumeScope);

      // B. Calculate Similarities (0-1)
      const S = (skillsEmbedding.length > 0 && jobSkillsEmbedding.length > 0) 
        ? cosineSimilarity(skillsEmbedding, jobSkillsEmbedding) : 0;
        
      const R = (experienceEmbedding.length > 0 && jobResponsibilitiesEmbedding.length > 0)
        ? cosineSimilarity(experienceEmbedding, jobResponsibilitiesEmbedding) : 0;
        
      const C = cosineSimilarity(resumeScopeVector, jobScopeVector); // Scope
      
      const L = (resumeLocationEmbedding.length > 0 && jobLocationEmbedding.length > 0)
        ? cosineSimilarity(resumeLocationEmbedding, jobLocationEmbedding) : 0;
        
      const O = (fullResumeEmbedding.length > 0 && jobDescriptionEmbedding.length > 0)
        ? cosineSimilarity(fullResumeEmbedding, jobDescriptionEmbedding) : 0;

      // C. Weighted Score - DYNAMIC UNIVERSAL MATRIX
      // Weights adapt to the Role Archetype
      let weights = { S: 0.40, R: 0.30, C: 0.15, L: 0.05, O: 0.10 }; // Default Generalist

      if (roleArchetype === "Executive") {
         weights = { S: 0.30, R: 0.20, C: 0.40, L: 0.05, O: 0.05 };
      } else if (roleArchetype === "Technical") {
         weights = { S: 0.60, R: 0.20, C: 0.05, L: 0.05, O: 0.10 };
      } else if (roleArchetype === "Creative") {
         weights = { S: 0.30, R: 0.20, C: 0.10, L: 0.05, O: 0.35 }; 
      }
      
      console.log(`[Universal Scoring] Using ${roleArchetype} Weights:`, weights);

      let finalScore = (weights.S * S) + (weights.R * R) + (weights.C * C) + (weights.L * L) + (weights.O * O);

      // D. Seniority Boost
      if (resumeScopeVector[3] >= 0.85) finalScore += 0.05;
      if (resumeScopeVector[1] >= 0.875) finalScore += 0.03;

      // Cap at 1.0
      finalScore = Math.min(finalScore, 1.0);

      return {
        jobDescriptionEmbedding,
        jobSkillsEmbedding,
        jobResponsibilitiesEmbedding,
        scores: {
          skillsScore: S,
          experienceScore: R,
          responsibilitiesScore: R,
          scopeScore: C,
          locationScore: L,
          overallScore: O,
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
