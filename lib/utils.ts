import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(
  value: number,
  format?: string,
  decimalPlaces: number = 2,
  prefix?: string,
  suffix?: string
): string {
  let formatted: string

  switch (format) {
    case "currency":
      formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(value)
      break

    case "percent":
      formatted = `${value.toFixed(decimalPlaces)}%`
      break

    case "integer":
      formatted = Math.round(value).toLocaleString()
      break

    case "decimal":
    default:
      formatted = value.toFixed(decimalPlaces).toLocaleString()
      break
  }

  if (prefix) formatted = prefix + formatted
  if (suffix && format !== "percent") formatted = formatted + suffix

  return formatted
}

export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / Math.abs(previous)) * 100
}

export function generateQueryHash(query: any): string {
  return Buffer.from(JSON.stringify(query)).toString("base64")
}

export function parseFilterExpression(expression: string, userContext: any): any {
  // Parse filter expressions like "user.region == 'North'"
  // This is a simplified version - in production, use a proper parser
  const tokens = expression.split(/\s+(==|!=|>|<|>=|<=|in|not in)\s+/)
  
  if (tokens.length !== 3) return null

  const [field, operator, rawValue] = tokens
  
  // Resolve field value from user context
  const fieldParts = field.split(".")
  let fieldValue = userContext
  
  for (const part of fieldParts) {
    if (fieldValue && typeof fieldValue === "object") {
      fieldValue = fieldValue[part]
    } else {
      return null
    }
  }

  // Parse value
  let value = rawValue.trim().replace(/^['"]|['"]$/g, "")
  
  // Apply operator
  switch (operator) {
    case "==":
      return fieldValue === value
    case "!=":
      return fieldValue !== value
    case ">":
      return Number(fieldValue) > Number(value)
    case "<":
      return Number(fieldValue) < Number(value)
    case ">=":
      return Number(fieldValue) >= Number(value)
    case "<=":
      return Number(fieldValue) <= Number(value)
    default:
      return false
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
