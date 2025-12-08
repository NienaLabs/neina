import { ResumeExtraction } from "@/components/resume/editor/types";

export function jsonToMarkdown(data: ResumeExtraction): string {
  let markdown = "";

  // Address / Contact Info
  if (data.address) {
    const { location, email, telephone, linkedInProfile, githubProfile, portfolio, otherLinks } = data.address;
    markdown += `# Contact Information\n`;
    if (location) markdown += `- Location: ${location}\n`;
    if (email) markdown += `- Email: ${email}\n`;
    if (telephone) markdown += `- Phone: ${telephone}\n`;
    if (linkedInProfile) markdown += `- LinkedIn: ${linkedInProfile}\n`;
    if (githubProfile) markdown += `- GitHub: ${githubProfile}\n`;
    if (portfolio) markdown += `- Portfolio: ${portfolio}\n`;
    if (otherLinks && otherLinks.length > 0) {
      otherLinks.forEach(link => {
        if (link) markdown += `- Link: ${link}\n`;
      });
    }
    markdown += `\n`;
  }

  // Profile / Summary
  if (data.profile) {
    markdown += `# Profile\n${data.profile}\n\n`;
  }
  if (data.summary) {
    markdown += `# Summary\n${data.summary}\n\n`;
  }
  if (data.objective) {
    markdown += `# Objective\n${data.objective}\n\n`;
  }

  // Education
  if (data.education && data.education.length > 0) {
    markdown += `# Education\n`;
    data.education.forEach(edu => {
      markdown += `## ${edu.institution || 'Unknown Institution'}\n`;
      if (edu.degree) markdown += `- Degree: ${edu.degree}\n`;
      if (edu.fieldOfStudy) markdown += `- Field of Study: ${edu.fieldOfStudy}\n`;
      if (edu.startDate || edu.endDate) markdown += `- Dates: ${edu.startDate || ''} - ${edu.endDate || 'Present'}\n`;
      if (edu.location) markdown += `- Location: ${edu.location}\n`;
      if (edu.grade) markdown += `- Grade: ${edu.grade}\n`;
      if (edu.description) markdown += `${edu.description}\n`;
      markdown += `\n`;
    });
  }

  // Experience
  if (data.experience && data.experience.length > 0) {
    markdown += `# Experience\n`;
    data.experience.forEach(exp => {
      markdown += `## ${exp.position || 'Unknown Position'} at ${exp.company || 'Unknown Company'}\n`;
      if (exp.startDate || exp.endDate) markdown += `- Dates: ${exp.startDate || ''} - ${exp.endDate || 'Present'}\n`;
      if (exp.location) markdown += `- Location: ${exp.location}\n`;
      if (exp.description) markdown += `${exp.description}\n`;
      if (exp.responsibilities && exp.responsibilities.length > 0) {
        markdown += `### Responsibilities\n`;
        exp.responsibilities.forEach(resp => markdown += `- ${resp}\n`);
      }
      if (exp.achievements && exp.achievements.length > 0) {
        markdown += `### Achievements\n`;
        exp.achievements.forEach(ach => markdown += `- ${ach}\n`);
      }
      markdown += `\n`;
    });
  }

  // Skills
  if (data.skills) {
    markdown += `# Skills\n`;
    Object.entries(data.skills).forEach(([category, skills]) => {
      if (skills && skills.length > 0) {
        markdown += `- ${category}: ${skills.join(', ')}\n`;
      }
    });
    markdown += `\n`;
  }

  // Projects
  if (data.projects && data.projects.length > 0) {
    markdown += `# Projects\n`;
    data.projects.forEach(proj => {
      markdown += `## ${proj.name || 'Unknown Project'}\n`;
      if (proj.role) markdown += `- Role: ${proj.role}\n`;
      if (proj.link) markdown += `- Link: ${proj.link}\n`;
      if (proj.description) markdown += `${proj.description}\n`;
      if (proj.technologies && proj.technologies.length > 0) {
        markdown += `- Technologies: ${proj.technologies.join(', ')}\n`;
      }
      markdown += `\n`;
    });
  }

  // Certifications
  if (data.certifications && data.certifications.length > 0) {
    markdown += `# Certifications\n`;
    data.certifications.forEach(cert => {
      markdown += `## ${cert.name || 'Unknown Certification'}\n`;
      if (cert.issuer) markdown += `- Issuer: ${cert.issuer}\n`;
      if (cert.year) markdown += `- Year: ${cert.year}\n`;
      if (cert.description) markdown += `${cert.description}\n`;
      markdown += `\n`;
    });
  }

  // Awards
  if (data.awards && data.awards.length > 0) {
    markdown += `# Awards\n`;
    data.awards.forEach(award => {
      markdown += `## ${award.title || 'Unknown Award'}\n`;
      if (award.issuer) markdown += `- Issuer: ${award.issuer}\n`;
      if (award.year) markdown += `- Year: ${award.year}\n`;
      if (award.description) markdown += `${award.description}\n`;
      markdown += `\n`;
    });
  }

  // Publications
  if (data.publications && data.publications.length > 0) {
    markdown += `# Publications\n`;
    data.publications.forEach(pub => {
      markdown += `## ${pub.title || 'Unknown Publication'}\n`;
      if (pub.publisher) markdown += `- Publisher: ${pub.publisher}\n`;
      if (pub.date) markdown += `- Date: ${pub.date}\n`;
      if (pub.link) markdown += `- Link: ${pub.link}\n`;
      if (pub.description) markdown += `${pub.description}\n`;
      markdown += `\n`;
    });
  }

  // Languages
  if (data.languages && data.languages.length > 0) {
    markdown += `# Languages\n`;
    data.languages.forEach(lang => {
      markdown += `- ${lang.name || 'Unknown'}: ${lang.proficiency || 'Unknown'}\n`;
    });
    markdown += `\n`;
  }

  // Hobbies
  if (data.hobbies && data.hobbies.length > 0) {
    markdown += `# Hobbies\n`;
    markdown += data.hobbies.join(', ') + `\n\n`;
  }

  // Custom Sections
  if (data.customSections && data.customSections.length > 0) {
    data.customSections.forEach(section => {
      markdown += `# ${section.sectionName}\n`;
      section.entries.forEach(entry => {
        markdown += `## ${entry.title || ''}\n`;
        if (entry.organization) markdown += `- Organization: ${entry.organization}\n`;
        if (entry.year) markdown += `- Year: ${entry.year}\n`;
        if (entry.description) markdown += `${entry.description}\n`;
        markdown += `\n`;
      });
    });
  }

  return markdown;
}
