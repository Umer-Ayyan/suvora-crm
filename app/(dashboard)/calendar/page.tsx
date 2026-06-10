"use client";

import {
  Calendar,
  dateFnsLocalizer,
} from "react-big-calendar";

import { format } from "date-fns";
import { parse } from "date-fns";
import { startOfWeek } from "date-fns";
import { getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {};

const localizer =
  dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
  });

const events = [
  {
    title:
      "Demo Follow-up",
    start: new Date(),
    end: new Date(),
  },
];

export default function CalendarPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          Follow-up Calendar
        </h1>

        <div className="bg-white rounded-3xl p-5 h-[800px] text-black">
          <Calendar
            localizer={
              localizer
            }
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{
              height: "100%",
            }}
          />
        </div>
      </div>
    </main>
  );
}