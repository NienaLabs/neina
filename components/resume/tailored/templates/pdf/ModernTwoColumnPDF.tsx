'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Link, Svg, Path } from '@react-pdf/renderer';
import { ResumeData } from '@/lib/types/resume';

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Times-Roman',
    fontSize: 9,
    lineHeight: 1.4,
    color: '#374151',
    flexDirection: 'row',
  },
  sidebar: {
    width: '35%',
    backgroundColor: '#0f172a',
    padding: 30,
    height: '100%',
    color: '#fff',
  },
  main: {
    width: '65%',
    padding: 35,
    height: '100%',
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 22,
    fontFamily: 'Times-Bold',
    color: '#fff',
    textTransform: 'uppercase',
    marginBottom: 6,
    lineHeight: 1.1,
  },
  jobTitle: {
    fontSize: 10,
    color: '#60a5fa',
    fontFamily: 'Times-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 20,
  },
  sidebarSection: {
    marginBottom: 25,
  },
  sidebarTitle: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
  },
  sidebarText: {
    fontSize: 9,
    color: '#cbd5e1',
    marginBottom: 6,
  },
  mainSectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
    marginTop: 10,
  },
  titleDot: {
    width: 4,
    height: 12,
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    color: '#111827',
  },
  itemDate: {
    fontSize: 8,
    color: '#6b7280',
    fontFamily: 'Times-Bold',
  },
  itemSubtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemCompany: {
    fontSize: 9,
    fontFamily: 'Times-Bold',
    color: '#2563eb',
    textTransform: 'uppercase',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    width: 10,
    color: '#3b82f6',
  },
  listContent: {
    flex: 1,
    fontSize: 10,
    color: '#4b5563',
  },
  summary: {
    fontSize: 10,
    color: '#4b5563',
    lineHeight: 1.6,
    marginBottom: 15,
  },
  skillPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 8,
    marginBottom: 4,
    marginRight: 4,
  }
});

export const ModernTwoColumnPDF: React.FC<{ data: ResumeData }> = ({ data }) => {
  const { personalInfo, summary, workExperience, education, additional, personalProjects, customSections, sectionMeta, accentColor = '#2563eb' } = data;

  const sortedSections = (sectionMeta || [])
    .filter(s => s.isVisible && s.id !== 'personalInfo' && !['additional', 'education'].includes(s.key))
    .sort((a, b) => a.order - b.order);

  const defaultMainOrder = ['summary', 'workExperience', 'personalProjects'];
  const mainSectionsToRender = sortedSections.length > 0 
    ? sortedSections.map(s => s.key) 
    : [...defaultMainOrder, ...(customSections ? Object.keys(customSections) : [])];

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.sidebar}>
        <Text style={styles.name}>{personalInfo?.name || 'Your Name'}</Text>
        <Text style={[styles.jobTitle, { color: accentColor }]}>{personalInfo?.title || 'Professional'}</Text>

        <View style={styles.sidebarSection}>
            <Text style={styles.sidebarTitle}>Contact</Text>
            {personalInfo?.email && <Text style={styles.sidebarText}>{personalInfo.email}</Text>}
            {personalInfo?.phone && <Text style={styles.sidebarText}>{personalInfo.phone}</Text>}
            {personalInfo?.location && <Text style={styles.sidebarText}>{personalInfo.location}</Text>}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                {personalInfo?.linkedin && <Link src={personalInfo.linkedin} style={[styles.sidebarText, { color: accentColor }]}>LinkedIn</Link>}
                {personalInfo?.github && <Link src={personalInfo.github} style={[styles.sidebarText, { color: accentColor }]}>GitHub</Link>}
            </View>
        </View>

        {additional?.technicalSkills?.length > 0 && (
            <View style={styles.sidebarSection}>
                <Text style={styles.sidebarTitle}>Skills</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {additional.technicalSkills.map((s, i) => (
                        <Text key={i} style={[styles.skillPill, { backgroundColor: `${accentColor}40` }]}>{s}</Text>
                    ))}
                </View>
            </View>
        )}

        {education?.length > 0 && (
            <View style={styles.sidebarSection}>
                <Text style={styles.sidebarTitle}>Education</Text>
                {education.map((edu, i) => (
                    <View key={i} style={{ marginBottom: 10 }}>
                        <Text style={{ fontFamily: 'Times-Bold', color: '#fff', fontSize: 9 }}>{edu.institution}</Text>
                        <Text style={{ fontSize: 8, color: accentColor, marginTop: 2 }}>{edu.degree}</Text>
                        <Text style={{ fontSize: 7, color: '#94a3b8', marginTop: 1 }}>{edu.endDate}</Text>
                    </View>
                ))}
            </View>
        )}

        {additional?.languages?.length > 0 && (
            <View style={styles.sidebarSection}>
                <Text style={styles.sidebarTitle}>Languages</Text>
                <Text style={styles.sidebarText}>{additional.languages.join(', ')}</Text>
            </View>
        )}

        {(additional?.certificationsTraining?.length > 0 || additional?.awards?.length > 0) && (
            <View style={styles.sidebarSection}>
                <Text style={styles.sidebarTitle}>Additional</Text>
                {additional.certificationsTraining?.length > 0 && (
                    <View style={{ marginBottom: 6 }}>
                        <Text style={{ fontSize: 7, fontFamily: 'Times-Bold', color: '#fff' }}>Certifications</Text>
                        <Text style={{ fontSize: 6.5, color: '#cbd5e1' }}>{additional.certificationsTraining.join(', ')}</Text>
                    </View>
                )}
                {additional.awards?.length > 0 && (
                    <View>
                        <Text style={{ fontSize: 7, fontFamily: 'Times-Bold', color: '#fff' }}>Awards</Text>
                        <Text style={{ fontSize: 6.5, color: '#cbd5e1' }}>{additional.awards.join(', ')}</Text>
                    </View>
                )}
            </View>
        )}
      </View>

      <View style={styles.main}>
        {mainSectionsToRender.map(key => {
            switch(key) {
            case 'summary':
                return summary ? (
                <View key={key}>
                    <View style={styles.mainSectionTitle}>
                        <View style={[styles.titleDot, { backgroundColor: accentColor }]} />
                        <Text style={styles.sectionTitle}>Profile</Text>
                    </View>
                    <Text style={styles.summary}>{summary}</Text>
                </View>
                ) : null;

            case 'workExperience':
                return workExperience?.length > 0 ? (
                <View key={key}>
                    <View style={styles.mainSectionTitle}>
                        <View style={[styles.titleDot, { backgroundColor: accentColor }]} />
                        <Text style={styles.sectionTitle}>Experience</Text>
                    </View>
                    {workExperience.map((exp, i) => (
                    <View key={i} style={{ marginBottom: 12 }} wrap={false}>
                        <View style={styles.itemHeader}>
                            <Text style={[styles.itemTitle, { flex: 1, marginRight: 10 }]}>{exp.title}</Text>
                            <Text style={[styles.itemDate, { color: accentColor }]}>{exp.startDate} - {exp.endDate}</Text>
                        </View>
                        <View style={styles.itemSubtitleRow}>
                            <Text style={[styles.itemCompany, { color: accentColor }]}>{exp.company}</Text>
                        </View>
                        {(Array.isArray(exp.description) ? exp.description : [exp.description]).map((desc, idx) => (
                        <View key={idx} style={styles.listItem}>
                            <Text style={[styles.bullet, { color: accentColor }]}>•</Text>
                            <Text style={styles.listContent}>{desc}</Text>
                        </View>
                        ))}
                    </View>
                    ))}
                </View>
                ) : null;

            case 'personalProjects':
                return personalProjects?.length > 0 ? (
                <View key={key}>
                    <View style={styles.mainSectionTitle}>
                        <View style={[styles.titleDot, { backgroundColor: accentColor }]} />
                        <Text style={styles.sectionTitle}>Projects</Text>
                    </View>
                    {personalProjects.map((proj, i) => (
                    <View key={i} style={{ marginBottom: 12 }} wrap={false}>
                        <View style={styles.itemHeader}>
                            <Text style={[styles.itemTitle, { flex: 1, marginRight: 10 }]}>{proj.name}</Text>
                            <Text style={styles.itemDate}>{proj.startDate} - {proj.endDate}</Text>
                        </View>
                        <Text style={[styles.itemCompany, { marginBottom: 6, fontSize: 8, color: '#6b7280' }]}>{proj.role}</Text>
                        {(Array.isArray(proj.description) ? proj.description : [proj.description]).map((desc, idx) => (
                        <View key={idx} style={styles.listItem}>
                            <Text style={[styles.bullet, { color: accentColor }]}>•</Text>
                            <Text style={styles.listContent}>{desc}</Text>
                        </View>
                        ))}
                    </View>
                    ))}
                </View>
                ) : null;

            default: {
                const section = customSections?.[key];
                if (!section) return null;

                return (
                    <View key={key} style={{ marginBottom: 15 }}>
                        <View style={styles.mainSectionTitle}>
                            <View style={[styles.titleDot, { backgroundColor: accentColor }]} />
                            <Text style={styles.sectionTitle}>{section.displayName || key.replace(/-/g, ' ')}</Text>
                        </View>
                        
                        {section.sectionType === 'text' && section.text ? (
                            <Text style={styles.summary}>{section.text}</Text>
                        ) : section.sectionType === 'itemList' && section.items ? (
                            section.items.map((item, idx) => (
                                <View key={idx} style={{ marginBottom: 12 }} wrap={false}>
                                    <View style={styles.itemHeader}>
                                        <Text style={[styles.itemTitle, { flex: 1, marginRight: 10 }]}>{item.name}</Text>
                                        {(item.date || item.startDate) && (
                                            <Text style={styles.itemDate}>{item.date || item.startDate} {item.endDate ? `- ${item.endDate}` : ''}</Text>
                                        )}
                                    </View>
                                    {item.role && <Text style={[styles.itemCompany, { color: accentColor, marginBottom: 4 }]}>{item.role}</Text>}
                                    {(item.email || item.phone || item.url) && (
                                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
                                            {item.email && <Text style={{ fontSize: 7, color: '#6b7280' }}>{item.email}</Text>}
                                            {item.phone && <Text style={{ fontSize: 7, color: '#6b7280' }}>{item.phone}</Text>}
                                            {item.url && <Text style={{ fontSize: 7, color: accentColor }}>{item.url}</Text>}
                                        </View>
                                    )}
                                    {item.description && <Text style={[styles.listContent, { flex: 0 }]}>{item.description}</Text>}
                                </View>
                            ))
                        ) : section.sectionType === 'stringList' && section.strings ? (
                            section.strings.map((str, idx) => (
                                <View key={idx} style={styles.listItem}>
                                    <Text style={[styles.bullet, { color: accentColor }]}>•</Text>
                                    <Text style={styles.listContent}>{str}</Text>
                                </View>
                            ))
                        ) : null}
                    </View>
                );
            }
            }
        })}
      </View>
    </Page>
  );
};
