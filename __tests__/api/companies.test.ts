// __tests__/api/companies.test.ts
import { createMocks } from "node-mocks-http";
import handler from "@/pages/api/companies";
import { supabase } from "@/lib/supabase/supabaseClient";

// Mock Supabase
jest.mock("@/lib/supabase/supabaseClient", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        ilike: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      })),
    })),
  },
}));

describe("/api/companies", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockReturnValue({} as any);
    jest.clearAllMocks();
  });

  it("should return 405 for non-GET requests", async () => {
    const { req, res } = createMocks({
      method: "POST",
      url: "/api/companies",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: "Method POST Not Allowed",
    });
    expect(res._getHeaders()).toHaveProperty("allow", ["GET"]);
  });

  it("should fetch all companies without filters", async () => {
    const mockData = [
      {
        id: 1,
        company_name: "Test Company",
        country: "United States",
        employee_size: "11-50",
        domain: "test.com",
      },
    ];

    const mockQuery = {
      ilike: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
        ...mockQuery,
      }),
    });

    const { req, res } = createMocks({
      method: "GET",
      url: "/api/companies",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockData);
  });

  it("should filter by country", async () => {
    const mockData = [
      {
        id: 1,
        company_name: "US Company",
        country: "United States",
        employee_size: "11-50",
        domain: "us-company.com",
      },
    ];

    const mockQuery = {
      ilike: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        ...mockQuery,
      }),
    });

    const { req, res } = createMocks({
      method: "GET",
      url: "/api/companies",
      query: {
        country: "United States",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockData);
  });

  it("should filter by employee_size", async () => {
    const mockData = [
      {
        id: 1,
        company_name: "Small Company",
        country: "United States",
        employee_size: "1-10",
        domain: "small.com",
      },
    ];

    const mockQuery = {
      eq: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        ...mockQuery,
        then: jest.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      }),
    });

    const { req, res } = createMocks({
      method: "GET",
      url: "/api/companies",
      query: {
        employee_size: "1-10",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockData);
  });

  it("should filter by domain", async () => {
    const mockData = [
      {
        id: 1,
        company_name: "Tech Company",
        country: "United States",
        employee_size: "51-200",
        domain: "tech.com",
      },
    ];

    const mockQuery = {
      ilike: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        ...mockQuery,
        then: jest.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      }),
    });

    const { req, res } = createMocks({
      method: "GET",
      url: "/api/companies",
      query: {
        domain: "tech",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockData);
  });

  it("should handle multiple filters", async () => {
    const mockData = [
      {
        id: 1,
        company_name: "Filtered Company",
        country: "United States",
        employee_size: "11-50",
        domain: "filtered.com",
      },
    ];

    const mockQuery = {
      ilike: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          ilike: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      }),
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        ...mockQuery,
        then: jest.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      }),
    });

    const { req, res } = createMocks({
      method: "GET",
      url: "/api/companies",
      query: {
        country: "United States",
        employee_size: "11-50",
        domain: "filtered",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockData);
  });

  it("should handle Supabase errors", async () => {
    const mockError = { message: "Database connection failed" };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
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
