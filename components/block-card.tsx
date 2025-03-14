"use client"

import type React from "react"

import { useState, useRef, useEffect, type RefObject } from "react"
import { X, Move } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Block } from "./dashboard-builder"
import DiagramComponent from "./diagram"

interface BlockComponentProps {
  block: Block
  isSelected: boolean
  isResizing?: boolean
  isMoving?: boolean
  onSelect: () => void
  onRemove: () => void
  onPositionChange: (position: { x: number; y: number }) => void
  onSizeChange: (size: { width: number; height: number }) => void
  editMode: boolean
  containerRef: RefObject<HTMLDivElement | null>
  blockGap: number
}

export default function BlockComponent({
  block,
  isSelected,
  isResizing = false,
  isMoving = false,
  onSelect,
  onRemove,
  onPositionChange,
  onSizeChange,
  editMode,
  containerRef,
  blockGap,
}: BlockComponentProps) {
  const [isDragging, setIsDragging] = useState(false)
  const blockRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: block.position.x, y: block.position.y })
  const [size, setSize] = useState({ width: block.size.width, height: block.size.height })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizing, setResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [resizeType, setResizeType] = useState<string | null>(null)

  // Update position and size when block props change
  useEffect(() => {
    setPosition({ x: block.position.x, y: block.position.y })
    setSize({ width: block.size.width, height: block.size.height })
  }, [block.position.x, block.position.y, block.size.width, block.size.height])

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editMode) return

    e.preventDefault()
    onSelect()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })

    // Add event listeners for drag
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // Handle mouse move for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const newX = Math.round((e.clientX - dragStart.x) / blockGap) * blockGap
    const newY = Math.round((e.clientY - dragStart.y) / blockGap) * blockGap

    // Validate position to stay within container and maintain minimum gap
    const containerWidth = containerRef.current?.clientWidth || 0
    const containerHeight = containerRef.current?.clientHeight || 0

    const validX = Math.max(blockGap, Math.min(newX, containerWidth - size.width - blockGap))
    const validY = Math.max(blockGap, Math.min(newY, containerHeight - size.height - blockGap))

    setPosition({ x: validX, y: validY })
  }

  // Handle mouse up for dragging
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)

      // Make sure we're using the latest position state
      // This ensures the parent component gets the most up-to-date position
      onPositionChange(position)

      // Remove event listeners
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    if (resizing) {
      setResizing(false)

      // Make sure we're using the latest size state
      // This ensures the parent component gets the most up-to-date size
      onSizeChange(size)

      // Remove event listeners
      document.removeEventListener("mousemove", handleResizeMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, type: string) => {
    if (!editMode) return

    e.preventDefault()
    e.stopPropagation()
    onSelect()
    setResizing(true)
    setResizeType(type)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    })

    // Add event listeners for resize
    document.addEventListener("mousemove", handleResizeMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // Handle resize move
  const handleResizeMove = (e: MouseEvent) => {
    if (!resizing) return

    const deltaX = e.clientX - resizeStart.x
    const deltaY = e.clientY - resizeStart.y

    // Round sizes to grid
    const newWidth = Math.round((resizeStart.width + deltaX) / blockGap) * blockGap
    const newHeight = Math.round((resizeStart.height + deltaY) / blockGap) * blockGap

    // Enforce minimum and maximum sizes
    const minSize = blockGap * 5 // Minimum 5 grid units
    const containerWidth = containerRef.current?.clientWidth || 0
    const containerHeight = containerRef.current?.clientHeight || 0

    const validWidth = Math.max(minSize, Math.min(newWidth, containerWidth - position.x - blockGap))
    const validHeight = Math.max(minSize, Math.min(newHeight, containerHeight - position.y - blockGap))

    // Only update if there's a change
    if (validWidth !== size.width || validHeight !== size.height) {
      setSize({ width: validWidth, height: validHeight })

      // Update parent component more frequently during resize
      // This ensures the cascade effect happens in real-time
      onSizeChange({ width: validWidth, height: validHeight })
    }
  }

  // Render resize handles
  const renderResizeHandles = () => {
    if (!editMode) return null

    return (
      <>
        {/* Bottom-right corner */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-10"
          onMouseDown={(e) => handleResizeStart(e, "bottom-right")}
        >
          <div className="absolute bottom-1 right-1 w-3 h-3 bg-primary rounded-sm opacity-70" />
        </div>

        {/* Bottom edge */}
        <div
          className="absolute bottom-0 left-6 right-6 h-3 cursor-s-resize z-10"
          onMouseDown={(e) => handleResizeStart(e, "bottom")}
        />

        {/* Right edge */}
        <div
          className="absolute top-6 bottom-6 right-0 w-3 cursor-e-resize z-10"
          onMouseDown={(e) => handleResizeStart(e, "right")}
        />
      </>
    )
  }

  return (
    <div
      ref={blockRef}
      className={`absolute ${isSelected && editMode ? "ring-2 ring-primary" : ""} ${isResizing || isMoving || isDragging ? "z-20" : ""}`}
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging || resizing ? "none" : "transform 0.1s ease",
        cursor: isDragging ? "grabbing" : editMode ? "grab" : "default",
      }}
      onClick={onSelect}
    >
      <Card className="w-full h-full overflow-hidden">
        {editMode && (
          <>
            {/* Drag handle */}
            <div className="absolute top-2 left-2 z-10 cursor-move" onMouseDown={handleMouseDown}>
              <Button variant="ghost" size="icon" className="h-6 w-6 bg-background/80 hover:bg-background">
                <Move className="h-4 w-4" />
              </Button>
            </div>

            {/* Remove button */}
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 bg-background/80 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Resize handles */}
            {renderResizeHandles()}
          </>
        )}

        <CardContent className="p-0 h-full flex items-center justify-center">
          {block.type === "image" ? (
            <img
              src={block.content || "/placeholder.svg?height=300&width=400"}
              alt="Block content"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=300&width=400"
              }}
            />
          ) : (
            <DiagramComponent />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

