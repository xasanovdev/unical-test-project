"use client"

import type React from "react"

import { useState, useRef, useEffect, type RefObject, useCallback } from "react"
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
  const blockRef = useRef<HTMLDivElement>(null)
  // Track if mouse is down independently from dragging state
  const isMouseDownRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: block.position.x, y: block.position.y })
  const [size, setSize] = useState({ width: block.size.width, height: block.size.height })
  const dragStartRef = useRef({ x: 0, y: 0 })
  const positionRef = useRef({ x: block.position.x, y: block.position.y })
  const sizeRef = useRef({ width: block.size.width, height: block.size.height })
  const [resizing, setResizing] = useState(false)
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 })
  const [resizeType, setResizeType] = useState<string | null>(null)

  // Update position and size when block props change
  useEffect(() => {
    setPosition({ x: block.position.x, y: block.position.y })
    positionRef.current = { x: block.position.x, y: block.position.y }
    setSize({ width: block.size.width, height: block.size.height })
    sizeRef.current = { width: block.size.width, height: block.size.height }
  }, [block.position.x, block.position.y, block.size.width, block.size.height])

  // Update refs when state changes
  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    sizeRef.current = size
  }, [size])

  // Define handler functions outside of event callbacks
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // First check the ref to see if mouse is down
    if (!isMouseDownRef.current || !isDragging) return

    const dragStart = dragStartRef.current
    
    const newX = Math.round((e.clientX - dragStart.x) / blockGap) * blockGap
    const newY = Math.round((e.clientY - dragStart.y) / blockGap) * blockGap

    // Validate position
    const containerWidth = containerRef.current?.clientWidth || 0
    const containerHeight = containerRef.current?.clientHeight || 0
    const currentSize = sizeRef.current

    const validX = Math.max(blockGap, Math.min(newX, containerWidth - currentSize.width - blockGap))
    const validY = Math.max(blockGap, Math.min(newY, containerHeight - currentSize.height - blockGap))

    const newPosition = { x: validX, y: validY }
    setPosition(newPosition)
    positionRef.current = newPosition
  }, [blockGap, containerRef, isDragging])

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isMouseDownRef.current || !resizing) return

    const resizeStart = resizeStartRef.current
    const currentPosition = positionRef.current

    const deltaX = e.clientX - resizeStart.x
    const deltaY = e.clientY - resizeStart.y

    // Round sizes to grid
    const newWidth = Math.round((resizeStart.width + deltaX) / blockGap) * blockGap
    const newHeight = Math.round((resizeStart.height + deltaY) / blockGap) * blockGap

    // Enforce minimum and maximum sizes
    const minSize = blockGap * 5
    const containerWidth = containerRef.current?.clientWidth || 0
    const containerHeight = containerRef.current?.clientHeight || 0

    const validWidth = Math.max(minSize, Math.min(newWidth, containerWidth - currentPosition.x - blockGap))
    const validHeight = Math.max(minSize, Math.min(newHeight, containerHeight - currentPosition.y - blockGap))

    const newSize = { width: validWidth, height: validHeight }
    setSize(newSize)
    sizeRef.current = newSize
    onSizeChange(newSize)
  }, [blockGap, containerRef, onSizeChange, resizing])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    // Reset the mouse down ref
    isMouseDownRef.current = false
    
    if (isDragging) {
      setIsDragging(false)
      onPositionChange(positionRef.current)
    }

    if (resizing) {
      setResizing(false)
      onSizeChange(sizeRef.current)
    }

    // Always remove event listeners regardless of state
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mousemove", handleResizeMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }, [handleMouseMove, handleResizeMove, isDragging, onPositionChange, onSizeChange, positionRef, resizing, sizeRef])

  // Register global event handlers once
  useEffect(() => {
    // Global handlers for mouse events - better than adding/removing every time
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMouseMove(e)
      } else if (resizing) {
        handleResizeMove(e)
      }
    }

    const handleGlobalMouseUp = (e: MouseEvent) => {
      handleMouseUp(e)
    }

    // Add listeners
    document.addEventListener("mousemove", handleGlobalMouseMove)
    document.addEventListener("mouseup", handleGlobalMouseUp)

    // Clean up
    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove)
      document.removeEventListener("mouseup", handleGlobalMouseUp)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mousemove", handleResizeMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp, handleResizeMove, isDragging, resizing])

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!editMode) return

    // Ensure the event is captured
    e.preventDefault()
    e.stopPropagation()
    
    // Set mouse down ref immediately
    isMouseDownRef.current = true
    
    onSelect()
    setIsDragging(true)

    const currentPosition = positionRef.current
    dragStartRef.current = {
      x: e.clientX - currentPosition.x,
      y: e.clientY - currentPosition.y,
    }
  }, [editMode, onSelect, positionRef])

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, type: string) => {
    if (!editMode) return

    e.preventDefault()
    e.stopPropagation()
    
    // Set mouse down ref immediately
    isMouseDownRef.current = true
    
    onSelect()
    setResizing(true)
    setResizeType(type)

    const currentSize = sizeRef.current
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: currentSize.width,
      height: currentSize.height,
    }
  }, [editMode, onSelect, sizeRef])

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
      className={`absolute ${isSelected && editMode ? "ring-2 ring-offset-2 rounded-lg ring-primary" : ""} ${isResizing || isMoving || isDragging ? "z-20" : "z-10"}`}
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging || resizing ? "none" : "transform 0.1s ease",
        cursor: isDragging ? "grabbing" : editMode ? "grab" : "default",
        willChange: "transform", // Optimize for performance
        touchAction: "none", // Prevents default touch actions
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <Card className="w-full h-full overflow-hidden">
        {editMode && (
          <>
            {/* Move handle redesigned for better hit target */}
            <div 
              className="absolute top-2 left-2 z-30 h-8 w-8 cursor-move bg-background/80 hover:bg-background rounded-md flex items-center justify-center"
              onMouseDown={handleMouseDown}
              onTouchStart={(e) => {
                // Touch support
                const touch = e.touches[0];
                handleMouseDown({
                  preventDefault: () => e.preventDefault(),
                  stopPropagation: () => e.stopPropagation(),
                  clientX: touch.clientX,
                  clientY: touch.clientY,
                } as unknown as React.MouseEvent)
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Move className="h-4 w-4" />
            </div>

            {/* Remove button */}
            <div className="absolute top-2 right-2 z-30">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-background/80 hover:bg-background"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove();
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
              className="w-full h-full object-cover pointer-events-none"
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