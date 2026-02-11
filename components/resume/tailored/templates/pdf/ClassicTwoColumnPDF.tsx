'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Link } from '@react-pdf/renderer';
import { ResumeData } from '@/lib/types/resume';

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Times-Roman',
    fontSize: 9,
    lineHeight: 1.3,
    color: '#000',
    flexDirection: 'row',
  },
  sidebar: {
    width: '32%',
    backgroundColor: '#f9fafb',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    padding: 25,
    height: '100%',
  },
  main: {
    width: '68%',
    padding: 30,
    height: '100%',
  },
  sidebarHeader: {
    marginBottom: 20,
    marginTop: 10,
  },
  name: {
    fontSize: 18,
    fontFamily: 'Times-Bold',
    textTransform: 'uppercase',
    marginBottom: 6,
    lineHeight: 1.1,
  },
  jobTitle: {
    fontSize: 10,
    fontFamily: 'Times-Italic',
    color: '#374151',
    marginTop: 4,
    marginBottom: 10,
  },
  sidebarSection: {
    marginBottom: 20,
  },
  sidebarTitle: {
    fontSize: 9,
    fontFamily: 'Times-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 2,
    marginBottom: 8,
  },
  sidebarText: {
    fontSize: 8.5,
    color: '#374151',
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    paddingBottom: 2,
    marginBottom: 10,
    marginTop: 5,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 10,
  },
  itemDate: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
  },
  itemSubtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemCompany: {
    fontFamily: 'Times-Italic',
    fontSize: 9,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 8,
  },
  bullet: {
    width: 8,
  },
  listContent: {
    flex: 1,
    textAlign: 'justify',
  },
  summary: {
    textAlign: 'justify',
    marginBottom: 10,
    fontSize: 9.5,
  }
});

