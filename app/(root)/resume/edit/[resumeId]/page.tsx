import ResumeEditor from '@/components/resume/editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { editorButtons } from '@/constants/constant'
import { X,Star,BadgeAlert, Clover, RefreshCcw, MoreHorizontal } from 'lucide-react'
import { trpc } from '@/trpc/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'


interface Props {
    params:Promise<{resumeId: string}>
}




const Page = async ({params}:Props) => {
    const {resumeId}= await params

    
    const resume = await trpc.resume.getUnique({resumeId})
    
    if(!resume) {return notFound}
   
    
    const {analysisData,scoreData,extractedData,name} = resume
    const role = 'role' in resume ? resume.role : 'General'

    const parsedAnalysisData = analysisData ? (typeof analysisData === 'string' ? JSON.parse(analysisData) : analysisData) : {fixes: {}}
    const {fixes,...fixCount} = parsedAnalysisData
    const score = scoreData ? (typeof scoreData === 'string' ? JSON.parse(scoreData) : scoreData) : {scores: {}, roleMatch: {}}

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
         <div className="border-b p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-center">
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-1 relative grid-rows-1">
              <div className="border-4 border-gray-100 dark:border-gray-700 size-20 rounded-full" />
              <div 
               style={{'--value': (score?.roleMatch?.matchPercentage || 0) + "%"} as React.CSSProperties}
              className="border-4 absolute z-2 border-amber-500 size-20 rounded-full dark:border-amber-400" />
              <div className="absolute z-3 size-20 rounded-full items-center flex justify-center">
                <h1 className="font-bold text-3xl">{(score?.scores?.overallScore || 0).toFixed(1)}</h1>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-center md:items-start">
            <h1>Resume strength: {score?.roleMatch?.matchPercentage || 0}%</h1>
            <Badge>
              {(score?.roleMatch?.matchPercentage || 0) > 80 ? "Excellent" : (score?.roleMatch?.matchPercentage || 0) > 60 ? "Good" : "Fair"}
              <Clover/>
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:col-span-2 lg:col-span-1">
            {Object.keys(fixCount).map((key,index)=>(
              <Badge variant="destructive" className="" key={index}>
               {fixCount[key]}   {key.replace("Fixes","")+" fixe(s)".toLowerCase()}
                <BadgeAlert/>
              </Badge>              
            ))}
          </div>
          <div className="flex justify-center md:justify-end">
            <Button className="flex items-center gap-1">
            <span>Re-analyze</span>
            <RefreshCcw/>
            </Button>
          </div>
        </div>
        <ResumeEditor fixes={fixes} extractedData={extractedData}/>
        </div>
   </div>
  )
}

export default Page