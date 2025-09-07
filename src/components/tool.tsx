'use client';

import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/utils/utils';
import type { ToolUIPart } from 'ai';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { CodeBlock } from './code-block';
import {
  ListTablesOutputComponent,
  TableSchemaOutputComponent,
  ExecuteSqlOutputComponent,
  FilterStudentsOutputComponent,
  GetStudentGpaOutputComponent,
} from './db-tool-outputs';
import type {
  ExecuteSqlOutput,
  ListTablesOutput,
  GetTableSchemaOutput,
  FilterStudentsOutput,
  GetStudentGpaOutput,
} from '@/types/ChatToolTypes';

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible
    className={cn('not-prose mb-4 w-full rounded-md border', className)}
    {...props}
  />
);

export type ToolHeaderProps = {
  type: ToolUIPart['type'];
  state: ToolUIPart['state'];
  className?: string;
  output?: ExecuteSqlOutput | ListTablesOutput | GetTableSchemaOutput | FilterStudentsOutput | GetStudentGpaOutput | ReactNode;
  errorText?: ToolUIPart['errorText'];
};

const getStatusBadge = (status: ToolUIPart['state'], hasError?: boolean) => {
  // Override status if we detect an error in the output
  const effectiveStatus = hasError ? 'output-error' : status;
  
  const labels = {
    'input-streaming': 'Pending',
    'input-available': 'Running',
    'output-available': 'Completed',
    'output-error': 'Error',
  } as const;

  const icons = {
    'input-streaming': <CircleIcon className="size-4" />,
    'input-available': <ClockIcon className="size-4 animate-pulse" />,
    'output-available': <CheckCircleIcon className="size-4 text-green-600" />,
    'output-error': <XCircleIcon className="size-4 text-red-600" />,
  } as const;

  return (
    <Badge className="gap-1 rounded-full text-xs shrink-0" variant="secondary">
      {icons[effectiveStatus]}
      <span className="hidden sm:inline">{labels[effectiveStatus]}</span>
    </Badge>
  );
};

export const ToolHeader = ({
  className,
  type,
  state,
  output,
  errorText,
  ...props
}: ToolHeaderProps) => {
  // Check if there's an error in the output or errorText (or output is null)
  const hasError: boolean = Boolean(errorText) || Boolean(output && typeof output === 'object' && 'error' in output) || Boolean(output === null);
  
  return (
    <CollapsibleTrigger
      className={cn(
        'flex w-full items-center justify-between gap-2 p-3',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 min-w-0">
        <WrenchIcon className="size-4 text-muted-foreground shrink-0" />
        <span className="font-medium text-sm truncate">{type}</span>
        {getStatusBadge(state, hasError)}
      </div>
      <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
  );
};

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
      className
    )}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<'div'> & {
  input: ToolUIPart['input'];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <div className={cn('space-y-2 overflow-hidden p-4', className)} {...props}>
    <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
      Parameters
    </h4>
    <div className="rounded-md bg-muted/50">
      <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
    </div>
  </div>
);

export type ToolOutputProps = ComponentProps<'div'> & {
  output: ExecuteSqlOutput | ListTablesOutput | GetTableSchemaOutput | FilterStudentsOutput | GetStudentGpaOutput | ReactNode;
  errorText: ToolUIPart['errorText'];
  type?: ToolUIPart['type']; 
};

export const ToolOutput = ({
  className,
  output,
  errorText,
  type,
  ...props
}: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null;
  }

  // Handle errors first
  if (errorText) {
    return (
      <div className={cn('space-y-2 p-4', className)} {...props}>
        <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Error
        </h4>
        <div className="overflow-x-auto rounded-md text-xs bg-destructive/10 text-destructive">
          <div>{errorText}</div>
        </div>
      </div>
    );
  }

  // Render specialized components based on tool type
  const renderSpecializedOutput = () => {
    switch (type) {
      case 'tool-list_tables':
        return <ListTablesOutputComponent output={output as ListTablesOutput} />;
      case 'tool-get_table_schema':
        return <TableSchemaOutputComponent output={output as GetTableSchemaOutput} />;
      case 'tool-execute_sql':
        return <ExecuteSqlOutputComponent output={output as ExecuteSqlOutput} />;
      case 'tool-filter_students':
        return <FilterStudentsOutputComponent output={output as FilterStudentsOutput} />;
      case 'tool-get_student_gpa':
        return <GetStudentGpaOutputComponent output={output as GetStudentGpaOutput} />;
      default:
        // Default fallback for other tools
        return (
          <div className="rounded-md bg-muted/50">
            <CodeBlock code={JSON.stringify(output, null, 2)} language="json" />
          </div>
        );
    }
  };

  return (
    <div className={cn('space-y-2 p-4', className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Result
      </h4>
      <div className="overflow-x-auto text-xs [&_table]:w-full">
        {renderSpecializedOutput()}
      </div>
    </div>
  );
};
