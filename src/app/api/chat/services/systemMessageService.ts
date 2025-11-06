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
    // Base rules feed the AI workflow as part of the system prompt. The singleton is
    // hydrated once here, then `ToolRegistry` (tools/index.ts) registers tool-specific
    // guidance. When a conversation runs, `runStreamingWorkflow` (workflows/common.ts)
    // calls `buildSystemMessage` to merge these rules with any preferred tool hints,
    // and the combined string is passed to `streamText` as the `system` message. The
    // formatting subset is also reused via `buildFormattingReminderBlock` to append
    // high-priority reminders to the same prompt.

    // All "general" rules are loaded every time.
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
        priority: 4,
        rule: 'After providing an answer, don\'t ask the user if they want more information.'
      },
      {
        category: 'general',
        priority: 5,
        rule: '"Current year" refers to the school year where \'is_current\' is true in the database.'
      },
      {
        category: 'general',
        priority: 6,
        rule: 'Unless the user explicitly requests otherwise, assume questions about data that is associated to terms — courses, grades, and absences — are being asked about the current term(s). State you made that assumption in your response. Use the term tools to find the current terms.'
      },
      {
        category: 'general',
        priority: 7,
        rule: 'You don\'t know anything about the student schedules. If the user asks about whether students have a full schedule, or what time they have a class, you must say you are not able to answer that at this time.'
      },
      {
        category: 'general',
        priority: 8,
        rule: 'Don\'t claim to do things you can\'t do. For example, if the user asks you to make a CSV file, you must say you can\'t do that because that\'s not part of your tool set.'
      },


      // Student-specific Rules
      {
        category: 'student_specific',
        priority: 10,
        rule: 'For any task involving a specific student, if you don\'t already know the student_id, you must first use the \'identify_student\' tool to get their unique ID.'
      },
      {
        category: 'student_specific',
        priority: 11,
        rule: 'If the name is ambiguous, present the potential matches to the user for clarification.'
      },

      // Data Query Rules
      {
        category: 'data_query',
        priority: 6,
        rule: 'You do not create reports. Any questions about generating or showing reports must be answered with a message about that feature being being worked on and is not available yet.'
      },
      {
        category: 'data_query',
        priority: 6,
        rule: 'If tools do not answer the user\'s question, do not attempt to fabricate an answer. Instead, respond with a message indicating that you could not find the information requested.'
      },
      {
        category: 'data_query',
        priority: 6,
        rule: 'If the user asks a question that you can\'t answer with one of the other tools, inspect the database schema and see if there is a table that might be relevant (make sure to read the comments in the schema).'
      },
      {
        category: 'data_query',
        priority: 21,
        rule: 'If you find a relevant table, use the `get_table_schema` tool to get the schema and understand the table better. Then use the `execute_sql` tool to execute a query on the table.'
      },
      {
        category: 'data_query',
        priority: 22,
        rule: 'Questions about students\' goals, interests, and other qualitative or non-academic information should be answered by looking for relevant tags using the tag tools.'
      },
      {
        category: 'data_query',
        priority: 23,
        rule: 'For questions about data that may span school years, ensure your queries account for the correct academic term or year as needed. If the user does not specify, default to the current academic year for things like grades and absences.'
      },
      {
        category: 'general',
        priority: 24,
        rule: 'Academic grades include + and - suffixes (e.g., A-, B+). You must account for these suffixes. If a user asks for a grade "below" a certain grade, include the appropriate suffixes. "Below D" means "D, D-, and F".'
      },
      {
        category: 'data_query',
        priority: 25,
        rule: 'Questions about students\' academic track should be contained by tags in the Academics tag_category.'
      },
      {
        category: 'data_query',
        priority: 26,
        rule: 'You may search the meeting_notes table for potentially relevant information about a single student. You may not search the meeting_notes table for information about multiple students at once.'
      },

      // Formatting Rules
      {
        category: 'formatting',
        priority: 90,
        rule: 'Whenever referencing a student in a response, you MUST use their full name and format it as an absolute markdown link to their profile, like this: [Student\'s Full Name](/students/<studentId>).'
      },
      {
        category: 'formatting',
        priority: 91,
        rule: 'Provide only the final, user-facing answer. Do not include intermediate steps, tool outputs, or error messages in your response.'
      },
      {
        category: 'formatting',
        priority: 92,
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

  getFormattingRules(): string[] {
    return [...this.baseRules]
      .filter(rule => rule.category === 'formatting')
      .sort((a, b) => a.priority - b.priority)
      .map(rule => rule.rule);
  }

  buildFormattingReminderBlock(): string | null {
    const formattingRules = this.getFormattingRules();
    if (formattingRules.length === 0) {
      return null;
    }

    const lines = ['Formatting rules (do not ignore):'];
    formattingRules.forEach(rule => {
      lines.push(`- ${rule}`);
    });

    return lines.join('\n');
  }
}

export default SystemMessageService.getInstance();
