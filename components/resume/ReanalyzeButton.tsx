"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCcw } from "lucide-react"
import { trpc } from "@/trpc/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useResumeControl } from "./ResumeControlContext"

interface ReanalyzeButtonProps {
    resumeId: string
    isTailored: boolean
}

export function ReanalyzeButton({ resumeId, isTailored }: ReanalyzeButtonProps) {
    const router = useRouter()
    const { setIsProcessing } = useResumeControl()
    
    // Local state just for the button spinner distinct from the global overlay
    const [isStarting, setIsStarting] = useState(false)

    const utils = trpc.useUtils()
    const reanalyzeMutation = trpc.resume.reanalyze.useMutation({
        onSuccess: async () => {
            toast.success("Analysis started. This may take a few moments.")
            // Invalidate to start polling found in ResumeStatusWrapper
            await utils.resume.getUnique.invalidate({ resumeId }) 
            
            setIsStarting(false)
            router.refresh()
        },
        onError: (error) => {
            toast.error(error.message || "Failed to start analysis")
            setIsStarting(false)
            setIsProcessing(false) // Reset global overlay on error
        }
    })

    const handleReanalyze = () => {
        setIsStarting(true)
        setIsProcessing(true) // <--- INSTANT OVERLAY
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
            disabled={isStarting}
        >
            <RefreshCcw className={`mr-2 h-4 w-4 ${isStarting ? "animate-spin" : ""}`} />
            {isStarting ? "Starting..." : "Re-analyze"}
        </Button>
    )
}
