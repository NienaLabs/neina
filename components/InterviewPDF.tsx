import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Circle } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    // Purple gradient hero
    hero: {
        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        backgroundColor: '#7c3aed',
        padding: '35 45',
        marginBottom: 0,
    },
    heroContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    heroLeft: {
        flex: 1,
    },
    brandTag: {
        fontSize: 8,
        color: '#e9d5ff',
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 10,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 6,
    },
    heroSubtitle: {
        fontSize: 11,
        color: '#e9d5ff',
        marginTop: 4,
    },
    // Score circle
    scoreCircle: {
        width: 120,
        height: 120,
        position: 'relative',
    },
    scoreCircleInner: {
        position: 'absolute',
        top: 35,
        left: 35,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    scoreLabel: {
        fontSize: 7,
        color: '#e9d5ff',
    },
    // Content
    content: {
        padding: '35 45',
    },
    // Performance badge
    performanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: '8 14',
        backgroundColor: '#f3e8ff',
        borderRadius: 16,
        alignSelf: 'flex-start',
        marginBottom: 25,
    },
    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#7c3aed',
    },
    // Stats cards
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 30,
    },
    statCard: {
        flex: 1,
        padding: 16,
        backgroundColor: '#faf5ff',
        borderRadius: 10,
        borderLeft: '3 solid #a855f7',
    },
    statLabel: {
        fontSize: 8,
        color: '#6b7280',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 'bold',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    statUnit: {
        fontSize: 9,
        color: '#9ca3af',
        marginTop: 2,
    },
    // Sections
    sectionHeader: {
        marginBottom: 16,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 9,
        color: '#6b7280',
    },
    // Feedback cards
    feedbackCard: {
        backgroundColor: '#ffffff',
        border: '1 solid #e5e7eb',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
    },
    feedbackTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 10,
    },
    // Bullets
    bulletList: {
        marginTop: 6,
    },
    bulletItem: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    bulletIcon: {
        width: 14,
        height: 14,
        backgroundColor: '#f3e8ff',
        borderRadius: 7,
        marginRight: 8,
        marginTop: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bulletCheck: {
        fontSize: 8,
        color: '#7c3aed',
        fontWeight: 'bold',
    },
    bulletText: {
        fontSize: 9.5,
        lineHeight: 1.5,
        color: '#4b5563',
        flex: 1,
    },
    // Transcript
    transcriptContainer: {
        marginTop: 8,
    },
    messageWrapper: {
        marginBottom: 12,
    },
    messageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    messageAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    messageName: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#374151',
    },
    messageBubble: {
        padding: 12,
        borderRadius: 10,
        marginLeft: 26,
    },
    userBubble: {
        backgroundColor: '#f3e8ff',
    },
    interviewerBubble: {
        backgroundColor: '#f9fafb',
    },
    messageText: {
        fontSize: 9,
        lineHeight: 1.6,
        color: '#374151',
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16 45',
        backgroundColor: '#faf5ff',
        borderTop: '1 solid #e5e7eb',
    },
    footerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerBrand: {
        fontSize: 8,
        color: '#7c3aed',
        fontWeight: 'bold',
    },
    footerText: {
        fontSize: 7,
        color: '#9ca3af',
        marginTop: 1,
    },
    pageNum: {
        fontSize: 7,
        color: '#d1d5db',
    },
});

interface InterviewPDFProps {
    result: {
        role: string;
        analysisScore: number;
        analysisFeedback: string;
        transcript: { role: string; content: string }[];
        analyzedAt: string;
        start_time: string;
        duration_seconds: number;
    };
}