export const ClassicTwoColumnPDF: React.FC<{ data: ResumeData }> = ({ data }) => {
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
        <View style={styles.sidebarHeader}>
            <Text style={styles.name}>{personalInfo?.name || 'Your Name'}</Text>
            <Text style={[styles.jobTitle, { borderBottomWidth: 1.5, borderBottomColor: accentColor, paddingBottom: 4 }]}>{personalInfo?.title || 'Professional'}</Text>
        </View>

        <View style={styles.sidebarSection}>
            <Text style={[styles.sidebarTitle, { borderBottomColor: accentColor }]}>Contact</Text>
            {personalInfo?.email && <Text style={styles.sidebarText}>{personalInfo.email}</Text>}
            {personalInfo?.phone && <Text style={styles.sidebarText}>{personalInfo.phone}</Text>}
            {personalInfo?.location && <Text style={styles.sidebarText}>{personalInfo.location}</Text>}
            {personalInfo?.linkedin && <Link src={personalInfo.linkedin} style={[styles.sidebarText, { color: accentColor }]}>LinkedIn</Link>}
        </View>

        {additional?.technicalSkills?.length > 0 && (
            <View style={styles.sidebarSection}>
                <Text style={[styles.sidebarTitle, { borderBottomColor: accentColor }]}>Skills</Text>
                <Text style={styles.sidebarText}>{additional.technicalSkills.join(', ')}</Text>
            </View>
        )}

        {education?.length > 0 && (
            <View style={styles.sidebarSection}>
                <Text style={[styles.sidebarTitle, { borderBottomColor: accentColor }]}>Education</Text>
                {education.map((edu, i) => (
                    <View key={i} style={{ marginBottom: 6 }}>
                        <Text style={{ fontFamily: 'Times-Bold' }}>{edu.institution}</Text>
                        <Text style={{ fontSize: 8 }}>{edu.degree}</Text>
                        <Text style={{ fontSize: 7, color: '#666' }}>{edu.endDate}</Text>
                    </View>
                ))}
            </View>
        )}

        {additional?.languages?.length > 0 && (
            <View style={styles.sidebarSection}>
                <Text style={[styles.sidebarTitle, { borderBottomColor: accentColor }]}>Languages</Text>
                <Text style={styles.sidebarText}>{additional.languages.join(', ')}</Text>
            </View>
        )}

        {(additional?.certificationsTraining?.length > 0 || additional?.awards?.length > 0) && (
            <View style={styles.sidebarSection}>
                <Text style={[styles.sidebarTitle, { borderBottomColor: accentColor }]}>Additional</Text>
                {additional.certificationsTraining?.length > 0 && (
                    <View style={{ marginBottom: 4 }}>
                        <Text style={{ fontSize: 7, fontFamily: 'Times-Bold' }}>Certifications</Text>
                        <Text style={{ fontSize: 6.5, color: '#444' }}>{additional.certificationsTraining.join(', ')}</Text>
                    </View>
                )}
                {additional.awards?.length > 0 && (
                    <View>
                        <Text style={{ fontSize: 7, fontFamily: 'Times-Bold' }}>Awards</Text>
                        <Text style={{ fontSize: 6.5, color: '#444' }}>{additional.awards.join(', ')}</Text>
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
                <View key={key} style={{ marginBottom: 15 }}>
                    <Text style={[styles.sectionTitle, { borderBottomColor: accentColor }]}>Summary</Text>
                    <Text style={styles.summary}>{summary}</Text>
                </View>
                ) : null;

            case 'workExperience':
                return workExperience?.length > 0 ? (
                <View key={key} style={{ marginBottom: 15 }}>
                    <Text style={[styles.sectionTitle, { borderBottomColor: accentColor }]}>Experience</Text>
                    {workExperience.map((exp, i) => (
                    <View key={i} style={{ marginBottom: 10 }} wrap={false}>
                        <View style={styles.itemHeader}>
                            <Text style={[styles.itemTitle, { flex: 1, marginRight: 10 }]}>{exp.title}</Text>
                            <Text style={styles.itemDate}>{exp.startDate} - {exp.endDate}</Text>
                        </View>
                        <View style={styles.itemSubtitleRow}>
                            <Text style={styles.itemCompany}>{exp.company}</Text>
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

            case 'personalProjects':
                return personalProjects?.length > 0 ? (
                <View key={key} style={{ marginBottom: 15 }}>
                    <Text style={[styles.sectionTitle, { borderBottomColor: accentColor }]}>Projects</Text>
                    {personalProjects.map((proj, i) => (
                    <View key={i} style={{ marginBottom: 10 }} wrap={false}>
                        <View style={styles.itemHeader}>
                            <Text style={[styles.itemTitle, { flex: 1, marginRight: 10 }]}>{proj.name}</Text>
                            <Text style={styles.itemDate}>{proj.startDate} - {proj.endDate}</Text>
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

            default: {
                const section = customSections?.[key];
                if (!section) return null;

                return (
                    <View key={key} style={{ marginBottom: 15 }}>
                        <Text style={[styles.sectionTitle, { borderBottomColor: accentColor }]}>{section.displayName || key.replace(/-/g, ' ')}</Text>
                        
                        {section.sectionType === 'text' && section.text ? (
                            <Text style={styles.summary}>{section.text}</Text>
                        ) : section.sectionType === 'itemList' && section.items ? (
                            section.items.map((item, idx) => (
                                <View key={idx} style={{ marginBottom: 8 }} wrap={false}>
                                    <View style={styles.itemHeader}>
                                        <Text style={[styles.itemTitle, { flex: 1, marginRight: 10 }]}>{item.name}</Text>
                                        {(item.date || item.startDate) && (
                                            <Text style={styles.itemDate}>{item.date || item.startDate} {item.endDate ? `- ${item.endDate}` : ''}</Text>
                                        )}
                                    </View>
                                    {item.role && <Text style={styles.itemCompany}>{item.role}</Text>}
                                    {(item.email || item.phone || item.url) && (
                                        <View style={{ flexDirection: 'row', gap: 10, marginVertical: 2 }}>
                                            {item.email && <Text style={{ fontSize: 7, color: '#444' }}>{item.email}</Text>}
                                            {item.phone && <Text style={{ fontSize: 7, color: '#444' }}>{item.phone}</Text>}
                                            {item.url && <Text style={{ fontSize: 7, color: accentColor }}>{item.url}</Text>}
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
      </View>
    </Page>
  );
};
