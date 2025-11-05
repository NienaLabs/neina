import React from 'react'

interface Props {
    params:Promise<{resumeId: string}>
}
const Page = async ({params}:Props) => {
    const {resumeId}= await params
  return (
    <div>{resumeId}</div>
  )
}

export default Page