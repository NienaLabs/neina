'use client';
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { PersonalInfo } from '@/lib/types/resume';

/**
 * Styles for Cover Letter PDF
 */
const styles = StyleSheet.create({
  page: {
    padding: '20mm',
    fontSize: 11,
    fontFamily: 'Times-Roman',
    lineHeight: 1.5,
    color: '#000000',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  name: {
    fontSize: 18,
    fontFamily: 'Times-Bold',
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 9,
    color: '#4b5563',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  contactItem: {
    marginRight: 12,
  },
  date: {
    marginBottom: 25,
    fontSize: 10,
    color: '#4b5563',
  },
  paragraph: {
    marginBottom: 12,
    textAlign: 'justify',
  },
  signature: {
    marginTop: 25,
  },
  sincerely: {
    marginBottom: 15,
  },
  senderName: {
    fontFamily: 'Times-Bold',
  }
});

interface CoverLetterPDFProps {
  content: string;
  personalInfo?: PersonalInfo;
}

/**
 * Cover Letter PDF component
 * Renders a cover letter in PDF format for export
 */
export const CoverLetterPDF = ({ content, personalInfo }: CoverLetterPDFProps) => {
  if (!content) return null;

  // Split content by paragraphs
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
  const today = format(new Date(), 'MMMM d, yyyy');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Personal Info */}
        {personalInfo && (
          <View style={styles.header}>
            <Text style={styles.name}>{personalInfo.name || 'Candidate Name'}</Text>
            <View style={styles.contactInfo}>
              {personalInfo.email && <Text style={styles.contactItem}>{personalInfo.email}</Text>}
              {personalInfo.phone && <Text style={styles.contactItem}>{personalInfo.phone}</Text>}
              {personalInfo.location && <Text style={styles.contactItem}>{personalInfo.location}</Text>}
              {personalInfo.linkedin && <Text style={styles.contactItem}>{personalInfo.linkedin}</Text>}
            </View>
          </View>
        )}

        {/* Date */}
        <View style={styles.date}>
          <Text>{today}</Text>
        </View>

        {/* Body */}
        {paragraphs.map((paragraph, index) => (
          <View key={index} style={styles.paragraph}>
            <Text>{paragraph.trim()}</Text>
          </View>
        ))}
        
        {personalInfo?.name && (
          <View style={styles.signature}>
            <Text style={styles.sincerely}>Sincerely,</Text>
            <Text style={styles.senderName}>{personalInfo.name}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};
