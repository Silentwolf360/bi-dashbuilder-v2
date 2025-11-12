"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, X } from "lucide-react"

interface FilterProps {
  label: string
  value: any
  onChange: (value: any) => void
}

export function DateFilter({ label, value, onChange }: FilterProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input type="date" value={value || ""} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

export function SelectFilter({ label, value, onChange, options }: FilterProps & { options: Array<{ value: string; label: string }> }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <select className="w-full h-10 px-3 border rounded-md" value={value || ""} onChange={e => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

export function MultiSelectFilter({ label, value, onChange, options }: FilterProps & { options: Array<{ value: string; label: string }> }) {
  const [selected, setSelected] = useState<string[]>(value || [])

  const toggle = (val: string) => {
    const updated = selected.includes(val) 
      ? selected.filter(v => v !== val)
      : [...selected, val]
    setSelected(updated)
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
        {options.map(opt => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
            <input type="checkbox" checked={selected.includes(opt.value)} onChange={() => toggle(opt.value)} />
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export function FilterPanel({ filters, onApply, onClear }: {
  filters: React.ReactNode
  onApply: () => void
  onClear: () => void
}) {
  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Filters</h3>
        <Button size="sm" variant="ghost" onClick={onClear}>
          <X className="w-4 h-4" /> Clear
        </Button>
      </div>
      {filters}
      <Button onClick={onApply} className="w-full">Apply Filters</Button>
    </div>
  )
}
