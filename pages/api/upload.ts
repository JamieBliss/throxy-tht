import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { IncomingForm } from "formidable";
import fs from "fs";
import Papa from "papaparse";
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "@/lib/supabase/supabaseClient";

export const config = {
  api: {
    bodyParser: false,
  },
};

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
});

type ResponseData = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === "POST") {
    const { fields, files } = await new Promise<{
      fields: formidable.Fields;
      files: formidable.Files;
    }>((resolve, reject) => {
      const form = new IncomingForm();
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileContent = fs.readFileSync(file.filepath, "utf-8");
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transform: (value) => {
        if (typeof value !== "string") return value;
        const trimmedValue = value.trim();
        return trimmedValue;
      },
    });

    if (parseResult.errors.length) {
      console.error("CSV Parse Errors:", parseResult.errors);
      return res.status(400).json({ message: "Failed to parse the CSV file." });
    }

    const fileData = parseResult.data.map((row: any) => {
      return {
        ...row,
        raw_json: {
          ...row,
        },
      };
    });

    if (fileData.length === 0) {
      return res
        .status(400)
        .json({ message: "CSV file is empty or contains no data." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
          You are a data cleaning and enrichment tool.

          Clean and enrich the following JSON object with these rules:

          - country: Convert country code to full English country name (e.g., "us" → "United States").
          - employee_size: Map raw number or range to one of these buckets: "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10000+".
          - domain: Lower-case and remove spaces. Correct domains where possible, fullstops may need to be added manually before (com, co.uk, etc). Blank if unknown or invalid.
          - city: Convert abbreviations to their full names(e.g., "ny" → "New York").

          Input:
          ${JSON.stringify(fileData)}

          Output only the cleaned JSON as an array of objects
        `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              company_name: {
                type: Type.STRING,
              },
              domain: {
                type: Type.STRING,
              },
              city: {
                type: Type.STRING,
              },
              country: {
                type: Type.STRING,
              },
              employee_size: {
                type: Type.STRING,
                enum: [
                  "1-10",
                  "11-50",
                  "51-200",
                  "201-500",
                  "501-1000",
                  "1001-5000",
                  "5001-10000",
                  "10000+",
                ],
              },
              raw_json: {
                type: Type.OBJECT,
                properties: {
                  company_name: {
                    type: Type.STRING,
                  },
                  domain: {
                    type: Type.STRING,
                  },
                  city: {
                    type: Type.STRING,
                  },
                  country: {
                    type: Type.STRING,
                  },
                  employee_size: {
                    type: Type.STRING,
                  },
                },
              },
            },
          },
        },
      },
    });

    const aiResponse = response.text;

    if (!aiResponse) {
      return res
        .status(500)
        .json({ message: "AI returned an empty response." });
    }

    const enrichedData = JSON.parse(aiResponse);

    const { data, error } = await supabase
      .from("Companies")
      .upsert(enrichedData, {
        onConflict: "company_name,domain",
        ignoreDuplicates: false,
      });
    if (error) {
      console.error("Supabase upsert error:", error);
      return res.status(500).json({
        message: "Error inserting into Supabase - File upload failed",
      });
    }
    return res.status(200).json({ message: "File uploaded successfully" });
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
