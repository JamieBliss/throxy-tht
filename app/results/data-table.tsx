"use client";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Company } from "./columns";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

interface DataTableProps {
  data: Company[];
  columns: ColumnDef<Company>[];
  employee_sizes: string[];
}

export function DataTable({ data, columns, employee_sizes }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
  });

  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState({
    domain: "",
    country: "",
    employee_size: "",
  });

  const updateUrl = (newFilters: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(searchParams?.toString());
    Object.keys(newFilters).forEach((key) => {
      if (newFilters[key]) {
        newSearchParams.set(key, newFilters[key]);
      } else {
        newSearchParams.delete(key);
      }
    });
    router.push(`?${newSearchParams.toString()}`);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      updateUrl(filters);
    }, 300);

    return () => clearTimeout(timeout);
  }, [filters]);

  const getColumnLabel = (columnId: string) => {
    return columnId
      .replaceAll("_", " ")
      .split(" ")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="w-3/4">
      <div className="flex py-4">
        <div className="flex max-w-md">
          <Select
            value={filters.employee_size}
            onValueChange={(value) => {
              if (value === "clear") {
                setFilters({ ...filters, employee_size: "" });
              } else {
                setFilters({ ...filters, employee_size: value });
              }
            }}
          >
            <SelectTrigger className="mr-auto w-[180px]">
              <SelectValue placeholder="Employee Size" />
            </SelectTrigger>

            <SelectContent align="end">
              {filters.employee_size && (
                <SelectItem value="clear" className="text-muted-foreground">
                  Clear selection
                </SelectItem>
              )}
              {employee_sizes.map((employee_size) => (
                <SelectItem key={employee_size} value={employee_size}>
                  {employee_size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Domain"
            value={filters.domain}
            onChange={(event) =>
              setFilters({ ...filters, domain: event.target.value })
            }
            className="max-w-md ml-2 capitalize"
          />
          <Input
            placeholder="Country"
            value={filters.country}
            onChange={(event) =>
              setFilters({ ...filters, country: event.target.value })
            }
            className="max-w-md ml-2 capitalize"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {getColumnLabel(column.id)}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 25, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-x-2 flex flex-row">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
