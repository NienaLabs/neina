
import ResumeEditor from '@/components/resume/editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { editorButtons } from '@/constants/constant'
import { X, MoreHorizontal, Star, DownloadIcon } from 'lucide-react'
import { trpc } from '@/trpc/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import { ResumeReportSidebar } from '@/components/resume/ResumeReportSidebar'

import { ReanalyzeButton } from '@/components/resume/ReanalyzeButton'

interface Props {
    params: Promise<{ resumeId: string }>
}

interface AnalysisData {
    fixes: Record<string, any>;
    [key: string]: unknown;
}

interface ScoreData {
    overallScore?: number;
    scores?: {
        overallScore?: number;
        experienceScore?: number;
        skillsScore?: number;
    };
}

const Page = async ({ params }: Props) => {
    const { resumeId } = await params

    const resume = await trpc.resume.getUnique({ resumeId })

    if (!resume) { return notFound() }

    const { analysisData, extractedData, name } = resume
    const role = 'role' in resume && resume.role ? resume.role : 'General'
    const isTailored = 'primaryResumeId' in resume;

    // Safely access scores only if it exists (TailoredResume)
    const scores = 'scores' in resume ? resume.scores : null;

    const parsedAnalysisData = analysisData ? (typeof analysisData === 'string' ? JSON.parse(analysisData) : analysisData) as AnalysisData : { fixes: {} }
    const { fixes, ...fixCountRaw } = parsedAnalysisData
    const fixCount = fixCountRaw as Record<string, number>
    
    const score = scores ? (typeof scores === 'string' ? JSON.parse(scores) : scores) as ScoreData : null
    
    // Extract scores for tailored resumes
    const overallScore = score?.overallScore ?? 0;
    const experienceScore = score?.experienceScore ?? 0;
    const skillsScore = score?.skillsScore ?? 0;

    // Calculate total issues for primary resumes
    const totalIssues = Object.values(fixCount).reduce((acc, curr) => acc + (typeof curr === 'number' ? curr : 0), 0);

    // Determine Star Rating
    let starRating = 0;
    
    if (isTailored) {
        // Tailored: Based on Overall Score (0-100)
        // 80-100: 5, 60-79: 4, 40-59: 3, 20-39: 2, 0-19: 1
        const normalizedScore = overallScore * 100; // Assuming overallScore is 0-1
        if (normalizedScore >= 80) starRating = 5;
        else if (normalizedScore >= 60) starRating = 4;
        else if (normalizedScore >= 40) starRating = 3;
        else if (normalizedScore >= 20) starRating = 2;
        else starRating = 1;
    } else {
        // Primary: Based on Issues
        // 0-9: 5, 10-19: 4, 20-29: 3, 30-39: 2, 40+: 1
        if (totalIssues < 10) starRating = 5;
        else if (totalIssues < 20) starRating = 4;
        else if (totalIssues < 30) starRating = 3;
        else if (totalIssues < 40) starRating = 2;
        else starRating = 1;
    }



    return (
        <div className="p-4 md:p-6 flex min-h-screen flex-col flex-1 gap-6 bg-muted/40 h-full w-full font-sans ">
            {/* Header Section */}
            <div className="flex items-center justify-between w-full flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/resume">
                        <Button variant="ghost" size="icon" className="hover:bg-muted">
                            <X className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </Link>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold tracking-tight text-foreground truncate max-w-[200px] sm:max-w-md">{name}</h1>
                            <Badge variant="secondary" className="text-xs font-normal px-2 py-0.5 h-6">
                                {role}
                            </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">Last updated just now</span>
                    </div>
                </div>

                {/* Desktop Actions */}
                <div className="hidden sm:flex items-center gap-2">
                    <Link href={`/resume/preview/${resumeId}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                            <DownloadIcon className="h-4 w-4" />
                            Export PDF
                        </Button>
                    </Link>
                </div>

                {/* Mobile Actions */}
                <div className="flex items-center gap-2 sm:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {editorButtons.map((button) => (
                                button.name === 'Export' ? (
                                    <Link key={button.name} href={`/resume/preview/${resumeId}`} className="w-full">
                                        <Button variant="ghost" className="w-full justify-start gap-2">
                                            <button.icon className="h-4 w-4" />
                                            <span>{button.name}</span>
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button key={button.name} variant="ghost" className="w-full justify-start gap-2">
                                        <button.icon className="h-4 w-4" />
                                        <span>{button.name}</span>
                                    </Button>
                                )
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-background rounded-3xl border shadow-sm flex-1 flex flex-col overflow-hidden">
                
                {/* Stats / Grade Header */}
                <div className="relative overflow-hidden border-b bg-linear-to-r from-background via-muted/30 to-background p-6 md:p-8">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
                         <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                         <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
                        
                        {/* Star Rating Display */}
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-center justify-center gap-2">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star 
                                            key={star} 
                                            className={`w-8 h-8 ${star <= starRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} 
                                        />
                                    ))}
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">
                                    {isTailored ? 'Overall Quality' : 'Resume Health'}
                                </span>
                            </div>
                            
                            <div className="h-12 w-px bg-border hidden md:block" />

                            <div className="flex flex-col gap-1">
                                <h2 className="text-2xl font-bold tracking-tight">
                                    {isTailored ? 'Tailored Analysis' : 'Issue Detection'}
                                </h2>
                                <p className="text-sm text-muted-foreground max-w-[250px]">
                                    {isTailored 
                                        ? "Based on alignment with the job description." 
                                        : `${totalIssues} issues found. Fix them to improve your rating.`}
                                </p>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="flex-1 w-full md:w-auto">
                            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-1 2xl:grid-cols-3 gap-4 lg:gap-1 ">
                                {isTailored && (
                                    // Tailored Resume Stats
                                    <>      
                                        <div className="flex flex-col items-center p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                                            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 text-white shadow-sm">
                                                <span className="font-bold text-sm">{(experienceScore * 100).toFixed(0)}%</span>
                                            </div>
                                            <span className="text-xs font-medium text-muted-foreground text-center">Experience</span>
                                        </div>
                                        <div className="flex flex-col items-center p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                                            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                                                <span className="font-bold text-sm">{(skillsScore * 100).toFixed(0)}%</span>
                                            </div>
                                            <span className="text-xs font-medium text-muted-foreground text-center">Skills</span>
                                        </div>
                                        {overallScore !== undefined && (
                                            <div className="flex flex-col items-center p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                                                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                                                    <span className="font-bold text-sm">{(overallScore * 100).toFixed(0)}%</span>
                                                </div>
                                                <span className="text-xs font-medium text-muted-foreground text-center">Role Match</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 min-w-[140px]">
                            <ReanalyzeButton resumeId={resumeId} isTailored={isTailored} />
                            <ResumeReportSidebar fixes={fixes} />
                        </div>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 bg-muted/10">
                    <ResumeEditor fixes={fixes} extractedData={extractedData} resumeId={resumeId} isTailored={isTailored} />
                </div>
            </div>
        </div>
    )
}

export default Page
