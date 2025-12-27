import React from 'react';
import { Page, Text, View, Document, StyleSheet, Link } from '@react-pdf/renderer';
import { ResumeExtraction } from '../editor/types';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Times-Roman',
    color: '#333333',
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#CCCCCC',
    paddingBottom: 12,
    alignItems: 'flex-end',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contactInfo: {
    fontSize: 10,
    flexDirection: 'column',
    gap: 2,
    color: '#4B5563',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 2,
  },
  itemContainer: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  mainText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subText: {
    fontSize: 10,
    color: '#4B5563',
  },
  dateLocation: {
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  description: {
    fontSize: 9,
    marginTop: 2,
    lineHeight: 1.3,
    color: '#4B5563',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginTop: 1,
    paddingLeft: 4,
  },
  bullet: {
    width: 8,
    fontSize: 9,
    color: '#6B7280',
  },
  bulletContent: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.3,
    color: '#4B5563',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillItem: {
    fontSize: 9,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    color: '#374151',
  },
  link: {
    color: '#2563EB',
    textDecoration: 'none',
  }
});

interface ResumePDFProps {
  data: ResumeExtraction;
  fullName?: string;
}

const ResumePDF: React.FC<ResumePDFProps> = ({ data, fullName }) => {
  const {
    address,
    profile,
    objective,
    education,
    experience,
    skills,
    projects,
    certifications,
    awards,
    publications,
    customSections,
  } = data;

  const formatDate = (dateString?: string) => {
    if (!dateString || dateString.toLowerCase() === 'n/a') return null;
    return dateString;
  };

  const formatDateRange = (start?: string, end?: string) => {
    const formattedStart = formatDate(start);
    const formattedEnd = formatDate(end);

    if (!formattedStart && !formattedEnd) return null;
    if (formattedStart && !formattedEnd) return `${formattedStart} - Present`;
    if (!formattedStart && formattedEnd) return formattedEnd;
    return `${formattedStart} - ${formattedEnd}`;
  };

  const renderBulletPoints = (items?: string[]) => {
    if (!items || items.length === 0) return null;
    return items.map((item, index) => (
      <View key={index} style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletContent}>{item}</Text>
      </View>
    ));
  };

  // Filter out unwanted custom sections
  const filteredCustomSections = customSections?.filter(section => {
    const name = section.sectionName.toLowerCase();
    return !name.includes('job description') && 
           !name.includes('target role') && 
           !name.includes('qualifications') &&
           !name.includes('targetted role');
  });

  return (
    <Document title={fullName} author={fullName} subject="Resume" creator="Job AI" producer="Job AI">
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.contactInfo}>
            {address?.email && <Text>{address.email}</Text>}
            {address?.telephone && <Text>{address.telephone}</Text>}
            {address?.location && <Text>{address.location}</Text>}
            {address?.linkedInProfile && (
              <Link src={address.linkedInProfile} style={styles.link}>LinkedIn</Link>
            )}
            {address?.githubProfile && (
               <Link src={address.githubProfile} style={styles.link}>GitHub</Link>
            )}
            {address?.portfolio && (
               <Link src={address.portfolio} style={styles.link}>Portfolio</Link>
            )}
             {address?.otherLinks && address.otherLinks.map((link, i) => (
               <Link key={i} src={link} style={styles.link}>Link</Link>
            ))}
          </View>
        </View>

        {/* Profile / Summary */}
        {(profile || objective) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>
            {profile && <Text style={styles.description}>{profile}</Text>}
            {objective && <Text style={styles.description}>{objective}</Text>}
          </View>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map((exp, index) => (
              <View key={index} style={styles.itemContainer}>
                <View style={styles.row}>
                  <Text style={styles.mainText}>{exp.position}</Text>
                  <Text style={styles.dateLocation}>
                    {formatDateRange(exp.startDate, exp.endDate)}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.subText}>{exp.company}</Text>
                  <Text style={styles.dateLocation}>{exp.location}</Text>
                </View>
                {exp.description && <Text style={styles.description}>{exp.description}</Text>}
                {renderBulletPoints(exp.responsibilities)}
                {renderBulletPoints(exp.achievements)}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu, index) => (
              <View key={index} style={styles.itemContainer}>
                 <View style={styles.row}>
                  <Text style={styles.mainText}>{edu.institution}</Text>
                  <Text style={styles.dateLocation}>
                    {formatDateRange(edu.startDate, edu.endDate)}
                  </Text>
                </View>
                <View style={styles.row}>
                   <Text style={styles.subText}>{edu.degree} in {edu.fieldOfStudy}</Text>
                   <Text style={styles.dateLocation}>{edu.location}</Text>
                </View>
                {edu.grade && <Text style={styles.description}>Grade: {edu.grade}</Text>}
                {edu.description && <Text style={styles.description}>{edu.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills && Object.keys(skills).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {Object.entries(skills).map(([category, items], index) => (
              <View key={index} style={{ marginBottom: 6 }}>
                <Text style={{ ...styles.subText, fontWeight: 'bold', marginBottom: 2, textTransform: 'capitalize' }}>
                  {category}:
                </Text>
                <Text style={styles.description}>{items.join(', ')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((proj, index) => (
              <View key={index} style={styles.itemContainer}>
                <View style={styles.row}>
                  <Text style={styles.mainText}>{proj.name}</Text>
                  {proj.link && <Link src={proj.link} style={styles.link}>Link</Link>}
                </View>
                {proj.role && <Text style={{ ...styles.subText, fontStyle: 'italic' }}>{proj.role}</Text>}
                {proj.description && <Text style={styles.description}>{proj.description}</Text>}
                {proj.technologies && (
                  <Text style={{ ...styles.description, color: '#6B7280', fontSize: 9 }}>
                    Technologies: {proj.technologies.join(', ')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications.map((cert, index) => (
              <View key={index} style={styles.itemContainer}>
                <View style={styles.row}>
                  <Text style={styles.mainText}>{cert.name}</Text>
                  <Text style={styles.dateLocation}>{formatDate(cert.year)}</Text>
                </View>
                <Text style={styles.subText}>{cert.issuer}</Text>
                {cert.description && <Text style={styles.description}>{cert.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Awards */}
        {awards && awards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Awards</Text>
            {awards.map((award, index) => (
              <View key={index} style={styles.itemContainer}>
                 <View style={styles.row}>
                  <Text style={styles.mainText}>{award.title}</Text>
                  <Text style={styles.dateLocation}>{formatDate(award.year)}</Text>
                </View>
                <Text style={styles.subText}>{award.issuer}</Text>
                {award.description && <Text style={styles.description}>{award.description}</Text>}
              </View>
            ))}
          </View>
        )}
        
        {/* Publications */}
        {publications && publications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Publications</Text>
            {publications.map((pub, index) => (
              <View key={index} style={styles.itemContainer}>
                 <View style={styles.row}>
                  <Text style={styles.mainText}>{pub.title}</Text>
                  <Text style={styles.dateLocation}>{formatDate(pub.date)}</Text>
                </View>
                <Text style={styles.subText}>{pub.publisher}</Text>
                {pub.link && <Link src={pub.link} style={styles.link}>Link</Link>}
                {pub.description && <Text style={styles.description}>{pub.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Custom Sections */}
        {filteredCustomSections && filteredCustomSections.length > 0 && (
          <>
            {filteredCustomSections.map((section, index) => (
              <View key={index} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.sectionName}</Text>
                {section.entries.map((entry, entryIndex) => (
                  <View key={entryIndex} style={styles.itemContainer}>
                    <View style={styles.row}>
                      <Text style={styles.mainText}>{entry.title}</Text>
                      <Text style={styles.dateLocation}>{formatDate(entry.year)}</Text>
                    </View>
                    {entry.organization && <Text style={styles.subText}>{entry.organization}</Text>}
                    {entry.description && <Text style={styles.description}>{entry.description}</Text>}
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

      </Page>
    </Document>
  );
};

export default ResumePDF;
