"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function FileInput() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Upload successful:", result);
      } else {
        console.error("Upload failed:", response);
      }
    } catch (error) {
      console.error("Error during upload:", error);
    }
  };
  return (
    <div className="grid w-full max-w-sm items-center gap-3">
      <Label htmlFor="file">Upload CSV (the messier the better)</Label>
      <Input id="file" onChange={handleFileChange} accept=".csv" type="file" />
      <Button onClick={handleUpload} disabled={!selectedFile}>
        Upload
      </Button>
    </div>
  );
}
