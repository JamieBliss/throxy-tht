import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm } from "formidable";
import fs from "fs";
import { SupabaseClient, createClient } from "@supabase/supabase-js";
import Papa from "papaparse";

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_KEY environment variables");
}
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

type ResponseData = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === "POST") {
    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing form", err);
        return res
          .status(500)
          .json({ message: "Error parsing form - File upload failed" });
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileContent = fs.readFileSync(file.filepath, "utf-8");
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transform: (value: any) => (value === "" ? null : value),
      });

      if (parseResult.errors.length) {
        console.error("CSV Parse Errors:", parseResult.errors);
        return res
          .status(400)
          .json({ message: "Failed to parse the CSV file." });
      }

      const fileData = parseResult.data as any[];

      if (fileData.length === 0) {
        return res
          .status(400)
          .json({ message: "CSV file is empty or contains no data." });
      }

      const { data, error } = await supabase
        .from("Companies")
        .upsert(fileData, {
          onConflict: "company_name, domain",
          ignoreDuplicates: false,
        });
      if (error) {
        console.error("Supabase upsert error:", error);
        return res.status(500).json({
          message: "Error inserting into Supabase - File upload failed",
        });
      }
      return res.status(200).json({ message: "File uploaded successfully" });
    });
  }
}
