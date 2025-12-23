'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import  {trpc} from '@/trpc/client'

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

  
  const utils = trpc.useUtils()

  const createTailoredResumeMutation = trpc.resume.createTailored.useMutation({
    onSuccess: () => {
      utils.resume.getTailoredResumes.invalidate()
      utils.resume.getPrimaryResumes.invalidate()
      toast.success("Tailored Resume created successfully")
      onOpenChange(false)
    },
    onError:(error)=>{
      toast.error(error.message)
    }
  })

  const handleSubmit = () => {
    createTailoredResumeMutation.mutate({
      primaryResumeId,
      name,
      role,
      description,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex flex-col gap-1 max-h-[90vh]'>
        <DialogHeader  className="shrink-0">
          <DialogTitle>Create Tailored Resume</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto p-2">
          <div className="space-y-2">
            <Label htmlFor="name">Tailored Resume Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Target Role <span className="text-destructive">*</span></Label>
            <Input
              id="role"
              value={role}
              onChange={e => setRole(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Job Description <span className="text-destructive">*</span></Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={createTailoredResumeMutation.isPending}>
            {createTailoredResumeMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTailoredResumeDialog
