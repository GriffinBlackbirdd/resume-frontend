"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value + "-01") : undefined
  )

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate)
      const formattedDate = format(selectedDate, "yyyy-MM")
      onChange?.(formattedDate)
      setOpen(false)
    }
  }

  const displayValue = date ? format(date, "MMM yyyy") : ""

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <span className={cn(!displayValue && "text-gray-400")}>
            {displayValue || placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 text-gray-400" />
        </div>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setOpen(false)}
          />
          
          {/* Calendar Dropdown */}
          <div className="absolute z-50 mt-2 p-0 bg-gray-800 border border-gray-600 rounded-lg shadow-lg">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              className="text-white"
              defaultMonth={date}
            />
          </div>
        </>
      )}
    </div>
  )
}