"use client";

import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/fileInput";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/results");
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[18px] row-start-2 items-center sm:items-start">
        <FileInput />
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          onClick={handleClick}
        >
          View Existing Data
        </Button>
      </main>
    </div>
  );
}
