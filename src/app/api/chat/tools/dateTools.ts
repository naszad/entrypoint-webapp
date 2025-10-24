/**
 * Date Utility Tools
 * Provides the conversational agent with accurate current date context
 */

import { tool } from 'ai';
import { z } from 'zod/v3';
import { ChatTool } from './types';

const pad = (value: number): string => value.toString().padStart(2, '0');

export const getCurrentDateTool: ChatTool = {
  metadata: {
    name: 'get_current_date',
    category: 'utility',
    description: 'Returns today’s date and related metadata so the agent does not have to infer it.',
    systemMessageRules: [
      'Call get_current_date instead of assuming the current date or time.',
      'Use this tool before performing date math or answering time-sensitive questions.',
      'Mention the timezone in your response if it affects the interpretation of dates.',
    ],
  },
  definition: tool({
    description:
      'Provides the current date and time information using the server’s local timezone, along with UTC references.',
    inputSchema: z
      .object({})
      .describe('No input is required. Calling the tool returns the current date context.'),
    execute: async () => {
      const now = new Date();
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
      const offsetMinutesFromUTC = -now.getTimezoneOffset();
      const offsetHours = Math.floor(Math.abs(offsetMinutesFromUTC) / 60);
      const offsetMinutesRemainder = Math.abs(offsetMinutesFromUTC) % 60;
      const offsetSign = offsetMinutesFromUTC >= 0 ? '+' : '-';
      const offsetString = `${offsetSign}${pad(offsetHours)}:${pad(offsetMinutesRemainder)}`;

      const year = now.getFullYear();
      const month = pad(now.getMonth() + 1);
      const day = pad(now.getDate());
      const hours = pad(now.getHours());
      const minutes = pad(now.getMinutes());
      const seconds = pad(now.getSeconds());

      const isoLocalDate = `${year}-${month}-${day}`;
      const isoLocalDateTime = `${isoLocalDate}T${hours}:${minutes}:${seconds}`;

      const utcIsoDate = now.toISOString().slice(0, 10);
      const utcIsoDateTime = now.toISOString();

      const dayOfWeek = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        timeZone,
      }).format(now);

      const friendlyDate = new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(now);

      return {
        isoDate: isoLocalDate,
        isoDateTime: `${isoLocalDateTime}${offsetString}`,
        readableDate: friendlyDate,
        dayOfWeek,
        timeZone,
        utcOffsetMinutes: offsetMinutesFromUTC,
        isoDateUTC: utcIsoDate,
        isoDateTimeUTC: utcIsoDateTime,
        unixEpochMs: now.getTime(),
      };
    },
  }),
};
