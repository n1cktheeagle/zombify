"use client"
import React from "react"
import clsx from "clsx"
import { twMerge } from "tailwind-merge"

export type ButtonBigVariant = "black" | "white" | "discord" | "blue" | "outlineGray" | "pro" | "ghost"
export type ButtonBigStroke = "none" | "thin" | "thick"

export interface ButtonBigProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonBigVariant
  fullWidth?: boolean
  stroke?: ButtonBigStroke
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  weight?: 'normal' | 'heavy'
}

function getVariantClasses(variant: ButtonBigVariant): string {
  switch (variant) {
    case "black":
      return "bg-black text-white border-black hover:bg-gray-800"
    case "white":
      return "bg-white text-black border-black hover:bg-gray-50"
    case "ghost":
      return "bg-transparent text-black border-black hover:bg-black/5"
    case "discord":
      // Visible outline like Google SSO; border uses hover color
      return "bg-[#5865F2] text-white border-[#4752C4] hover:bg-[#4752C4]"
    case "blue":
      return "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
    case "outlineGray":
      return "bg-transparent text-gray-600 border-gray-400 hover:bg-gray-50"
    case "pro":
      return "bg-[#354258] text-white border-2 border-black hover:bg-[#2b3644]"
    default:
      return "bg-black text-white border-black hover:bg-gray-800"
  }
}

function getStrokeClasses(stroke: ButtonBigStroke | undefined, variant: ButtonBigVariant): string {
  switch (stroke) {
    case "none":
      return "border-0"
    case "thin":
      return "border"
    case "thick":
    default:
      return "border-2"
  }
}

export default function ButtonBig({
  variant = "black",
  fullWidth = false,
  stroke = "thick",
  leftIcon,
  rightIcon,
  className,
  children,
  weight,
  ...props
}: ButtonBigProps) {
  const effectiveWeight = (() => {
    if (typeof weight === 'string') return weight
    return 'normal'
  })()

  const classes = twMerge(
    clsx(
      // Sharp edges, consistent sizing and type, Space Grotesk
      "inline-flex items-center justify-center gap-3 font-heading tracking-wide rounded-none transition-colors px-6 py-3 text-base leading-none disabled:opacity-50 disabled:cursor-not-allowed",
      effectiveWeight === 'heavy' ? 'font-bold' : 'font-normal',
      fullWidth && "w-full",
      getVariantClasses(variant),
      getStrokeClasses(stroke, variant),
      className
    )
  )

  return (
    <button className={classes} {...props}>
      {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
    </button>
  )
}


