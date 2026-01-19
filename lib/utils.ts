import { AgentResult, TextMessage } from "@inngest/agent-kit"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ResumeExtraction } from '@/components/resume/editor/types';
import React from 'react';
import { jsonrepair } from 'jsonrepair';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function lastAssistantTextMessageContent(result: AgentResult): string | undefined {
  const lastAssistantTextMessageIndex = result.output.findLastIndex(
    (message) => message.role === "assistant"
  )
  
  if (lastAssistantTextMessageIndex === -1) {
    return undefined
  }
  
  const message = result.output[lastAssistantTextMessageIndex] as TextMessage | undefined
  
  if (!message?.content) {
    return undefined
  }
  
  if (typeof message.content === "string") {
    return message.content
  }
  
  // Handle array content type
  return message.content.map((c) => c.text).join("")
}

// --- Resume Editor Helpers ---

export const handleFieldChange = (
  section: keyof ResumeExtraction,
  value: unknown,
  setEditorState: React.Dispatch<React.SetStateAction<ResumeExtraction | null>>,
  setSave: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setEditorState((prev) => ({ ...prev!, [section]: value }));
  setSave(true);
};

export const handleNestedFieldChange = (
  section: keyof ResumeExtraction,
  index: number,
  key: string,
  value: unknown,
  setEditorState: React.Dispatch<React.SetStateAction<ResumeExtraction | null>>,
  setSave: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setEditorState((prev) => {
    const updated = [...(prev![section] as any[])];
    updated[index] = { ...updated[index], [key]: value };
    return { ...prev, [section]: updated };
  });
  setSave(true);
};

export const handleArrayAdd = (
  section: keyof ResumeExtraction,
  newItem: unknown,
  setEditorState: React.Dispatch<React.SetStateAction<ResumeExtraction | null>>,
  setSave: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setEditorState((prev) => ({
    ...prev!,
    [section]: [...((prev![section] as any[]) || []), newItem],
  }));
  setSave(true);
};

export const handleArrayDelete = (
  section: keyof ResumeExtraction,
  index: number,
  setEditorState: React.Dispatch<React.SetStateAction<ResumeExtraction | null>>,
  setSave: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setEditorState((prev) => {
    const updated = [...(prev![section] as any[])];
    updated.splice(index, 1);
    return { ...prev, [section]: updated };
  });
  setSave(true);
};

export const handleAddressChange = (
  key: keyof NonNullable<ResumeExtraction['address']>,
  value: string,
  setEditorState: React.Dispatch<React.SetStateAction<ResumeExtraction | null>>,
  setSave: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setEditorState((prev) => ({
    ...prev!,
    address: { ...prev!.address, [key]: value },
  }));
  setSave(true);
};

export const handleOtherLinksChange = (
  index: number,
  value: string,
  setEditorState: React.Dispatch<React.SetStateAction<ResumeExtraction | null>>,
  setSave: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setEditorState((prev) => {
    const updatedLinks = [...(prev!.address!.otherLinks || [])];
    updatedLinks[index] = value;
    return { ...prev, address: { ...prev!.address, otherLinks: updatedLinks } };
  });
  setSave(true);
};

export const addNewOtherLink = (
  setEditorState: React.Dispatch<React.SetStateAction<ResumeExtraction | null>>,
  setSave: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setEditorState((prev) => ({
    ...prev!,
    address: {
      ...prev!.address,
      otherLinks: [...(prev!.address!.otherLinks || []), ''],
    },
  }));
  setSave(true);
};

export const handleSkillArrayChange = (
  type: keyof NonNullable<ResumeExtraction['skills']>,
  index: number,
  value: string,
  setEditorState: React.Dispatch<React.SetStateAction<ResumeExtraction | null>>,
  setSave: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setEditorState((prev) => {
    const updatedSkills = { ...prev!.skills };
    const arr = [...(updatedSkills[type] || [])];
    arr[index] = value;
    updatedSkills[type] = arr;
    return { ...prev, skills: updatedSkills };
  });
  setSave(true);
};



export const addSkill = (

  type: keyof NonNullable<ResumeExtraction['skills']>,

  setEditorState: React.Dispatch<React.SetStateAction<ResumeExtraction | null>>,

  setSave: React.Dispatch<React.SetStateAction<boolean>>

) => {

  setEditorState((prev) => {

    const updatedSkills = { ...prev!.skills };

    updatedSkills[type] = [...(updatedSkills[type] || []), ''];

    return { ...prev, skills: updatedSkills };

  });

  setSave(true);

};

