import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

interface PaginationProps {
  total: number;
  currentPage?: number;
  onPageChange?: (pageNumber: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSize?: number;
}

const Pagination = ({ total, currentPage = 1, onPageChange, onPageSizeChange, pageSize: propPageSize }: PaginationProps) => {

  const pageSize = propPageSize || 50;
  const pageNumber = currentPage;
  
  const totalPages = Math.ceil(total / pageSize);
  
  // Update localStorage when pageSize changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pagination-pageSize', pageSize.toString());
    }
  }, [pageSize]);
  
  // Calculate which page numbers to show (up to 5)
  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // If current page is near the beginning
    if (pageNumber <= 3) {
      return [1, 2, 3, 4, 5];
    }
    
    // If current page is near the end
    if (pageNumber >= totalPages - 2) {
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    
    // Current page is in the middle
    return [pageNumber - 2, pageNumber - 1, pageNumber, pageNumber + 1, pageNumber + 2];
  };
  
  const visiblePages = getVisiblePages();
  
  const handlePageSizeChange = (newSize: number) => {
    onPageSizeChange?.(newSize);
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange?.(newPage);
    }
  };
  
  const canGoPrevious = pageNumber > 1;
  const canGoNext = pageNumber < totalPages;
  const showArrows = totalPages > 5;

  return (
    <div className="h-15 min-h-15 border-b px-4 flex items-center justify-between bg-gray-100 shadow-sm">
      <div className="flex-1 text-start">
        Total records: {total}
      </div>
      
      <div className="flex-1 flex items-center justify-center gap-1">
        {/* Left Arrow */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pageNumber - 1)}
          disabled={!canGoPrevious || (!showArrows && pageNumber === 1)}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {/* Page Numbers */}
        {visiblePages.map((page) => (
          <Button
            key={page}
            variant={page === pageNumber ? "primary" : "outline"}
            size='xsm'
            onClick={() => handlePageChange(page)}
            className="h-8 w-8 p-0"
          >
            {page}
          </Button>
        ))}
        
        {/* Right Arrow */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pageNumber + 1)}
          disabled={!canGoNext || (!showArrows && pageNumber === totalPages)}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 text-end">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2"
          >
            Page size: {pageSize}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {[10, 20, 50, 100].map((size) => (
              <DropdownMenuItem key={size} onClick={() => handlePageSizeChange(size)}>
                {size}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Pagination;