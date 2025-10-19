/**
 * System Message Service
 * Manages the construction and organization of system messages for the AI chat
 */

export interface SystemMessageRule {
  category: 'general' | 'navigation' | 'data_query' | 'student_specific' | 'formatting';
  priority: number; // Lower numbers = higher priority
  rule: string;
}

export interface ToolSpecificRules {
  toolName: string;
  description: string;
  rules: string[];
}

export class SystemMessageService {
  private static instance: SystemMessageService;
  private baseRules: SystemMessageRule[] = [];
  private toolRules: Map<string, ToolSpecificRules> = new Map();

  private constructor() {
    this.initializeBaseRules();
  }

  static getInstance(): SystemMessageService {
    if (!SystemMessageService.instance) {
      SystemMessageService.instance = new SystemMessageService();
    }
    return SystemMessageService.instance;
  }

  private initializeBaseRules(): void {
    this.baseRules = [
      // General Rules
      {
        category: 'general',
        priority: 1,
        rule: 'You are a helpful AI assistant for school counselors and administrators.'
      },
      {
        category: 'general',
        priority: 2,
        rule: 'Your goal is to answer questions by querying the database or helping the user navigate the application.'
      },
      {
        category: 'general',
        priority: 3,
        rule: 'Select the best tool for the user\'s request based on the tool\'s description.'
      },
      {
        category: 'general',
        priority: 10,
        rule: '"Current year" refers to the school year where \'is_current\' is true in the database.'
      },

      // Student-specific Rules
      {
        category: 'student_specific',
        priority: 4,
        rule: 'For any task involving a specific student, if you don\'t already know the student_id, you must first use the \'identify_student\' tool to get their unique ID.'
      },
      {
        category: 'student_specific',
        priority: 5,
        rule: 'If the name is ambiguous, present the potential matches to the user for clarification.'
      },

      // Data Query Rules
      {
        category: 'data_query',
        priority: 6,
        rule: 'If the user asks a question that you can\'t answer with one of the other tools, inspect the database schema and see if there is a table that might be relevant (make sure to read the comments in the schema).'
      },
      {
        category: 'data_query',
        priority: 7,
        rule: 'If you find a relevant table, use the `get_table_schema` tool to get the schema and understand the table better. Then use the `execute_sql` tool to execute a query on the table.'
      },
      {
        category: 'data_query',
        priority: 8,
        rule: 'Questions about students\' goals, interests, and other non-academic information should be answered by looking for relevant tags in the tags table or meeting_notes.'
      },
      {
        category: 'data_query',
        priority: 9,
        rule: 'Search the tags table for potentially relevant tag names (if you don\'t find any relevant ones by assuming a name, then select all tag names and look for possibly relevant ones), then look in the student_tags table for the values to help answer the question.'
      },
      {
        category: 'data_query',
        priority: 11,
        rule: 'Questions about students\' academic track should be contained by tags in the Academics tag_category.'
      },
      {
        category: 'data_query',
        priority: 12,
        rule: 'You may search the meeting_notes table for potentially relevant information about a single student. You may not search the meeting_notes table for information about multiple students at once.'
      },

      // Formatting Rules
      {
        category: 'formatting',
        priority: 13,
        rule: 'When referencing a student, use their full name and format it as a markdown link to their profile, like this: [Student\'s Full Name](/students/<studentId>).'
      },
      {
        category: 'formatting',
        priority: 14,
        rule: 'Provide only the final, user-facing answer. Do not include intermediate steps, tool outputs, or error messages in your response.'
      },
      {
        category: 'formatting',
        priority: 15,
        rule: 'Never generate external links or urls. Only generate links or urls that lead to internal pages within the application.'
      }
    ];
  }

  registerToolRules(toolRules: ToolSpecificRules): void {
    this.toolRules.set(toolRules.toolName, toolRules);
  }

  buildSystemMessage(preferredToolNames?: string[]): string {
    const sections: string[] = [];

    // Sort rules by priority
    const sortedRules = [...this.baseRules].sort((a, b) => a.priority - b.priority);

    // Group rules by category
    const rulesByCategory = sortedRules.reduce((acc, rule) => {
      if (!acc[rule.category]) {
        acc[rule.category] = [];
      }
      acc[rule.category].push(rule.rule);
      return acc;
    }, {} as Record<string, string[]>);

    // Build the main message
    sections.push(rulesByCategory.general?.join(' ') || '');

    // Add key guidelines section
    sections.push('\nKey Guidelines:');
    
    // Add categorized rules
    if (rulesByCategory.general?.length > 2) {
      rulesByCategory.general.slice(2).forEach(rule => {
        sections.push(`- ${rule}`);
      });
    }

    if (rulesByCategory.student_specific) {
      rulesByCategory.student_specific.forEach(rule => {
        sections.push(`- ${rule}`);
      });
    }

    if (rulesByCategory.data_query) {
      rulesByCategory.data_query.forEach(rule => {
        sections.push(`- ${rule}`);
      });
    }

    if (rulesByCategory.formatting) {
      rulesByCategory.formatting.forEach(rule => {
        sections.push(`- ${rule}`);
      });
    }

    // Add tool-specific rules if any
    const toolNamesToInclude = preferredToolNames && preferredToolNames.length > 0
      ? preferredToolNames.filter(name => this.toolRules.has(name))
      : Array.from(this.toolRules.keys());

    if (toolNamesToInclude.length > 0) {
      sections.push('\nTool-Specific Guidelines:');
      toolNamesToInclude.forEach(toolName => {
        const toolRule = this.toolRules.get(toolName);
        if (!toolRule) {
          return;
        }

        sections.push(`\n### ${toolName}:`);
        sections.push(toolRule.description);
        toolRule.rules.forEach(rule => {
          sections.push(`- ${rule}`);
        });
      });
    }

    return sections.filter(Boolean).join('\n');
  }

  // Method to dynamically add rules at runtime
  addRule(rule: SystemMessageRule): void {
    this.baseRules.push(rule);
  }

  // Method to update a specific category of rules
  updateCategoryRules(category: SystemMessageRule['category'], rules: Omit<SystemMessageRule, 'category'>[]): void {
    // Remove existing rules for this category
    this.baseRules = this.baseRules.filter(r => r.category !== category);
    
    // Add new rules
    rules.forEach(rule => {
      this.baseRules.push({
        ...rule,
        category
      });
    });
  }

  // Method to get rules for testing/debugging
  getRules(): { base: SystemMessageRule[], tools: Map<string, ToolSpecificRules> } {
    return {
      base: [...this.baseRules],
      tools: new Map(this.toolRules)
    };
  }
}

export default SystemMessageService.getInstance();
