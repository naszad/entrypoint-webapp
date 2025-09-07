'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/utils/utils';
import { DatabaseIcon, TableIcon, SearchIcon, FilterIcon, ExternalLinkIcon } from 'lucide-react';
import type {
  ListTablesOutput,
  GetTableSchemaOutput,
  ExecuteSqlOutput,
  FilterStudentsOutput,
  GetStudentGpaOutput,
  TableSchema,
  FilterGradesOutput,
} from '@/types/ChatToolTypes';

// Component for displaying list of tables
export const ListTablesOutputComponent = ({ 
  output, 
  className 
}: { 
  output: ListTablesOutput; 
  className?: string; 
}) => {
  if ('error' in output) {
    return (
      <div className={cn('text-destructive', className)}>
        <p>{output.error}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <DatabaseIcon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Available Tables ({output.length})</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {output.map((tableName) => (
          <Badge
            key={tableName}
            variant="secondary"
            className="justify-center p-2 text-xs font-mono"
          >
            {tableName}
          </Badge>
        ))}
      </div>
    </div>
  );
};

// Component for displaying table schema
export const TableSchemaOutputComponent = ({ 
  output, 
  className 
}: { 
  output: GetTableSchemaOutput; 
  className?: string; 
}) => {
  if ('error' in output) {
    return (
      <div className={cn('text-destructive', className)}>
        <p>{output.error}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <TableIcon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Table Schema ({output.length} columns)</span>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column Name</TableHead>
              <TableHead>Data Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {output.map((column: TableSchema, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono text-sm">{column.column_name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {column.data_type}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Component for displaying SQL query results
export const ExecuteSqlOutputComponent = ({ 
  output, 
  className 
}: { 
  output: ExecuteSqlOutput; 
  className?: string; 
}) => {
  if ('error' in output) {
    return (
      <div className={cn('text-destructive', className)}>
        <p>{output.error}</p>
      </div>
    );
  }

  if (!Array.isArray(output) || output.length === 0) {
    return (
      <div className={cn('text-muted-foreground text-sm', className)}>
        <div className="flex items-center gap-2">
          <SearchIcon className="size-4" />
          <span>No results found</span>
        </div>
      </div>
    );
  }

  // Get column names from the first record
  const columns = Object.keys(output[0]);
  const maxDisplayRows = 100; // Limit for performance
  const displayData = output.slice(0, maxDisplayRows);
  const hasMoreRows = output.length > maxDisplayRows;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <SearchIcon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          Query Results ({output.length} row{output.length !== 1 ? 's' : ''})
          {hasMoreRows && ` - showing first ${maxDisplayRows}`}
        </span>
      </div>
      
      <div className="rounded-md border max-h-96 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className="text-xs font-medium">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => {
                  const value = row[column];
                  const displayValue = value === null || value === undefined 
                    ? <span className="text-muted-foreground italic">null</span>
                    : String(value);
                  
                  return (
                    <TableCell key={column} className="text-xs max-w-48 truncate">
                      {displayValue}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {hasMoreRows && (
        <p className="text-xs text-muted-foreground">
          ... and {output.length - maxDisplayRows} more rows
        </p>
      )}
    </div>
  );
};

// Component for displaying filter students results
export const FilterStudentsOutputComponent = ({ 
  output, 
  className 
}: { 
  output: FilterStudentsOutput; 
  className?: string; 
}) => {
  const router = useRouter();

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <FilterIcon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Student Filter Applied</span>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{output.description}</p>
        <Button 
          onClick={() => router.push(output.url)}
          className="w-full"
          variant="default"
        >
          <ExternalLinkIcon className="size-4 mr-2" />
          View Filtered Students
        </Button>
      </div>
    </div>
  );
};

// Component for displaying filter grades results

export const FilterGradesOutputComponent = ({ 
  output, 
  className 
}: { 
  output: FilterGradesOutput; 
  className?: string; 
}) => {
  const router = useRouter();

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <FilterIcon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Grades Filter Applied</span>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{output.description}</p>
        <Button 
          onClick={() => router.push(output.url)}
          className="w-full"
          variant="default"
        >
          <ExternalLinkIcon className="size-4 mr-2" />
          View Filtered Grades
        </Button>
      </div>
    </div>
  );
};

// Component for displaying student GPA results
export const GetStudentGpaOutputComponent = ({ 
  output, 
  className 
}: { 
  output: GetStudentGpaOutput; 
  className?: string; 
}) => {
  if ('error' in output) {
    return (
      <div className={cn('text-destructive', className)}>
        <p>{output.error}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <SearchIcon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Student GPA Result</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">GPA:</span>
          <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
            {output.gpa}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Method:</span>
          <Badge variant="outline" className="text-xs">
            {output.method}
          </Badge>
        </div>
      </div>
    </div>
  );
};
