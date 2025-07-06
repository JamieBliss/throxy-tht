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
    const { data, error } = await supabase
      .from("Companies")
      .select("employee_size")
      .order("employee_size", { ascending: true });

    if (error) {
      console.error("Supabase query error:", error);
      return res.status(500).json({
        message: "Error fetching from Supabase",
        details: error.message,
      });
    }

    const sizeOrder = [
      "1-10",
      "11-50",
      "51-200",
      "201-500",
      "501-1000",
      "1001-5000",
      "5001-10000",
      "10000+",
    ];

    const uniqueSizes = [
      ...new Set(data.map((item) => item.employee_size)),
    ].sort((a, b) => sizeOrder.indexOf(a!) - sizeOrder.indexOf(b!));

    return res.status(200).json(uniqueSizes);
  } catch (e) {
    const error = e as Error;
    console.error("API Error:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", details: error.message });
  }
}