export const InterviewPDF: React.FC<InterviewPDFProps> = ({ result }) => {
    const scoreGrade = result.analysisScore >= 90 ? 'Excellent Performance' :
        result.analysisScore >= 70 ? 'Good Performance' :
            result.analysisScore >= 50 ? 'Fair Performance' : 'Needs Improvement';

    const scoreColor = result.analysisScore >= 70 ? '#10b981' :
        result.analysisScore >= 50 ? '#f59e0b' : '#ef4444';

    const badgeColor = result.analysisScore >= 70 ? '#10b981' :
        result.analysisScore >= 50 ? '#f59e0b' : '#ef4444';

    // Parse feedback
    const feedbackLines = result.analysisFeedback.split('\n').filter(line => line.trim());
    const sections: { title: string; items: string[] }[] = [];
    let currentSection: { title: string; items: string[] } | null = null;

    feedbackLines.forEach(line => {
        if (line.startsWith('###')) {
            if (currentSection) sections.push(currentSection);
            currentSection = { title: line.replace('###', '').trim(), items: [] };
        } else if ((line.startsWith('•') || line.startsWith('-')) && currentSection) {
            currentSection.items.push(line.substring(1).trim());
        }
    });
    if (currentSection) sections.push(currentSection);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Purple Gradient Hero */}
                <View style={styles.hero}>
                    <View style={styles.heroContent}>
                        <View style={styles.heroLeft}>
                            <Text style={styles.brandTag}>NIENA ANALYTICS</Text>
                            <Text style={styles.heroTitle}>Interview Report</Text>
                            <Text style={styles.heroSubtitle}>{result.role}</Text>
                            <Text style={styles.heroSubtitle}>
                                {new Date(result.analyzedAt).toLocaleDateString('en-US', {
                                    month: 'long', day: 'numeric', year: 'numeric'
                                })}
                            </Text>
                        </View>
                        <View style={styles.scoreCircle}>
                            <Svg width="120" height="120">
                                <Circle cx="60" cy="60" r="55" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
                                <Circle
                                    cx="60"
                                    cy="60"
                                    r="55"
                                    stroke="#ffffff"
                                    strokeWidth="6"
                                    fill="none"
                                    strokeDasharray={`${Math.max(0.01, 2 * Math.PI * 55 * (result.analysisScore / 100)).toFixed(2)} ${(2 * Math.PI * 55).toFixed(2)}`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 60 60)"
                                />
                            </Svg>
                            <View style={styles.scoreCircleInner}>
                                <Text style={styles.scoreNumber}>{result.analysisScore}</Text>
                                <Text style={styles.scoreLabel}>/ 100</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Badge */}
                    <View style={styles.performanceBadge}>
                        <View style={[styles.badgeDot, { backgroundColor: badgeColor }]} />
                        <Text style={styles.badgeText}>{scoreGrade}</Text>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Duration</Text>
                            <Text style={styles.statValue}>{Math.floor(result.duration_seconds / 60)}</Text>
                            <Text style={styles.statUnit}>minutes</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Questions</Text>
                            <Text style={styles.statValue}>{Math.floor(result.transcript.length / 2)}</Text>
                            <Text style={styles.statUnit}>answered</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Score</Text>
                            <Text style={[styles.statValue, { color: scoreColor }]}>{result.analysisScore}</Text>
                            <Text style={styles.statUnit}>out of 100</Text>
                        </View>
                    </View>

                    {/* Analysis */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Performance Analysis</Text>
                        <Text style={styles.sectionSubtitle}>AI-powered insights and recommendations</Text>
                    </View>

                    {sections.map((section, idx) => (
                        <View key={idx} style={styles.feedbackCard}>
                            <Text style={styles.feedbackTitle}>{section.title}</Text>
                            <View style={styles.bulletList}>
                                {section.items.map((item, i) => (
                                    <View key={i} style={styles.bulletItem}>
                                        <View style={styles.bulletIcon}>
                                            <Text style={styles.bulletCheck}>✓</Text>
                                        </View>
                                        <Text style={styles.bulletText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerContent}>
                        <View>
                            <Text style={styles.footerBrand}>NIENA</Text>
                            <Text style={styles.footerText}>Confidential Report</Text>
                        </View>
                        <Text style={styles.pageNum}>Page 1 of 2</Text>
                    </View>
                </View>
            </Page>

            {/* Transcript Page */}
            <Page size="A4" style={styles.page}>
                <View style={styles.content}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Conversation Transcript</Text>
                        <Text style={styles.sectionSubtitle}>Complete interview dialogue</Text>
                    </View>

                    <View style={styles.transcriptContainer}>
                        {result.transcript.map((msg, idx) => (
                            <View key={idx} style={styles.messageWrapper}>
                                <View style={styles.messageHeader}>
                                    <View style={[
                                        styles.messageAvatar,
                                        { backgroundColor: msg.role === 'user' ? '#7c3aed' : '#6b7280' }
                                    ]}>
                                        <Text style={styles.avatarText}>
                                            {msg.role === 'user' ? 'C' : 'AI'}
                                        </Text>
                                    </View>
                                    <Text style={styles.messageName}>
                                        {msg.role === 'user' ? 'Candidate' : 'AI Interviewer'}
                                    </Text>
                                </View>
                                <View style={[
                                    styles.messageBubble,
                                    msg.role === 'user' ? styles.userBubble : styles.interviewerBubble
                                ]}>
                                    <Text style={styles.messageText}>{msg.content}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.footer}>
                    <View style={styles.footerContent}>
                        <View>
                            <Text style={styles.footerBrand}>NIENA</Text>
                            <Text style={styles.footerText}>Confidential Report</Text>
                        </View>
                        <Text style={styles.pageNum}>Page 2 of 2</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