export const removeSkill = (
  type: keyof NonNullable<ResumeExtraction['skills']>,
  index: number,
  setEditorState: React.Dispatch<React.SetStateAction<ResumeExtraction | null>>,
  setSave: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setEditorState((prev) => {
    const updatedSkills = { ...prev!.skills };
    const arr = [...(updatedSkills[type] || [])];
    arr.splice(index, 1);
    updatedSkills[type] = arr;
    return { ...prev, skills: updatedSkills };
  });
  setSave(true);
};

export const handleCustomFieldChange = (
  section: keyof ResumeExtraction,
  index: number,
  fieldIndex: number,
  key: string,
  value: string,
  setEditorState: React.Dispatch<React.SetStateAction<ResumeExtraction | null>>,
  setSave: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setEditorState((prev) => {
    const updatedSection = [...(prev![section] as any[])];
    const updatedItem = { ...updatedSection[index] };
    const updatedCustomFields = [...(updatedItem.customFields || [])];
    
    if (key === 'key') {
      updatedCustomFields[fieldIndex] = { ...updatedCustomFields[fieldIndex], key: value };
    } else {
      updatedCustomFields[fieldIndex] = { ...updatedCustomFields[fieldIndex], value: value };
    }
    
    updatedItem.customFields = updatedCustomFields;
    updatedSection[index] = updatedItem;
    
    return { ...prev, [section]: updatedSection };
  });
  setSave(true);
};

export const addCustomField = (
  section: keyof ResumeExtraction,
  index: number,
  setEditorState: React.Dispatch<React.SetStateAction<ResumeExtraction | null>>,
  setSave: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setEditorState((prev) => {
    const updatedSection = [...(prev![section] as any[])];
    const updatedItem = { ...updatedSection[index] };
    const updatedCustomFields = [...(updatedItem.customFields || []), { key: '', value: '' }];
    
    updatedItem.customFields = updatedCustomFields;
    updatedSection[index] = updatedItem;
    
    return { ...prev, [section]: updatedSection };
  });
  setSave(true);
};

export const removeCustomField = (
  section: keyof ResumeExtraction,
  index: number,
  fieldIndex: number,
  setEditorState: React.Dispatch<React.SetStateAction<ResumeExtraction | null>>,
  setSave: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setEditorState((prev) => {
    const updatedSection = [...(prev![section] as any[])];
    const updatedItem = { ...updatedSection[index] };
    const updatedCustomFields = [...(updatedItem.customFields || [])];
    
    updatedCustomFields.splice(fieldIndex, 1);
    
    updatedItem.customFields = updatedCustomFields;
    updatedSection[index] = updatedItem;
    
    return { ...prev, [section]: updatedSection };
  });
  setSave(true);
};



export function cosineSimilarity(vecA: number[], vecB: number[]): number {



  if (vecA.length !== vecB.length) {



    throw new Error("Vectors must be of the same length");



  }







  let dotProduct = 0;



  let magnitudeA = 0;



  let magnitudeB = 0;







  for (let i = 0; i < vecA.length; i++) {



    dotProduct += vecA[i] * vecB[i];



    magnitudeA += vecA[i] * vecA[i];



    magnitudeB += vecB[i] * vecB[i];



  }







  magnitudeA = Math.sqrt(magnitudeA);



  magnitudeB = Math.sqrt(magnitudeB);







  if (magnitudeA === 0 || magnitudeB === 0) {



    return 0;



  }







  return dotProduct / (magnitudeA * magnitudeB);



}







export function parseVectorString(vectorStr: string | null | undefined): number[] {



  if (!vectorStr) {



    return [];



  }



  try {


    console.log(JSON.parse(vectorStr));
    return JSON.parse(vectorStr);



  } catch (e) {



    console.error("Failed to parse vector string:", e);



    return [];



  }



}




export function validJson(jsonString: string) {
  try {
    return JSON.parse(jsonString);
  } catch {
    try {
      const repaired = jsonrepair(jsonString);
      return JSON.parse(repaired);
    } catch (repairError) {
      console.error("Failed to repair JSON:", repairError);
      return null;
    }
  }
}

export function decodeStreamMessage(stream: Uint8Array) {
  const decoder = new TextDecoder();
  return decoder.decode(stream);
}