
import ResumeEditor from '@/components/resume/editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { editorButtons } from '@/constants/constant'
import { X,Star,BadgeAlert, Clover, RefreshCcw } from 'lucide-react'
import {analysisData} from '@/constants/constant'


interface Props {
    params:Promise<{resumeId: string}>
}




const Page = async ({params}:Props) => {
    const {resumeId}= await params
    const {fixes,...fixCount}=analysisData
  return (
   <div className="p-5 flex min-h-screen flex-col flex-1 gap-5 bg-muted h-full w-full">
        <div className="flex flex-row items-center w-full">
          <div className="flex flex-row items-center gap-2">
             <Button variant="outline">
               <X/>
             </Button>
             <Badge variant="outline">
              <Star/> 
              Williams Adusei CV <span className="text-foreground border bg-muted-foreground p-1 rounded-full">Full stack enginner</span> 
             </Badge>
          </div>
          <div className="flex flex-row ml-auto gap-1 items-center">
            {editorButtons.map((button)=>(
              <Button key={button.name} variant="outline" className="flex-row flex gap-1">
                 <button.icon/>
                 <span>{button.name}</span>    
              </Button>
            ))}
          </div>
        </div>
        <div className="bg-background rounded-3xl border flex-1">
         <div className="border-b relative items-center p-2 gap-2 flex flex-row">
          <div className="grid grid-cols-1 relative grid-rows-1">
            <div className="border-4 border-gray-100 dark:border-gray-700 size-20 rounded-full" />
            <div className="border-4 absolute z-2 border-amber-500 mask-conic-from-70% size-20 mask-conic-to-70% rounded-full dark:border-amber-400" />
            <div className="absolute z-3 size-20 rounded-full items-center flex justify-center">
              <h1 className="font-bold text-3xl">B</h1>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h1>Resume strength: 70%</h1>
            <Badge>
              Fairly good
              <Clover/>
            </Badge>
          </div>
          <div className="grid ml-auto gap-1 grid-cols-1 sm:grid-cols-3 md:grid-cols-4">
            {Object.keys(fixCount).map((key,index)=>(
              <Badge variant="destructive" className="" key={index}>
               {fixCount[key]}   {key.replace("Fixes","")+" fixe(s)".toLowerCase()}
                <BadgeAlert/>
              </Badge>              
            ))}
          </div>
          <Button className="absolute flex-row flex items-center gap-1 z-5 bottom-0 right-5">
          <span>Re-analyze</span>
          <RefreshCcw/>
          </Button>
        </div>
        <ResumeEditor fixes={fixes}/>
        </div>
   </div>
  )
}

export default Page