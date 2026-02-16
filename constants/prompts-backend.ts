
export const ANALYZE_RESUME_PROMPT = `You are a professional resume analyst. Analyze this resume to identify items in Experience and Projects sections that have weak, vague, or incomplete descriptions.

IMPORTANT: Generate ALL output text (questions, placeholders, summaries, weakness reasons) in {output_language}.

RESUME DATA (JSON):
{resume_json}

WEAK DESCRIPTION INDICATORS:
1. Generic phrases: "responsible for", "worked on", "helped with", "assisted in", "involved in"
2. Missing metrics/impact: No numbers, percentages, dollar amounts, or measurable outcomes
3. Unclear scope: Vague about team size, project scale, user count, or responsibilities
4. No technologies/tools: Missing specific tech stack, tools, or methodologies used
5. Passive voice without ownership: Not clear what the candidate personally accomplished
6. Too brief: Single short bullet that doesn't explain the work

GOOD DESCRIPTION EXAMPLES (for reference):
- "Led migration of 15 microservices to Kubernetes, reducing deployment time by 60%"
- "Built real-time analytics dashboard using React and D3.js, serving 10K daily users"
- "Architected payment processing system handling $2M monthly transactions"

TASK:
1. Review each Experience and Project item's description bullets
2. Identify items that would benefit from more detail
3. Generate a MAXIMUM of 6 questions total across ALL items (not per item)
4. Prioritize the most impactful questions that will yield the best improvements
5. If multiple items need enhancement, distribute questions wisely (e.g., 2-3 per item)
6. Questions should help extract: metrics, technologies, scope, impact, and specific contributions

OUTPUT FORMAT (JSON only, no other text):
{
  "items_to_enrich": [
    {
      "item_id": "exp_0",
      "item_type": "experience",
      "title": "Software Engineer",
      "subtitle": "Company Name",
      "current_description": ["bullet 1", "bullet 2"],
      "weakness_reason": "Missing quantifiable impact and specific technologies used"
    }
  ],
  "questions": [
    {
      "question_id": "q_0",
      "item_id": "exp_0",
      "question": "What specific metrics improved as a result of your work? (e.g., performance gains, cost savings, user growth)",
      "placeholder": "e.g., Reduced API response time by 40%, saved $50K annually"
    }
  ],
  "analysis_summary": "Brief summary of overall resume strength and areas for improvement"
}

IMPORTANT RULES:
- MAXIMUM 6 QUESTIONS TOTAL - this is a hard limit, never exceed it
- Only include items that genuinely need improvement
- If the resume is already strong, return empty arrays with a positive summary
- Use "exp_0", "exp_1" for experience items (based on array index)
- Use "proj_0", "proj_1" for project items (based on array index)
- Generate unique question IDs: "q_0", "q_1", "q_2", etc. (max q_5)
- Questions should be specific to the role/project context
- Keep questions conversational but professional
- Placeholder text should give concrete examples
- Prioritize quality over quantity - ask the most impactful questions first`;

export const AI_PHRASE_BLACKLIST = [
  "spearheaded",
  "orchestrated",
  "championed",
  "synergized",
  "leveraged",
  "revolutionized",
  "pioneered",
  "catalyzed",
  "operationalized",
  "architected",
  "envisioned",
  "effectuated",
  "endeavored",
  "facilitated",
  "utilized",
  "synergy",
  "paradigm",
  "best-in-class",
  "world-class",
  "cutting-edge",
  "bleeding-edge",
  "game-changer",
  "disruptive",
  "holistic",
  "robust",
  "scalable",
  "actionable",
  "impactful",
  "proactive",
  "stakeholder",
  "deliverables",
  "bandwidth",
  "circle back",
  "deep dive",
  "move the needle",
  "low-hanging fruit",
  "touch base",
  "value-add",
  "in order to",
  "for the purpose of",
  "with a view to",
  "at the end of the day",
  "moving forward",
  "going forward",
  "on a daily basis",
  "on a regular basis",
  "in a timely manner",
  "at this point in time",
  "due to the fact that",
  "in the event that",
  "in light of the fact that"
];

export const AI_PHRASE_REPLACEMENTS: Record<string, string> = {
  "spearheaded": "led",
  "orchestrated": "coordinated",
  "championed": "advocated for",
  "synergized": "collaborated",
  "leveraged": "used",
  "revolutionized": "transformed",
  "pioneered": "introduced",
  "catalyzed": "initiated",
  "operationalized": "implemented",
  "architected": "designed",
  "envisioned": "planned",
  "effectuated": "completed",
  "endeavored": "worked",
  "facilitated": "helped",
  "utilized": "used",
  "synergy": "collaboration",
  "synergies": "collaborations",
  "paradigm": "approach",
  "paradigm shift": "change",
  "best-in-class": "top-performing",
  "world-class": "high-quality",
  "cutting-edge": "modern",
  "bleeding-edge": "modern",
  "game-changer": "innovation",
  "game-changing": "innovative",
  "disruptive": "innovative",
  "holistic": "comprehensive",
  "robust": "strong",
  "scalable": "expandable",
  "actionable": "practical",
  "impactful": "effective",
  "proactive": "active",
  "proactively": "actively",
  "stakeholder": "team member",
  "deliverables": "outputs",
  "bandwidth": "capacity",
  "circle back": "follow up",
  "deep dive": "analysis",
  "move the needle": "make progress",
  "low-hanging fruit": "quick wins",
  "touch base": "connect",
  "value-add": "benefit",
  "in order to": "to",
  "for the purpose of": "to",
  "with a view to": "to",
  "at the end of the day": "",
  "moving forward": "",
  "going forward": "",
  "on a daily basis": "daily",
  "on a regular basis": "regularly",
  "in a timely manner": "promptly",
  "at this point in time": "now",
  "due to the fact that": "because",
  "in the event that": "if",
  "in light of the fact that": "since"
};

export const ENHANCE_DESCRIPTION_PROMPT = `You are a professional resume writer. Your goal is to ADD new bullet points to this resume item using the additional context provided by the candidate. DO NOT rewrite or replace existing bullets - only add new ones.

IMPORTANT: Generate ALL output text (bullet points) in {output_language}.

ORIGINAL ITEM:
Type: {item_type}
Title: {title}
Subtitle: {subtitle}
Current Description (KEEP ALL OF THESE):
{current_description}

CANDIDATE'S ADDITIONAL CONTEXT:
{answers}

TASK:
Generate NEW bullet points to ADD to the existing description. The original bullets will be kept as-is.
New bullets should be:
1. Action-oriented: Start with strong verbs (Led, Built, Architected, Implemented, Optimized)
2. Quantified: Include metrics, numbers, percentages where the candidate provided them
3. Technically specific: Mention technologies, tools, and methodologies
4. Impact-focused: Clearly state the business or technical outcome
5. Ownership-clear: Show what the candidate personally did vs. the team

OUTPUT FORMAT (JSON only, no other text):
{
  "additional_bullets": [
    "New bullet point 1 with metrics and impact",
    "New bullet point 2 with technologies used",
    "New bullet point 3 with scope and ownership"
  ]
}

IMPORTANT RULES:
- Generate 2-4 NEW bullet points to ADD (not replace)
- DO NOT repeat or rephrase existing bullets - only add new information
- Preserve factual accuracy - only use information provided by the candidate
- Don't invent metrics or details not given by the candidate
- If candidate's answers are brief, still add what you can
- Keep bullets concise (1-2 lines each)
- Use past tense for past roles, present tense for current roles
- Avoid buzzwords and fluff - be specific and concrete
- Focus on information from the candidate's answers that isn't already in the original bullets`;

export const CRITICAL_TRUTHFULNESS_RULES_TEMPLATE = `CRITICAL TRUTHFULNESS RULES - NEVER VIOLATE:
1. DO NOT add any skill, tool, technology, or certification that is not explicitly mentioned in the original resume
2. DO NOT invent numeric achievements (e.g., "increased by 30%") unless they exist in original
3. DO NOT add company names, product names, or technical terms not in the original
4. DO NOT upgrade experience level (e.g., "Junior" -> "Senior")
5. DO NOT add languages, frameworks, or platforms the candidate hasn't used
6. DO NOT extend employment dates or change timelines (start/end years)
7. {rule_7}
8. Preserve factual accuracy - only use information provided by the candidate

Violation of these rules could cause serious problems for the candidate in job interviews.`;

export const IMPROVE_RESUME_PROMPT_NUDGE = `Lightly nudge this resume toward the job description. Output ONLY the JSON object, no other text.

{critical_truthfulness_rules}

IMPORTANT: Generate ALL text content (summary, descriptions, skills) in {output_language}.

Rules:
- Make minimal, conservative edits only where there is a clear existing match
- Do NOT change the candidate's role, industry, or seniority level
- Do NOT introduce new tools, technologies, or certifications not already present
- Do NOT add new bullet points or sections
- Preserve original bullet count and ordering within each section
- Keep proper nouns (names, company names, locations) unchanged
- Preserve the structure of any customSections from the original resume
- Preserve original date ranges exactly - do not modify years
- If the resume is non-technical, do NOT add technical jargon
- Do NOT use em dash ("—") anywhere in the writing/output, even if it exists, remove it

Job Description:
{job_description}

Keywords to emphasize (only if already supported by resume content):
{job_keywords}

Original Resume:
{original_resume}

Output in this JSON format:
{schema}`;

export const IMPROVE_RESUME_PROMPT_KEYWORDS = `Enhance this resume with relevant keywords from the job description. Output ONLY the JSON object, no other text.

{critical_truthfulness_rules}

IMPORTANT: Generate ALL text content (summary, descriptions, skills) in {output_language}.

Rules:
- Strengthen alignment by weaving in relevant keywords where evidence already exists
- You may rephrase bullet points to include keyword phrasing
- Do NOT introduce new skills, tools, or certifications not in the resume
- Do NOT change role, industry, or seniority level
- Preserve the structure of any customSections from the original resume
- Preserve original date ranges exactly - do not modify years
- If resume is non-technical, keep language non-technical while still aligning keywords
- Do NOT use em dash ("—") anywhere in the writing/output, even if it exists, remove it

Job Description:
{job_description}

Keywords to emphasize:
{job_keywords}

Original Resume:
{original_resume}

Output in this JSON format:
{schema}`;

export const IMPROVE_RESUME_PROMPT_FULL = `Tailor this resume for the job. Output ONLY the JSON object, no other text.

{critical_truthfulness_rules}

IMPORTANT: Generate ALL text content (summary, descriptions, skills) in {output_language}.

Rules:
- Rephrase content to highlight relevant experience
- DO NOT invent new information
- Use action verbs and quantifiable achievements
- Keep proper nouns (names, company names, locations) unchanged
- Translate job titles, descriptions, and skills to {output_language}
- Preserve the structure of any customSections from the original resume
- Improve custom section content the same way as standard sections
- Preserve original date ranges exactly - do not modify years
- Calculate and emphasize total relevant experience duration when it matches requirements
- Do NOT use em dash ("—") anywhere in the writing/output, even if it exists, remove it

Job Description:
{job_description}

Keywords to emphasize:
{job_keywords}

Original Resume:
{original_resume}

Output in this JSON format:
{schema}`;

export const VALIDATION_POLISH_PROMPT = `Review and polish this resume content. Remove any AI-sounding language and ensure all content is truthful.

REMOVE or REPLACE:
- Buzzwords: "spearheaded", "synergy", "leverage", "orchestrated", etc.
- Em-dashes (use commas or semicolons instead)
- Overly formal language: "utilized" -> "used", "endeavored" -> "worked"
- Generic filler: "in order to" -> "to"

VERIFY:
- All skills exist in the master resume
- All certifications exist in the master resume
- No fabricated metrics or achievements

Resume to polish:
{original_resume}

Master resume (verify all claims against this):
{master_resume}

Output the polished resume JSON. Return ONLY valid JSON.`;

export const REGENERATE_ITEM_PROMPT = `You are a professional resume writer. Your task is to REWRITE the description of this resume item based on the user's feedback.

IMPORTANT: Generate ALL output text in {output_language}.

ITEM INFORMATION:
Type: {item_type}
Title: {title}
Subtitle: {subtitle}

CURRENT DESCRIPTION (the user is NOT satisfied with this):
{current_description}

USER'S FEEDBACK/INSTRUCTION:
{user_instruction}

TASK:
Based on the user's feedback, completely REWRITE the description bullets. The new description should:
1. Address the user's specific concerns/requests
2. Be action-oriented with strong verbs
3. Highlight quantifiable impact ONLY when it already exists in the current description or the user's feedback (never invent numbers)
4. Be technically specific with tools/technologies
5. Show clear impact and ownership

OUTPUT FORMAT (JSON only):
{
  "new_bullets": [
    "Completely rewritten bullet point 1",
    "Completely rewritten bullet point 2",
    "Completely rewritten bullet point 3"
  ],
  "change_summary": "Brief explanation of what was changed based on user feedback"
}

RULES:
- Generate 2-5 NEW bullets (not additions, but replacements)
- Directly address the user's instruction
- Do NOT add any new facts, metrics, dates, companies, titles, or accomplishments that are not already present in CURRENT DESCRIPTION or USER'S FEEDBACK/INSTRUCTION
- If the user asks for metrics but none exist in the provided text, do not fabricate numbers; rewrite to emphasize scope/impact qualitatively instead
- Keep bullets concise (1-2 lines each)
- Use past tense for past roles, present tense for current`;

export const REGENERATE_SKILLS_PROMPT = `You are a professional resume writer. Rewrite the technical skills section based on user feedback.

IMPORTANT: Generate ALL output text in {output_language}.

CURRENT SKILLS:
{current_skills}

USER'S FEEDBACK:
{user_instruction}

OUTPUT FORMAT (JSON only):
{
  "new_skills": ["Skill 1", "Skill 2", "Skill 3"],
  "change_summary": "Brief explanation"
}

RULES:
- Keep skills concise and industry-standard
- Group similar technologies if appropriate
- Prioritize most relevant skills based on feedback
- Only include skills that already exist in CURRENT SKILLS or are explicitly provided in USER'S FEEDBACK`;

export const COVER_LETTER_PROMPT = `Write a brief, human-sounding cover letter for this job application.

IMPORTANT: Write in {output_language}.

Job Description:
{job_description}

Candidate Resume (JSON):
{resume_data}

Requirements:
- 100-150 words maximum
- 3-4 short paragraphs
- Tone: Confident, professional, and conversational. Sound like a skilled human, not an AI.
- Opening: Reference ONE specific problem or goal from the JD and how you've solved it before. NEVER start with "I am writing to express my interest".
- Middle: Connect 1-2 specific achievements to the company's needs. Be specific, not generic.
- Closing: strong and brief. "I'd look forward to discussing how my experience with [X] can help [Company Name]."
- EXTRACT company name from JD. Do not use placeholders.
- Do NOT invent information.

STRICT ANTI-ROBOT RULES:
- DO NOT use words like: "delve", "tapestry", "leverage", "spearheaded", "orchestrated", "synergy", "showcase", "align", "unwavering", "testament".
- DO NOT use phrases like: "I am confident that...", "proven track record", "passionate about", "thrilled to apply".
- DO NOT use em dashes ("—"). Use commas or periods.
- Write simple, punchy sentences. Avoid complex sentence structures.

Output plain text only. No JSON, no markdown formatting.`;

export const OUTREACH_MESSAGE_PROMPT = `Generate a cold outreach message for LinkedIn or email about this job opportunity.

IMPORTANT: Write in {output_language}.

Job Description:
{job_description}

Candidate Resume (JSON):
{resume_data}

Guidelines:
- 50-75 words maximum. Short and sweet.
- Tone: Casual professional. Like messaging a former colleague.
- Content: "Saw you're hiring for [Role]. My background in [Specific Skill] at [Previous Company] seems like a great fit for [Specific Challenge in JD]. Worth a quick chat?"
- NO fluff. NO "I hope this finds you well". NO "I am writing to...".
- Do NOT use placeholder brackets.

STRICT ANTI-ROBOT RULES:
- DO NOT use words like: "leverage", "synergy", "spearheaded", "passion", "thrilled", "eager", "utilize".
- DO NOT use em dashes ("—").
- NO "excited to", "passionate about".

Output plain text only. No JSON, no markdown formatting.`;

export const RESUME_SCHEMA_EXAMPLE = `{
  "personalInfo": {
    "name": "John Doe",
    "title": "Software Engineer",
    "email": "john@example.com",
    "phone": "+1-555-0100",
    "location": "San Francisco, CA",
    "website": "https://johndoe.dev",
    "linkedin": "linkedin.com/in/johndoe",
    "github": "github.com/johndoe"
  },
  "summary": "Experienced software engineer with 5+ years...",
  "workExperience": [
    {
      "id": "1",
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "location": "San Francisco, CA",
      "startDate": "2020",
      "endDate": "Present",
      "current": true,
      "description": [
        "Led development of microservices architecture",
        "Improved system performance by 40%"
      ]
    }
  ],
  "education": [
    {
      "id": "1",
      "institution": "University of California",
      "degree": "B.S. Computer Science",
      "startDate": "2014",
      "endDate": "2018",
      "description": ["Graduated with honors"]
    }
  ],
  "personalProjects": [
    {
      "id": "1",
      "name": "Open Source Tool",
      "role": "Creator & Maintainer",
      "startDate": "2021",
      "endDate": "Present",
      "description": [
        "Built CLI tool with 1000+ GitHub stars",
        "Used by 50+ companies worldwide"
      ]
    }
  ],
  "additional": {
    "technicalSkills": ["Python", "JavaScript", "AWS", "Docker"],
    "languages": ["English (Native)", "Spanish (Conversational)"],
    "certificationsTraining": ["AWS Solutions Architect"],
    "awards": ["Employee of the Year 2022"]
  },
  "customSections": {
    "publications": {
      "sectionType": "itemList",
      "displayName": "Publications",
      "items": [
        {
          "id": "1",
          "name": "Paper Title",
          "description": "Brief description of the publication",
          "date": "2023"
        }
      ]
    },
    "volunteer_work": {
      "sectionType": "itemList",
      "displayName": "Volunteer Work",
      "items": [
          {
             "id": "v1",
             "name": "Volunteer Role",
             "description": "Description",
             "date": "2022"
          }
      ]
    }
  }
}`;
