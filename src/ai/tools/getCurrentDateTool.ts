import { tool } from 'ai';
import { z } from 'zod';

const pad = (value: number): string => value.toString().padStart(2, '0');

export function createGetCurrentDateTool() {
  return tool({
    description:
      'Returns the current date, time, and timezone context so agents do not have to infer it.',
    inputSchema: z
      .object({})
      .describe('No input required. Call the tool to retrieve the current date context.')
      .default({}),
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
  });
}
