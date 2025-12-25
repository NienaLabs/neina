import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Blog - Niena",
    description: "Stay ahead in your career with expert advice, developer insights, and the latest from the Niena team. Read articles about job search, career development, and AI-powered tools.",
    keywords: ["niena", "blog", "career advice", "job search", "interview tips", "resume tips", "ai tools", "developer insights"],
    authors: [{ name: "Niena Labs" }],
    creator: "Niena Labs",
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://app.nienalabs.com/blog",
        title: "Blog - Niena",
        description: "Stay ahead in your career with expert advice, developer insights, and the latest from the Niena team.",
        siteName: "Niena",
        images: [
            {
                url: "/og-image.jpg",
                width: 1200,
                height: 630,
                alt: "Niena Blog - Career Insights & Updates",
            }
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Blog - Niena",
        description: "Stay ahead in your career with expert advice, developer insights, and the latest from the Niena team.",
        creator: "@nienalabs",
        images: ["/og-image.jpg"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
