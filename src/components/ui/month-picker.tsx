import * as React from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { addYears, format, setMonth, setYear, subYears } from "date-fns"
import { ptBR } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface MonthPickerProps {
    currentMonth: string // "YYYY-MM"
    onMonthChange: (newMonth: string) => void
    disabled?: boolean
}

const MONTHS = [
    "jan", "fev", "mar", "abr",
    "mai", "jun", "jul", "ago",
    "set", "out", "nov", "dez"
]

export function MonthPicker({ currentMonth, onMonthChange, disabled }: MonthPickerProps) {
    const [open, setOpen] = React.useState(false)

    // Parse initial state
    const [yearStr, monthStr] = currentMonth.split('-')
    const [viewDate, setViewDate] = React.useState(() => {
        const d = new Date()
        d.setFullYear(parseInt(yearStr), parseInt(monthStr) - 1, 1)
        return d
    })

    const handleYearChange = (increment: number) => {
        setViewDate(prev => addYears(prev, increment))
    }

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = setMonth(setYear(new Date(), viewDate.getFullYear()), monthIndex)
        const formatted = format(newDate, 'yyyy-MM')
        onMonthChange(formatted)
        setOpen(false)
    }

    const handleCurrentMonth = () => {
        const now = new Date()
        const formatted = format(now, 'yyyy-MM')
        onMonthChange(formatted)
        setViewDate(now) // Also update view to current year
        setOpen(false)
    }

    const handleClear = () => {
        // Optional: Decide what 'Clear' means. For now, maybe reset to current or null? 
        // The requirement didn't specify 'Clear', but looking at the screenshot 'Limpar' is there.
        // However, the app requires a month. Let's make it just close or reset to initial?
        // Let's assume 'Limpar' might just close or maybe reset to null if allowed. 
        // Given the type is strictly string, I'll basically ignore it or treating as "Cancel" behavior?
        // Actually typical "Clear" clears the selection. But our state requires a value.
        // Let's implement it as "Cancel" / Close for now or just not include if not strictly needed logic.
        // Wait, the screenshot shows "Limpar" and "Este mês".
        setOpen(false)
    }

    const selectedYear = parseInt(yearStr)
    const selectedMonthIndex = parseInt(monthStr) - 1

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal bg-background h-11",
                        !currentMonth && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentMonth ? format(new Date(parseInt(yearStr), parseInt(monthStr) - 1), "MMMM 'de' yyyy", { locale: ptBR }) : <span>Selecione o mês</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
                <div className="flex items-center justify-between p-2 border-b">
                    <span className="font-semibold ml-2">{viewDate.getFullYear()}</span>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleYearChange(-1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleYearChange(1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2 p-4">
                    {MONTHS.map((month, index) => {
                        const isSelected = viewDate.getFullYear() === selectedYear && index === selectedMonthIndex
                        return (
                            <Button
                                key={month}
                                variant={isSelected ? "default" : "ghost"}
                                className={cn(
                                    "h-9 w-full text-xs capitalize",
                                    isSelected && "bg-blue-600 hover:bg-blue-700 text-white"
                                )}
                                onClick={() => handleMonthSelect(index)}
                            >
                                {month}.
                            </Button>
                        )
                    })}
                </div>

                <div className="border-t p-2 flex justify-between">
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground hover:text-foreground" onClick={handleClear}>
                        Fechar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={handleCurrentMonth}>
                        Este mês
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
