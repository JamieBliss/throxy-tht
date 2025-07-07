// __tests__/api/upload.test.ts
import { createMocks } from "node-mocks-http";
import handler from "@/pages/api/upload";
import { IncomingForm } from "formidable";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { supabase } from "@/lib/supabase/supabaseClient";
import Papa from "papaparse";

// Mock dependencies
jest.mock("formidable");
jest.mock("fs");
jest.mock("@google/genai", () => ({
  GoogleGenAI: jest.fn().mockReturnValue({
    models: {
      generateContent: jest.fn().mockReturnValue({
        text: JSON.stringify([]),
      }),
    },
  }),
  Type: {
    ARRAY: "array",
    OBJECT: "object",
    STRING: "string",
  },
}));
jest.mock("papaparse", () => ({
  parse: jest.fn().mockReturnValue({
    data: [],
    errors: [],
  }),
}));

// Mock Supabase
jest.mock("@/lib/supabase/supabaseClient", () => ({
  supabase: {
    from: jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      select: jest.fn(() => ({
        order: jest.fn(),
      })),
    })),
  },
}));

const mockIncomingForm = IncomingForm as jest.MockedClass<typeof IncomingForm>;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockGoogleGenAI = GoogleGenAI as jest.MockedClass<typeof GoogleGenAI>;

describe("/api/upload", () => {
  let mockAiInstance: any;

  beforeEach(() => {
    jest.spyOn(console, "error").mockReturnValue({} as any);
    jest.clearAllMocks();
  });

  it("should return 405 for non-POST requests", async () => {
    const { req, res } = createMocks({
      method: "GET",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: "Method not allowed",
    });
  });

  it("should handle missing file", async () => {
    const mockForm = {
      parse: jest.fn((req, callback) => {
        callback(null, {}, {}); // No files
      }),
    };
    mockIncomingForm.mockImplementation(() => mockForm as any);

    const { req, res } = createMocks({
      method: "POST",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: "No file uploaded",
    });
  });

  it("should handle invalid CSV file", async () => {
    const mockFile = {
      filepath: "/tmp/test.csv",
    };

    const mockForm = {
      parse: jest.fn((req, callback) => {
        callback(null, {}, { file: mockFile });
      }),
    };
    mockIncomingForm.mockImplementation(() => mockForm as any);

    // Mock fs.readFileSync to return invalid CSV
    mockFs.readFileSync.mockReturnValue("invalid,csv,data\n");

    // Mock Papa.parse to return errors
    (Papa.parse as jest.Mock).mockReturnValue({
      data: [],
      errors: [{ message: "Invalid CSV format" }],
    });

    const { req, res } = createMocks({
      method: "POST",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: "Failed to parse the CSV file.",
    });
  });

  it("should handle empty CSV file", async () => {
    const mockFile = {
      filepath: "/tmp/empty.csv",
    };

    const mockForm = {
      parse: jest.fn((req, callback) => {
        callback(null, {}, { file: mockFile });
      }),
    };
    mockIncomingForm.mockImplementation(() => mockForm as any);

    mockFs.readFileSync.mockReturnValue("header1,header2\n");

    // Mock Papa.parse to return empty data
    (Papa.parse as jest.Mock).mockReturnValue({
      data: [],
      errors: [],
    });

    const { req, res } = createMocks({
      method: "POST",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: "CSV file is empty or contains no data.",
    });
  });

  it("should handle AI processing failure", async () => {
    const mockFile = {
      filepath: "/tmp/test.csv",
    };

    const mockForm = {
      parse: jest.fn((req, callback) => {
        callback(null, {}, { file: mockFile });
      }),
    };
    mockIncomingForm.mockImplementation(() => mockForm as any);

    mockFs.readFileSync.mockReturnValue(
      "company_name,domain,country\nTest Company,test.com,us"
    );

    // Mock Papa.parse to return valid data
    (Papa.parse as jest.Mock).mockReturnValue({
      data: [
        {
          company_name: "Test Company",
          domain: "test.com",
          country: "us",
        },
      ],
      errors: [],
    });

    // Mock AI to return empty response
    (GoogleGenAI as jest.Mock).mockReturnValue({
      models: {
        generateContent: jest.fn().mockResolvedValue({
          text: "",
        }),
      },
    });

    (supabase.from as jest.Mock).mockReturnValue({
      upsert: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "AI returned an empty response." },
      }),
      select: jest.fn(() => ({
        order: jest.fn(),
      })),
    });

    const { req, res } = createMocks({
      method: "POST",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: "Error inserting into Supabase - File upload failed",
    });
  });

  it("should handle Supabase upsert error", async () => {
    const mockFile = {
      filepath: "/tmp/test.csv",
    };

    const mockForm = {
      parse: jest.fn((req, callback) => {
        callback(null, {}, { file: mockFile });
      }),
    };
    mockIncomingForm.mockImplementation(() => mockForm as any);

    mockFs.readFileSync.mockReturnValue(
      "company_name,domain,country\nTest Company,test.com,us"
    );

    // Mock Papa.parse
    (Papa.parse as jest.Mock).mockReturnValue({
      data: [
        {
          company_name: "Test Company",
          domain: "test.com",
          country: "us",
        },
      ],
      errors: [],
    });

    // Mock AI to return valid response
    const enrichedData = [
      {
        company_name: "Test Company",
        domain: "test.com",
        country: "United States",
        employee_size: "11-50",
        city: "New York",
        raw_json: {
          company_name: "Test Company",
          domain: "test.com",
          country: "us",
        },
      },
    ];

    // Mock AI to return empty response
    (GoogleGenAI as jest.Mock).mockReturnValue({
      models: {
        generateContent: jest.fn().mockResolvedValue({
          text: JSON.stringify(enrichedData),
        }),
      },
    });

    // Mock Supabase to return error
    (supabase.from as jest.Mock).mockReturnValue({
      upsert: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      }),
    });

    const { req, res } = createMocks({
      method: "POST",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: "Error inserting into Supabase - File upload failed",
    });
  });

  it("should successfully process and upload CSV file", async () => {
    const mockFile = {
      filepath: "/tmp/test.csv",
    };

    const mockForm = {
      parse: jest.fn((req, callback) => {
        callback(null, {}, { file: mockFile });
      }),
    };
    mockIncomingForm.mockImplementation(() => mockForm as any);

    mockFs.readFileSync.mockReturnValue(
      "company_name,domain,country\nTest Company,test.com,us"
    );

    // Mock Papa.parse
    (Papa.parse as jest.Mock).mockReturnValue({
      data: [
        {
          company_name: "Test Company",
          domain: "test.com",
          country: "us",
        },
      ],
      errors: [],
    });

    // Mock AI response
    const enrichedData = [
      {
        company_name: "Test Company",
        domain: "test.com",
        country: "United States",
        employee_size: "11-50",
        city: "New York",
        raw_json: {
          company_name: "Test Company",
          domain: "test.com",
          country: "us",
        },
      },
    ];

    // Mock AI to return empty response
    (GoogleGenAI as jest.Mock).mockReturnValue({
      models: {
        generateContent: jest.fn().mockResolvedValue({
          text: JSON.stringify(enrichedData),
        }),
      },
    });

    // Mock successful Supabase upsert
    (supabase.from as jest.Mock).mockReturnValue({
      upsert: jest.fn().mockResolvedValue({
        data: enrichedData,
        error: null,
      }),
    });

    const { req, res } = createMocks({
      method: "POST",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: "File uploaded successfully",
    });
  });
});
