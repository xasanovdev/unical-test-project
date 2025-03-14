"use client"

import { useRef, useEffect } from "react"

// Sample data for the diagram
const data = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 300 },
  { name: "Mar", value: 600 },
  { name: "Apr", value: 800 },
  { name: "May", value: 500 },
  { name: "Jun", value: 900 },
  { name: "Jul", value: 700 },
]

export default function DiagramComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Draw chart
    const maxValue = Math.max(...data.map((item) => item.value))
    const barWidth = rect.width / data.length - 10
    const barHeightRatio = (rect.height - 60) / maxValue

    // Draw bars
    data.forEach((item, index) => {
      const x = index * (barWidth + 10) + 5
      const barHeight = item.value * barHeightRatio
      const y = rect.height - barHeight - 30

      // Draw bar
      ctx.fillStyle = "#8884d8"
      ctx.fillRect(x, y, barWidth, barHeight)

      // Draw label
      ctx.fillStyle = "#333"
      ctx.font = "10px Arial"
      ctx.textAlign = "center"
      ctx.fillText(item.name, x + barWidth / 2, rect.height - 15)

      // Draw value
      ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5)
    })

    // Draw axes
    ctx.strokeStyle = "#ccc"
    ctx.beginPath()
    ctx.moveTo(0, rect.height - 30)
    ctx.lineTo(rect.width, rect.height - 30)
    ctx.stroke()
  }, [])

  return (
    <div className="w-full h-full p-4 flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full" style={{ maxHeight: "100%" }} />
    </div>
  )
}

