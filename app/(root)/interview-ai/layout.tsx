import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'AI Interview Practice',
    description: 'Practice real-time job interviews with our AI coach.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
