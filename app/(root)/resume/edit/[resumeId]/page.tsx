import ResumeEditor from '@/components/resume/editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { editorButtons } from '@/constants/constant'
import { X,Star, Clover, RefreshCcw, MoreHorizontal } from 'lucide-react'
import { trpc } from '@/trpc/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Image from 'next/image'

interface Props {
    params:Promise<{resumeId: string}>
}




const Page = async ({params}:Props) => {
    const {resumeId}= await params

    
    const resume = await trpc.resume.getUnique({resumeId})
    
    if(!resume) {return notFound}
   
    
    const {analysisData,scoreData,extractedData,name} = resume
    const role = 'role' in resume ? resume.role : 'General'
    const isTailored = 'primaryResumeId' in resume;

    const parsedAnalysisData = analysisData ? (typeof analysisData === 'string' ? JSON.parse(analysisData) : analysisData) : {fixes: {}}
    const {fixes,...fixCount} = parsedAnalysisData
    const score = scoreData ? (typeof scoreData === 'string' ? JSON.parse(scoreData) : scoreData) : null
    
    const overallScore = score?.overallScore ?? score?.scores?.overallScore ?? 0;
    const roleMatchPercentage = score?.roleMatch?.matchPercentage;

const gradients = [
   "bg-gradient-to-br from-rose-300 to-rose-600",
  "bg-gradient-to-br from-blue-300 to-blue-600",
  "bg-gradient-to-br from-green-300 to-green-600", 
  "bg-gradient-to-br from-amber-300 to-amber-600",
]

  return (
   <div className="p-5 flex min-h-screen flex-col flex-1 gap-5 bg-muted h-full w-full">
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <div className="flex items-center gap-2">
             <Link href="/dashboard">
               <Button variant="outline" size="icon">
                 <X className="h-4 w-4"/>
               </Button>
             </Link>
             <Badge variant="outline" className="flex items-center gap-1 pr-3">
              <Star className="h-3 w-3"/> 
              <span className="truncate max-w-[150px] sm:max-w-none">{name}</span> <span className="text-foreground border bg-muted-foreground p-1 rounded-full text-xs">{role}</span> 
             </Badge>
          </div>
          <div className="flex items-center gap-1 sm:hidden"> {/* Mobile: Dropdown for editor buttons */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {editorButtons.map((button)=>(
              <Button key={button.name} variant="outline" className="flex-row flex gap-1">
                 <button.icon/>
                 <span>{button.name}</span>    
              </Button>
              
            ))}
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="bg-background rounded-3xl border flex-1">
         <div className="border-b bg-linear-to-r from-transparent via-purple-200 to-transparent p-4 flex-col flex md:flex-row flex-wrap gap-4 items-center">
         <div className="relative flex items-center justify-center w-40 h-40">
  {/* Laurel */}
           <Image
           src="/laurel.svg"
           width={160}
           height={160}
           alt="laurel"
           className="absolute inset-0 w-full h-full object-contain"
           />

  {/* Shield / Score container */}
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
    <div className="w-24 h-24 bg-background border rounded-bl-full rounded-br-full
     rounded-tl-lg rounded-tr-lg flex items-center
      bg-radial-[at_25%_25%] from-white inset-shadow-white 
      to-zinc-900 to-75% justify-center shadow-md inset-shadow-sm/40">
      <h1 className="font-bold text-3xl">
        {(overallScore * 100).toFixed(1)}
      </h1>
    </div>
  </div>
</div>

          <div className="flex flex-col gap-2 items-center md:items-start">
            {roleMatchPercentage && <h1>Role Match:{roleMatchPercentage}%</h1>}
            <Badge>
              {(roleMatchPercentage || 0) > 80 ? "Excellent" : (roleMatchPercentage || 0) > 60 ? "Good" : "Fair"}
              <Clover/>
            </Badge>
            <Button variant="outline" className="rounded-full">
               <h2 className="text-xs">view full report</h2>
            </Button>
          </div>
          <div className="flex justify-center md:ml-auto  items-center flex-col gap-6">
          <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:col-span-2">
            {Object.keys(fixCount).map((key,index)=>(
              <div key={index} className="flex flex-col items-center gap-1 justify-center">
              <div   className={`size-10 rounded-full border-2 flex items-center justify-center ${gradients[index % gradients.length]} text-white shadow-md`}>
               {fixCount[key]}  
              </div>  
              <h2 className="text-xs  text-center">{key.replace("Fixes","")+" fix(es)".toLowerCase()}</h2>            
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-auto">
            <Button className="flex items-center gap-1">
            <span>Re-analyze</span>
            <RefreshCcw/>
            </Button>
          </div>
          </div>
        </div>
        <ResumeEditor fixes={fixes} extractedData={extractedData} resumeId={resumeId} isTailored={isTailored}/>
        </div>
   </div>
  )
}

export default Page