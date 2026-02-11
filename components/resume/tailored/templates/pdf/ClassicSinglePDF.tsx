'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Link } from '@react-pdf/renderer';
import { ResumeData } from '@/lib/types/resume';

// No need to register standard fonts like Times-Roman

const styles = StyleSheet.create({
  page: {
    padding: '15mm 20mm',
    fontFamily: 'Times-Roman',
    fontSize: 10,
    lineHeight: 1.4,
    color: '#000',
  },
  header: {
    textAlign: 'center',
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontFamily: 'Times-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    lineHeight: 1.1,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 5,
    color: '#444',
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 2,
    marginBottom: 8,
    marginTop: 10,
  },
  summary: {
    textAlign: 'justify',
    marginBottom: 5,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  itemTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 10,
  },
  itemDate: {
    fontSize: 9,
    fontFamily: 'Times-Bold',
  },
  itemSubtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemCompany: {
    fontFamily: 'Times-Italic',
    fontSize: 9,
  },
  itemLocation: {
    fontSize: 9,
    color: '#444',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 10,
  },
  bullet: {
    width: 10,
    fontSize: 10,
  },
  listContent: {
    flex: 1,
    textAlign: 'justify',
  },
  skillsGrid: {
    flexDirection: 'column',
    gap: 6,
  },
  skillRow: {
    flexDirection: 'row',
    gap: 5,
  },
  skillLabel: {
    fontFamily: 'Times-Bold',
    width: 100,
  },
  skillValue: {
    flex: 1,
    flexWrap: 'wrap',
  },
  skillText: { // Added for consistency with the instruction's skill rendering
    flex: 1,
    flexWrap: 'wrap',
  },
  item: { // Added for consistency with the instruction's item rendering
    marginBottom: 8,
  }
});

export const ClassicSinglePDF: React.FC<{ data: ResumeData }> = ({ data }) => {
  const { personalInfo, summary, workExperience, education, additional, personalProjects, customSections, sectionMeta, accentColor = '#2563eb' } = data;

  const sortedSections = (sectionMeta || [])
    .filter(s => s.isVisible && s.id !== 'personalInfo')
    .sort((a, b) => a.order - b.order);

  const defaultOrder = ['summary', 'workExperience', 'education', 'personalProjects', 'additional'];
  const sectionsToRender = sortedSections.length > 0 
    ? sortedSections.map(s => s.key) 
    : [...defaultOrder, ...(customSections ? Object.keys(customSections) : [])];

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{personalInfo?.name || 'Your Name'}</Text>
        <View style={styles.contactRow}>
          {personalInfo?.email && <Text>{personalInfo.email}</Text>}
          {personalInfo?.phone && <Text> | {personalInfo.phone}</Text>}
          {personalInfo?.location && <Text> | {personalInfo.location}</Text>}
        </View>
        <View style={styles.contactRow}>
          {personalInfo?.linkedin && <Link src={personalInfo.linkedin} style={{ color: accentColor }}>LinkedIn</Link>}
          {personalInfo?.github && personalInfo.linkedin && <Text> | </Text>}
          {personalInfo?.github && <Link src={personalInfo.github} style={{ color: accentColor }}>GitHub</Link>}
          {personalInfo?.website && (personalInfo.github || personalInfo.linkedin) && <Text> | </Text>}
          {personalInfo?.website && <Link src={personalInfo.website} style={{ color: accentColor }}>Portfolio</Link>}
        </View>
      </View>

      {/* Sections */}
      {sectionsToRender.map(key => {
        switch(key) {
          case 'summary':
            return summary ? (
              <View key={key} style={styles.section} wrap={false}>
                <Text style={[styles.sectionTitle, { borderBottomColor: accentColor }]}>Summary</Text>
                <Text style={styles.summary}>{summary}</Text>
              </View>
            ) : null;

          case 'workExperience':
            return workExperience?.length > 0 ? (
              <View key={key} style={styles.section}>
                <Text style={[styles.sectionTitle, { borderBottomColor: accentColor }]}>Experience</Text>
                {workExperience.map((exp, i) => (
                  <View key={i} style={styles.item} wrap={false}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemTitle, { flex: 1, marginRight: 10 }]}>{exp.title}</Text>
                      <Text style={styles.itemDate}>{exp.startDate} - {exp.endDate}</Text>
                    </View>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemCompany}>{exp.company}</Text>
                      <Text style={styles.itemLocation}>{exp.location}</Text>
                    </View>
                    {(Array.isArray(exp.description) ? exp.description : [exp.description]).map((desc, idx) => (
                      <View key={idx} style={styles.listItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.listContent}>{desc}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ) : null;

          case 'education':
            return education?.length > 0 ? (
              <View key={key} style={styles.section}>
                <Text style={[styles.sectionTitle, { borderBottomColor: accentColor }]}>Education</Text>
                {education.map((edu, i) => (
                  <View key={i} style={styles.item} wrap={false}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemTitle, { flex: 1, marginRight: 10 }]}>{edu.institution}</Text>
                      <Text style={styles.itemDate}>{edu.startDate ? `${edu.startDate} - ` : ''}{edu.endDate}</Text>
                    </View>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemCompany}>{edu.degree}</Text>
                      <Text style={styles.itemLocation}>{edu.location}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null;

          case 'personalProjects':
            return personalProjects?.length > 0 ? (
              <View key={key} style={styles.section}>
                <Text style={styles.sectionTitle}>Projects</Text>
                {personalProjects.map((proj, i) => (
                  <View key={i} style={{ marginBottom: 8 }} wrap={false}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemTitle, { flex: 1, marginRight: 10 }]}>{proj.name}</Text>
                      <Text style={styles.itemDate}>{proj.startDate} {proj.endDate ? `- ${proj.endDate}` : ''}</Text>
                    </View>
                    <Text style={[styles.itemCompany, { marginBottom: 4 }]}>{proj.role}</Text>
                    {(Array.isArray(proj.description) ? proj.description : [proj.description]).map((desc, idx) => (
                      <View key={idx} style={styles.listItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.listContent}>{desc}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ) : null;

          case 'additional':
             return additional ? (
              <View key={key} style={styles.section} wrap={false}>
                <Text style={[styles.sectionTitle, { borderBottomColor: accentColor }]}>Skills & Additional</Text>
                <View style={styles.skillsGrid}>
                  {additional.technicalSkills?.length > 0 && (
                    <View style={styles.skillRow}>
                      <Text style={styles.skillLabel}>Technical Skills: </Text>
                      <Text style={styles.skillText}>{additional.technicalSkills.join(', ')}</Text>
                    </View>
                  )}
                  {additional.languages?.length > 0 && (
                    <View style={styles.skillRow}>
                      <Text style={styles.skillLabel}>Languages: </Text>
                      <Text style={styles.skillText}>{additional.languages.join(', ')}</Text>
                    </View>
                  )}
                  {additional.certificationsTraining?.length > 0 && (
                    <View style={styles.skillRow}>
                      <Text style={styles.skillLabel}>Certifications: </Text>
                      <Text style={styles.skillText}>{additional.certificationsTraining.join(', ')}</Text>
                    </View>
                  )}
                   {additional.awards?.length > 0 && (
                    <View style={styles.skillRow}>
                      <Text style={styles.skillLabel}>Awards:</Text>
                      <Text style={styles.skillValue}>{additional.awards.join(', ')}</Text>
                    </View>
                  )}
                </View>
              </View>
             ) : null;

          default: {
              const section = customSections?.[key];
              if (!section) return null;

              return (
                <View key={key} style={styles.section}>
                  <Text style={[styles.sectionTitle, { borderBottomColor: accentColor }]}>{section.displayName || key.replace(/-/g, ' ')}</Text>
                                    {section.sectionType === 'text' && section.text ? (
                            <Text style={styles.summary}>{section.text}</Text>
                  ) : section.sectionType === 'itemList' && section.items ? (
                    section.items.map((item, idx) => (
                      <View key={idx} style={{ marginBottom: 6 }} wrap={false}>
                        <View style={styles.itemHeader}>
                          <Text style={[styles.itemTitle, { flex: 1, marginRight: 10 }]}>{item.name}</Text>
                          {(item.date || item.startDate) && (
                            <Text style={styles.itemDate}>{item.date || item.startDate} {item.endDate ? `- ${item.endDate}` : ''}</Text>
                          )}
                        </View>
                        {item.role && <Text style={styles.itemCompany}>{item.role}</Text>}
                        {(item.email || item.phone || item.url) && (
                          <View style={{ flexDirection: 'row', gap: 10, marginVertical: 2 }}>
                            {item.email && <Text style={{ fontSize: 8, color: '#444' }}>{item.email}</Text>}
                            {item.phone && <Text style={{ fontSize: 8, color: '#444' }}>{item.phone}</Text>}
                            {item.url && <Text style={{ fontSize: 8, color: accentColor }}>{item.url}</Text>}
                          </View>
                        )}
                        {item.description && <Text style={[styles.summary, { marginTop: 2 }]}>{item.description}</Text>}
                      </View>
                    ))
                  ) : section.sectionType === 'stringList' && section.strings ? (
                    section.strings.map((str, idx) => (
                      <View key={idx} style={styles.listItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.listContent}>{str}</Text>
                      </View>
                    ))
                  ) : null}
                </View>
              );
          }
        }
      })}
    </Page>
  );
};
