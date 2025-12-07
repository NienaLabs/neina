"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCcw } from "lucide-react"
import { trpc } from "@/trpc/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ReanalyzeButtonProps {
    resumeId: string
    isTailored: boolean
}

export function ReanalyzeButton({ resumeId, isTailored }: ReanalyzeButtonProps) {
    const router = useRouter()
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    const reanalyzeMutation = trpc.resume.reanalyze.useMutation({
        onSuccess: () => {
            toast.success("Analysis started. This may take a few moments.")
            setIsAnalyzing(false)
            // Refresh the page to show updates when they arrive (though it's async)
            router.refresh()
        },
        onError: (error) => {
            toast.error(error.message || "Failed to start analysis")
            setIsAnalyzing(false)
        }
    })

    const handleReanalyze = () => {
        setIsAnalyzing(true)
        reanalyzeMutation.mutate({
            resumeId,
            isTailored
        })
    }

    return (
        <Button 
            className="w-full rounded-full shadow-md hover:shadow-lg transition-all" 
            size="lg"
            onClick={handleReanalyze}
            disabled={isAnalyzing}
        >
            <RefreshCcw className={`mr-2 h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`} />
            {isAnalyzing ? "Analyzing..." : "Re-analyze"}
        </Button>
    )
}
