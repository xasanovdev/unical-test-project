"use client"

import { useRef, useState } from "react"
import { BarChart4 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Header from "@/components/header"
import BlockComponent from "./block-card"

// Block types
export type BlockType = "image" | "diagram"

// Block interface
export interface Block {
  id: string
  type: BlockType
  content: string
  position: { x: number; y: number }
  size: { width: number; height: number }
}

// Direction enum for block relationships
export enum Direction {
  None = "none",
  Right = "right",
  Below = "below",
  Left = "left",
  Above = "above",
}

// Constants
const BLOCK_GAP = 20 // Gap between blocks in pixels
const DEFAULT_BLOCK_WIDTH = 300
const DEFAULT_BLOCK_HEIGHT = 200

export default function DashboardBuilder() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newBlockType, setNewBlockType] = useState<BlockType>("image")
  const [imageUrl, setImageUrl] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)

  const findFreePositionForNewBlock = (block: Block) => {
  }


  // add block
  const addBlock = () => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type: newBlockType,
      content: imageUrl,
      position: { x: 0, y: 0 },
      size: { width: DEFAULT_BLOCK_WIDTH, height: DEFAULT_BLOCK_HEIGHT },
    }

    setBlocks([...blocks, newBlock])
    setShowAddDialog(false)
  }

  // remove block
  const removeBlock = (id: string) => {
    const updatedBlocks = blocks.filter((block) => block.id !== id)
    setBlocks(updatedBlocks)
  }

  const updateBlockSize = (id: string, size: { width: number; height: number }) => {
    const updatedBlocks = blocks.map((block) => (block.id === id ? { ...block, size } : block))

    setBlocks(updatedBlocks)
  }

  const updateBlockPosition = (id: string, position: { x: number; y: number }) => {
    console.log(position)
    
    const updatedBlocks = blocks.map((block) => (block.id === id ? { ...block, position } : block))

    setBlocks(updatedBlocks)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header username="John Doe" />

      <main className="flex-1 container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard Builder</h1>
          
          <Button onClick={() => setShowAddDialog(true)}>Add Block</Button>
        </div>

        <div className="flex" ref={containerRef}>
          {
            blocks.map((block) => (
              <BlockComponent
                key={block.id}
                block={block}
                editMode={true}
                containerRef={containerRef}
                isSelected={block.id === selectedBlock?.id}
                onPositionChange={(position) => updateBlockPosition(block.id, position)}
                onSelect={() => setSelectedBlock(block)}
                onRemove={() => removeBlock(block.id)}
                onSizeChange={(size) => updateBlockSize(block.id, size)}
                blockGap={DEFAULT_BLOCK_WIDTH}
              />
            ))
          }
        </div>
      </main>

      {/* Add Block Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Block</DialogTitle>
            <DialogDescription>Choose the type of block you want to add to your dashboard.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue={newBlockType} onValueChange={(value) => setNewBlockType(value as BlockType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image">Image</TabsTrigger>
              <TabsTrigger value="diagram">Diagram</TabsTrigger>
            </TabsList>
            <TabsContent value="image" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  placeholder="Enter image URL or leave empty for placeholder"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              {imageUrl && (
                <div className="border rounded-md p-2 mt-2">
                  <img
                    src={imageUrl || "/placeholder.svg"}
                    alt="Preview"
                    className="max-h-40 mx-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=150&width=200"
                    }}
                  />
                </div>
              )}
            </TabsContent>
            <TabsContent value="diagram" className="pt-4">
              <div className="text-center p-4 border rounded-md">
                <BarChart4 className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                <p>A sample diagram will be added to your dashboard.</p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addBlock}>Add Block</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      {/* <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center flex-col p-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-center">Successfully Saved!</h2>
            <p className="text-center text-gray-500 mt-2">Your dashboard has been saved successfully.</p>
          </div>
        </DialogContent>
      </Dialog> */}
    </div>
  )
}

