'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ResumeData } from '@/lib/types/resume';

// Standard Styles
const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Times-Roman',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
  },
  container: {
    padding: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 4,
    borderBottomColor: '#2563eb',
  },
  headerLeft: {
    flex: 1,
  },
  name: {
    fontSize: 26,
    fontFamily: 'Times-Bold',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    lineHeight: 1.1,
  },
  jobTitle: {
    fontSize: 12,
    color: '#2563eb',
    fontFamily: 'Times-Bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 6,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  contactText: {
    fontSize: 9,
    color: '#4b5563',
    fontFamily: 'Times-Roman',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  titleLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#dbeafe',
  },
  summary: {
    fontSize: 10.5,
    color: '#4b5563',
    lineHeight: 1.6,
    marginBottom: 15,
  },
  itemContainer: {
    marginBottom: 15,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#f3f4f6',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    color: '#111827',
  },
  itemDate: {
    fontSize: 9,
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    flexShrink: 0,
  },
  itemSubtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemCompany: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemLocation: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#9ca3af',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    width: 12,
    color: '#60a5fa',
    fontSize: 10,
  },
  listContent: {
    flex: 1,
    fontSize: 10,
    color: '#4b5563',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  skillBox: {
    width: '45%',
    marginBottom: 10,
  },
  skillLabel: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  skillValueRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  skillPill: {
    fontSize: 9,
    fontFamily: 'Times-Roman',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customDescription: {
    fontSize: 10,
    color: '#4b5563',
    lineHeight: 1.4,
  }
});

export const ModernSinglePDF: React.FC<{ data: ResumeData }> = ({ data }) => {
  const { personalInfo, summary, workExperience, education, additional, personalProjects, customSections, sectionMeta, accentColor = '#2563eb' } = data;

  const sortedSections = (sectionMeta || [])
    .filter(s => s.isVisible && s.id !== 'personalInfo' && !['additional'].includes(s.key))
    .sort((a, b) => a.order - b.order);

  const defaultMainOrder = ['summary', 'workExperience', 'personalProjects', 'education'];
  const mainSectionsToRender = sortedSections.length > 0 
    ? sortedSections.map(s => s.key) 
    : [...defaultMainOrder, ...(customSections ? Object.keys(customSections) : [])];

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: accentColor }]}>
            <View style={styles.headerLeft}>
                <Text style={styles.name}>{personalInfo?.name || 'Your Name'}</Text>
                <Text style={[styles.jobTitle, { color: accentColor }]}>{personalInfo?.title || 'Professional'}</Text>
            </View>
            <View style={styles.headerRight}>
                {personalInfo?.email && <Text style={styles.contactText}>{personalInfo.email}</Text>}
                {personalInfo?.phone && <Text style={styles.contactText}>{personalInfo.phone}</Text>}
                {personalInfo?.location && <Text style={styles.contactText}>{personalInfo.location}</Text>}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    {personalInfo?.linkedin && <Text style={[styles.contactText, { color: accentColor }]}>LinkedIn</Text>}
                    {personalInfo?.github && <Text style={[styles.contactText, { color: accentColor }]}>GitHub</Text>}
                </View>
            </View>
        </View>

        {/* Sections */}
        {mainSectionsToRender.map(key => {
            switch(key) {
            case 'summary':
                return summary ? (
                <View key={key} style={styles.itemContainer} wrap={false}>
                    <View style={styles.sectionTitleRow}>
                        <Text style={[styles.sectionTitle, { color: accentColor }]}>Summary</Text>
                        <View style={[styles.titleLine, { backgroundColor: `${accentColor}20` }]} />
                    </View>
                    <Text style={styles.summary}>{summary}</Text>
                </View>
                ) : null;

            case 'workExperience':
                return workExperience?.length > 0 ? (
                <View key={key}>
                    <View style={styles.sectionTitleRow}>
                        <Text style={[styles.sectionTitle, { color: accentColor }]}>Work Experience</Text>
                        <View style={[styles.titleLine, { backgroundColor: `${accentColor}20` }]} />
                    </View>
                    {workExperience.map((exp, i) => (
                    <View key={i} style={styles.itemContainer} wrap={false}>
                        <View style={styles.itemHeader}>
                            <Text style={[styles.itemTitle, { flex: 1, marginRight: 10 }]}>{exp.title}</Text>
                            <Text style={[styles.itemDate, { color: accentColor, backgroundColor: `${accentColor}10` }]}>{exp.startDate} - {exp.endDate}</Text>
                        </View>
                        <View style={styles.itemSubtitleRow}>
                            <Text style={styles.itemCompany}>{exp.company}</Text>
                            <Text style={styles.itemLocation}>{exp.location}</Text>
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

            case 'education':
                return education?.length > 0 ? (
                <View key={key}>
                    <View style={styles.sectionTitleRow}>
                        <Text style={[styles.sectionTitle, { color: accentColor }]}>Education</Text>
                        <View style={[styles.titleLine, { backgroundColor: `${accentColor}20` }]} />
                    </View>
                    {education.map((edu, i) => (
                    <View key={i} style={styles.itemContainer} wrap={false}>
                        <View style={styles.itemHeader}>
                            <Text style={[styles.itemTitle, { flex: 1, marginRight: 10 }]}>{edu.institution}</Text>
                            <Text style={styles.itemDate}>{edu.startDate} - {edu.endDate}</Text>
                        </View>
                        <View style={styles.itemSubtitleRow}>
                            <Text style={styles.itemCompany}>{edu.degree}</Text>
                            <Text style={styles.itemLocation}>{edu.location}</Text>
                        </View>
                    </View>
                    ))}
                </View>
                ) : null;

            case 'personalProjects':
                return personalProjects?.length > 0 ? (
                <View key={key}>
                    <View style={styles.sectionTitleRow}>
                        <Text style={styles.sectionTitle}>Projects</Text>
                        <View style={styles.titleLine} />
                    </View>
                    {personalProjects.map((proj, i) => (
                    <View key={i} style={styles.itemContainer} wrap={false}>
                        <View style={styles.itemHeader}>
                            <Text style={[styles.itemTitle, { flex: 1, marginRight: 10 }]}>{proj.name}</Text>
                            <Text style={styles.itemDate}>{proj.startDate} {proj.endDate ? `- ${proj.endDate}` : ''}</Text>
                        </View>
                        <Text style={[styles.itemSubtitleRow, styles.itemCompany, { fontSize: 9, marginBottom: 6 }]}>{proj.role}</Text>
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
                <View key={key}>
                    <View style={styles.sectionTitleRow}>
                        <Text style={styles.sectionTitle}>Skills & Expertise</Text>
                        <View style={styles.titleLine} />
                    </View>
                    <View style={styles.skillsGrid}>
                    {additional.technicalSkills?.length > 0 && (
                        <View style={styles.skillBox}>
                            <Text style={styles.skillLabel}>Technical Stack</Text>
                            <View style={styles.skillValueRow}>
                                {additional.technicalSkills.map((s, i) => <Text key={i} style={styles.skillPill}>{s}</Text>)}
                            </View>
                        </View>
                    )}
                    {additional.languages?.length > 0 && (
                        <View style={styles.skillBox}>
                            <Text style={styles.skillLabel}>Languages</Text>
                            <Text style={[styles.listContent, { fontWeight: 'bold', color: '#2563eb' }]}>{additional.languages.join(' • ')}</Text>
                        </View>
                    )}
                    {additional.certificationsTraining?.length > 0 && (
                        <View style={[styles.skillBox, { width: '100%' }]}>
                            <Text style={styles.skillLabel}>Certifications</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                {additional.certificationsTraining.map((s, i) => (
                                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                        <View style={{ width: 3, height: 3, backgroundColor: '#2563eb', borderRadius: 2 }} />
                                        <Text style={{ fontSize: 9, color: '#4b5563' }}>{s}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                    </View>
                </View>
                ) : null;

            default: {
                const section = customSections?.[key];
                if (!section) return null;

                return (
                    <View key={key} style={{ marginTop: 15 }}>
                        <View style={styles.sectionTitleRow}>
                            <Text style={[styles.sectionTitle, { color: accentColor }]}>{section.displayName || key.replace(/-/g, ' ')}</Text>
                            <View style={[styles.titleLine, { backgroundColor: `${accentColor}20` }]} />
                        </View>
                        
                        {section.sectionType === 'text' && section.text ? (
                            <Text style={styles.summary}>{section.text}</Text>
                        ) : section.sectionType === 'itemList' && section.items ? (
                            section.items.map((item, idx) => (
                                <View key={idx} style={styles.itemContainer} wrap={false}>
                                    <View style={styles.itemHeader}>
                                        <Text style={[styles.itemTitle, { flex: 1, marginRight: 10 }]}>{item.name}</Text>
                                        {(item.date || item.startDate) && (
                                            <Text style={[styles.itemDate, { color: accentColor, backgroundColor: `${accentColor}10` }]}>
                                                {item.date || item.startDate} {item.endDate ? `- ${item.endDate}` : ''}
                                            </Text>
                                        )}
                                    </View>
                                    {item.role && (
                                        <View style={styles.itemSubtitleRow}>
                                            <Text style={styles.itemCompany}>{item.role}</Text>
                                        </View>
                                    )}
                                    {(item.email || item.phone || item.url) && (
                                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 5 }}>
                                            {item.email && <Text style={{ fontSize: 8, color: '#6b7280' }}>{item.email}</Text>}
                                            {item.phone && <Text style={{ fontSize: 8, color: '#6b7280' }}>{item.phone}</Text>}
                                            {item.url && <Text style={{ fontSize: 8, color: accentColor }}>{item.url}</Text>}
                                        </View>
                                    )}
                                    {item.description && (
                                        <Text style={[styles.customDescription, { marginTop: 4 }]}>{item.description}</Text>
                                    )}
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
