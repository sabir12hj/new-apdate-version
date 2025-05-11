import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface DataTableProps<TData> {
  data: TData[];
  columns: {
    header: string;
    accessorKey: string;
    cell?: (item: TData) => React.ReactNode;
  }[];
  isLoading?: boolean;
  skeletonRows?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];
  pageSize?: number;
}

export function DataTable<TData>({
  data,
  columns,
  isLoading = false,
  skeletonRows = 5,
  searchable = false,
  searchPlaceholder = "Search...",
  searchKeys = [],
  pageSize = 10,
}: DataTableProps<TData>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  
  // Filter data based on search term
  const filteredData = searchable && search
    ? data.filter((item) => {
        return searchKeys.some((key) => {
          // @ts-ignore - we don't know the exact keys at compile time
          const value = item[key];
          if (typeof value === "string") {
            return value.toLowerCase().includes(search.toLowerCase());
          }
          if (typeof value === "number") {
            return value.toString().includes(search);
          }
          return false;
        });
      })
    : data;
  
  // Paginate data
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);
  
  // Generate pagination numbers
  const getPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    // Always show first page
    items.push(1);
    
    // Calculate range around current page
    let startPage = Math.max(2, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 2);
    
    // Adjust if range is not centered
    if (endPage - startPage < maxVisiblePages - 2) {
      startPage = Math.max(2, endPage - (maxVisiblePages - 2));
    }
    
    // Add ellipsis before range
    if (startPage > 2) {
      items.push("...");
    }
    
    // Add range pages
    for (let i = startPage; i <= endPage; i++) {
      items.push(i);
    }
    
    // Add ellipsis after range
    if (endPage < totalPages - 1) {
      items.push("...");
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1) {
      items.push(totalPages);
    }
    
    return items;
  };

  return (
    <div className="w-full">
      {searchable && (
        <div className="mb-4">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to page 1 when searching
            }}
            className="max-w-sm"
          />
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex} className="p-4">
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <TableRow key={index}>
                  {columns.map((column, columnIndex) => (
                    <TableCell key={columnIndex}>
                      {column.cell
                        ? column.cell(item)
                        // @ts-ignore - we don't know the exact keys at compile time
                        : item[column.accessorKey]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                isActive={page > 1}
                className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {getPaginationItems().map((pageNum, i) => (
              <PaginationItem key={i}>
                {pageNum === "..." ? (
                  <div className="flex h-10 w-10 items-center justify-center">...</div>
                ) : (
                  <PaginationLink
                    onClick={() => typeof pageNum === "number" && setPage(pageNum)}
                    isActive={page === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                isActive={page < totalPages}
                className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
