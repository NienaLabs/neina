'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { trpc } from '@/trpc/client'
import { SquarePen } from 'lucide-react'
import { toast } from 'sonner'

const CreateResumeDialog = () => {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  
  const utils = trpc.useUtils()
  
  const createResumeMutation = trpc.resume.create.useMutation({
    onSuccess: () => {
       utils.resume.getPrimaryResumes.invalidate()
      toast.success("Resume created successfully")
      setOpen(false)
    },
    onError:(error)=>{
      toast.error(error.message)
    }
  })

  const handleSubmit = () => {
    createResumeMutation.mutate({
      name,
      content
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="animate-fade-in-down animation-delay-400">
          <SquarePen className="mr-2 h-4 w-4" />
          Create New Resume
        </Button>
      </DialogTrigger>
      <DialogContent className='flex flex-col gap-1 max-h-[90vh]'>
        <DialogHeader className="shrink-0">
          <DialogTitle><h1>Create New Resume</h1></DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto p-2">
          <div className='space-y-2'>
            <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor="content">Content <span className="text-destructive">*</span></Label>
            <Textarea
              id="content"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={createResumeMutation.isPending}>
            {createResumeMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreateResumeDialog
