import { columns, Company } from "./columns";
import { DataTable } from "./data-table";

export default async function ResultsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{
    domain?: string;
    country?: string;
    employee_size?: string;
  }>;
}>) {
  const filterParams = new URLSearchParams();
  const filters = await searchParams;

  if (filters.domain) {
    filterParams.append("domain", filters.domain);
  }
  if (filters.country) {
    filterParams.append("country", filters.country);
  }
  if (filters.employee_size) {
    filterParams.append("employee_size", filters.employee_size);
  }

  let companies: Company[] = [];

  const response = await fetch(
    `${process.env.BASE_URL}/api/companies?${filterParams.toString()}`
  );
  const result = await response.json();
  companies = result ?? [];

  const employee_sizes_repsonse = await fetch(
    `${process.env.BASE_URL}/api/employee_sizes`
  );
  const employee_sizes = (await employee_sizes_repsonse.json()) ?? [];

  return (
    <div className="flex h-screen items-center justify-center w-full">
      <DataTable
        data={companies}
        columns={columns}
        employee_sizes={employee_sizes}
      />
    </div>
  );
}
