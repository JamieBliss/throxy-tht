import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase/supabaseClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    const { country, employee_size, domain } = req.query;

    let query = supabase.from("Companies").select("*");

    // Dynamically build the query based on provided filters
    if (country && typeof country === "string") {
      query = query.ilike("country", `%${country}%`);
    }

    if (employee_size && typeof employee_size === "string") {
      query = query.eq("employee_size", employee_size);
    }

    if (domain && typeof domain === "string") {
      query = query.ilike("domain", `%${domain}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase query error:", error);
      return res.status(500).json({
        message: "Error fetching from Supabase",
        details: error.message,
      });
    }

    return res.status(200).json(data);
  } catch (e) {
    const error = e as Error;
    console.error("API Error:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", details: error.message });
  }
}
