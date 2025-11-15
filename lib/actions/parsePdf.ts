"use-client"
export const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // PDF file validation
    if (file.type !== "application/pdf") {
      console.log("Please select a PDF file!..");
      return;
    }  
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("An error occurred while processing the PDF");
      }

      const data = await response.json();
      console.log(data.text);
      return data
    } catch (err) {
      console.log(err instanceof Error ? err.message : "An error occurred");
    }
  };
