'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { trpc } from '@/trpc/client'
import { Sparkles, Briefcase, FileText, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const CreateTailoredResumeDialog = ({
  primaryResumeId,
  open,
  onOpenChange,
}: {
  primaryResumeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [description, setDescription] = useState('')
  const [tailoringMode, setTailoringMode] = useState<"nudge" | "keywords" | "full">("keywords")

  const utils = trpc.useUtils()

  const createTailoredResumeMutation = trpc.resume.createTailored.useMutation({
    onSuccess: () => {
      utils.resume.getTailoredResumes.invalidate()
      utils.resume.getPrimaryResumes.invalidate()
      toast.success("Tailored Resume created successfully")
      onOpenChange(false)
      // Reset form
      setName('')
      setRole('')
      setDescription('')
      setTailoringMode("keywords")
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  const handleSubmit = () => {
    if (!name || !role || !description) {
        toast.error("Please fill in all fields")
        return
    }
    createTailoredResumeMutation.mutate({
      primaryResumeId,
      name,
      role,
      description,
      tailoringMode
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-col items-center gap-2 pb-2 border-b border-border/50 shrink-0">
          <div className="p-3 bg-primary/10 rounded-full mb-2 ring-1 ring-primary/20">
            <Wand2 className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Create Tailored Resume
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground/80 max-w-sm">
            Paste the job description below to generate a resume specifically optimized for this role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4 overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Resume Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Google PM Application"
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-muted/50 focus:bg-background transition-colors"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                Target Role
              </Label>
              <Input
                id="role"
                placeholder="e.g. Senior Product Manager"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="bg-muted/50 focus:bg-background transition-colors"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-500" />
                Tailoring Intensity
            </Label>
            <div className="grid grid-cols-3 gap-3">
                <div 
                    onClick={() => setTailoringMode("nudge")}
                    className={cn(
                        "cursor-pointer rounded-lg border p-3 flex flex-col items-center justify-center gap-2 transition-all hover:bg-muted/50",
                        tailoringMode === "nudge" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/50 bg-background"
                    )}
                >
                    <span className="text-sm font-semibold">Nudge</span>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">Minimal changes, authentic tone.</span>
                </div>
                <div 
                    onClick={() => setTailoringMode("keywords")}
                    className={cn(
                        "cursor-pointer rounded-lg border p-3 flex flex-col items-center justify-center gap-2 transition-all hover:bg-muted/50",
                        tailoringMode === "keywords" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/50 bg-background"
                    )}
                >
                    <span className="text-sm font-semibold">Keywords</span>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">Injects key skills & terms.</span>
                </div>
                <div 
                    onClick={() => setTailoringMode("full")}
                    className={cn(
                        "cursor-pointer rounded-lg border p-3 flex flex-col items-center justify-center gap-2 transition-all hover:bg-muted/50",
                        tailoringMode === "full" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/50 bg-background"
                    )}
                >
                    <span className="text-sm font-semibold">Full Rewrite</span>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">Aggressive optimization for ATS.</span>
                </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500/70" />
                Job Description
            </Label>
            <div className="relative">
                <Textarea
                    id="description"
                    placeholder="Paste the full job description here..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className={cn(
                        "resize-none min-h-[200px] bg-muted/30 focus:bg-background transition-colors font-mono text-sm leading-relaxed p-4",
                        "scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent"
                    )}
                />
                <div className="absolute bottom-3 right-3 text-xs text-muted-foreground pointer-events-none">
                    {description.length > 0 ? `${description.split(/\s+/).filter(Boolean).length} words` : ''}
                </div>
            </div>
            <p className="text-xs text-muted-foreground pl-1">
                We'll analyze this description to highlight relevant skills and experience.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-2 shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
                Cancel
            </Button>
            <Button 
                onClick={handleSubmit} 
                disabled={createTailoredResumeMutation.isPending}
                className="w-full sm:w-auto bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg shadow-primary/20"
            >
                {createTailoredResumeMutation.isPending ? (
                    <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                    </>
                ) : (
                    <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Tailored Resume
                    </>
                )}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTailoredResumeDialog
