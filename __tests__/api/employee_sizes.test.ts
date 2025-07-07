// __tests__/api/employee-sizes.test.ts
import { createMocks } from "node-mocks-http";
import handler from "@/pages/api/employee_sizes";
import { supabase } from "@/lib/supabase/supabaseClient";

// Mock Supabase
jest.mock("@/lib/supabase/supabaseClient", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(),
      })),
    })),
  },
}));

describe("/api/employee_sizes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockReturnValue({} as any);
  });

  it("should return 405 for non-GET requests", async () => {
    const { req, res } = createMocks({
      method: "POST",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: "Method POST Not Allowed",
    });
    expect(res._getHeaders()).toHaveProperty("allow", ["GET"]);
  });

  it("should return sorted unique employee sizes", async () => {
    const mockData = [
      { employee_size: "51-200" },
      { employee_size: "1-10" },
      { employee_size: "501-1000" },
      { employee_size: "11-50" },
      { employee_size: "1-10" }, // Duplicate
      { employee_size: "10000+" },
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      }),
    });

    const { req, res } = createMocks({
      method: "GET",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());

    // Should be sorted according to sizeOrder and duplicates removed
    expect(responseData).toEqual([
      "1-10",
      "11-50",
      "51-200",
      "501-1000",
      "10000+",
    ]);
  });

  it("should handle empty data", async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });

    const { req, res } = createMocks({
      method: "GET",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual([]);
  });

  it("should handle Supabase errors", async () => {
    const mockError = { message: "Database connection failed" };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    });

    const { req, res } = createMocks({
      method: "GET",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: "Error fetching from Supabase",
      details: "Database connection failed",
    });
  });

  it("should handle unexpected errors", async () => {
    (supabase.from as jest.Mock).mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    const { req, res } = createMocks({
      method: "GET",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: "Internal Server Error",
      details: "Unexpected error",
    });
  });
});
