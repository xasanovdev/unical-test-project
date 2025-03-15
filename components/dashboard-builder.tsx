"use client";

import { useRef, useState } from "react";
import { BarChart4 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/header";
import BlockComponent from "./block-card";

// Block types
export type BlockType = "image" | "diagram";

// Block interface
export interface Block {
  id: string;
  type: BlockType;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
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
const BLOCK_GAP = 20; // Gap between blocks in pixels
const DEFAULT_BLOCK_WIDTH = 300;
const DEFAULT_BLOCK_HEIGHT = 200;

export default function DashboardBuilder() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newBlockType, setNewBlockType] = useState<BlockType>("image");
  const [imageUrl, setImageUrl] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [movingBlockId, setMovingBlockId] = useState<string | null>(null);

  const blocksOverlap = (block1: Block, block2: Block) => {
    // Check if the blocks are too close horizontally and vertically
    return (
      // Check horizontal proximity - adding BLOCK_GAP to create buffer zone
      block1.position.x < block2.position.x + block2.size.width + BLOCK_GAP &&
      block1.position.x + block1.size.width + BLOCK_GAP > block2.position.x &&
      // Check vertical proximity - adding BLOCK_GAP to create buffer zone
      block1.position.y < block2.position.y + block2.size.height + BLOCK_GAP &&
      block1.position.y + block1.size.height + BLOCK_GAP > block2.position.y
    );
  };

  const findFreePositionForNewBlock = (
    newBlock: Block,
  ): { x: number; y: number } => {
    let containerWidth = containerRef.current?.clientWidth || 800;
    let containerHeight = containerRef.current?.clientHeight || 600;

    // Start at top left with a margin
    let bestPosition = { x: BLOCK_GAP, y: BLOCK_GAP };

    // If no blocks, return the initial position
    if (blocks.length === 0) return bestPosition;

    // Find the currently occupied vertical space first
    let highestOccupiedY = 0;
    blocks.forEach((block) => {
      const blockBottom = block.position.y + block.size.height;
      if (blockBottom > highestOccupiedY) {
        highestOccupiedY = blockBottom;
      }
    });

    // Try grid positions until finding a free spot
    const gridSize = BLOCK_GAP;

    // Enhanced attempt search with gap calculations
    const attemptSearch = () => {
      const maxX = containerWidth - newBlock.size.width - BLOCK_GAP;
      const maxY = containerHeight - newBlock.size.height - BLOCK_GAP;

      for (let y = BLOCK_GAP; y <= maxY; y += gridSize) {
        for (let x = BLOCK_GAP; x <= maxX; x += gridSize) {
          // Initial position to test
          let posX = x;
          let posY = y;
          let adjustedPosition = false;

          // Check for blocks above and to the left and adjust position if needed
          blocks.forEach((block) => {
            const blockRight = block.position.x + block.size.width;
            const blockBottom = block.position.y + block.size.height;

            // If there's a block directly above
            if (
              blockBottom <= posY &&
              blockBottom + BLOCK_GAP > posY &&
              block.position.x < posX + newBlock.size.width &&
              blockRight > posX
            ) {
              posY = blockBottom + BLOCK_GAP;
              adjustedPosition = true;
            }

            // If there's a block directly to the left
            if (
              blockRight <= posX &&
              blockRight + BLOCK_GAP > posX &&
              block.position.y < posY + newBlock.size.height &&
              blockBottom > posY
            ) {
              posX = blockRight + BLOCK_GAP;
              adjustedPosition = true;
            }
          });

          // Skip if adjusted position is out of bounds
          if (posX > maxX || posY > maxY) continue;

          // Test the position (original or adjusted)
          const testBlock = {
            ...newBlock,
            position: { x: posX, y: posY },
          };

          // Check if this position overlaps with any existing block
          let overlaps = false;
          for (const block of blocks) {
            if (blocksOverlap(testBlock, block)) {
              overlaps = true;
              break;
            }
          }

          if (!overlaps) {
            return { x: posX, y: posY };
          }
        }
      }
      return null;
    };

    // First attempt
    let position = attemptSearch();
    if (position) return position;

    // If no position found, expand container and try again
    const neededExtraHeight = newBlock.size.height + BLOCK_GAP * 2;
    const newContainerHeight = highestOccupiedY + neededExtraHeight;

    // Only expand if needed
    if (newContainerHeight > containerHeight) {
      containerRef.current!.style.height = newContainerHeight + "px";
      containerHeight = newContainerHeight;

      // Try search again with new height
      position = attemptSearch();
      if (position) return position;
    }

    // Last resort - place below all existing blocks
    return {
      x: BLOCK_GAP,
      y: highestOccupiedY + BLOCK_GAP,
    };
  };

  // add block
  const addBlock = () => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type: newBlockType,
      content: imageUrl,
      position: { x: BLOCK_GAP, y: BLOCK_GAP }, // Temporary position
      size: { width: DEFAULT_BLOCK_WIDTH, height: DEFAULT_BLOCK_HEIGHT },
    };

    // Find a free position for the new block
    newBlock.position = findFreePositionForNewBlock(newBlock);

    setBlocks([...blocks, newBlock]);
    setSelectedBlock(newBlock);
    setShowAddDialog(false);
    setImageUrl("");
  };

  // remove block
  const removeBlock = (id: string) => {
    const updatedBlocks = blocks.filter((block) => block.id !== id);
    setBlocks(updatedBlocks);
  };

  const updateBlockSize = (
    id: string,
    newSize: { width: number; height: number },
  ) => {
    const blockToResize = blocks.find((block) => block.id === id);
    if (!blockToResize) return;

    const resizedBlock: Block = { ...blockToResize, size: newSize };
    let updatedBlocks = blocks.map((block) =>
      block.id === id ? resizedBlock : block,
    );

    const queue: Block[] = updatedBlocks.filter(
      (block) => block.id !== id && blocksOverlap(resizedBlock, block),
    );
    const processedBlockIds = new Set<string>([id]);

    while (queue.length > 0) {
      const affectedBlock = queue.shift()!;
      if (processedBlockIds.has(affectedBlock.id)) continue;

      processedBlockIds.add(affectedBlock.id);

      const direction = determineOverlapDirection(resizedBlock, affectedBlock);
      const positionResult = calculateNewPosition(
        resizedBlock,
        affectedBlock,
        direction,
      );

      let updatedBlock = { ...affectedBlock, position: positionResult };

      // If the position calculation suggests a size adjustment
      if (positionResult.adjustedSize) {
        updatedBlock = {
          ...updatedBlock,
          size: positionResult.adjustedSize,
        };
      }

      updatedBlocks = updatedBlocks.map((block) =>
        block.id === affectedBlock.id ? updatedBlock : block,
      );

      const newOverlaps = updatedBlocks.filter(
        (block) =>
          !processedBlockIds.has(block.id) &&
          blocksOverlap(updatedBlock, block),
      );
      queue.push(...newOverlaps);
    }

    setBlocks(updatedBlocks);
  };

  // Helper function to determine the best direction to move an overlapping block
  const determineOverlapDirection = (
    resizedBlock: Block,
    affectedBlock: Block,
  ): Direction => {
    // Calculate overlap amounts in each direction
    const overlapRight =
      resizedBlock.position.x +
      resizedBlock.size.width -
      affectedBlock.position.x;
    const overlapBelow =
      resizedBlock.position.y +
      resizedBlock.size.height -
      affectedBlock.position.y;
    const overlapLeft =
      affectedBlock.position.x +
      affectedBlock.size.width -
      resizedBlock.position.x;
    const overlapAbove =
      affectedBlock.position.y +
      affectedBlock.size.height -
      resizedBlock.position.y;

    // Find the smallest overlap - that's the direction that requires the least movement
    const minOverlap = Math.min(
      overlapRight,
      overlapBelow,
      overlapLeft,
      overlapAbove,
    );

    // Return the direction with minimum overlap
    if (minOverlap === overlapRight && overlapRight > 0) return Direction.Right;
    if (minOverlap === overlapBelow && overlapBelow > 0) return Direction.Below;
    if (minOverlap === overlapLeft && overlapLeft > 0) return Direction.Left;
    if (minOverlap === overlapAbove && overlapAbove > 0) return Direction.Above;

    // Default to Right if something goes wrong
    return Direction.Right;
  };

  // Helper function to calculate new position based on overlap direction
  // First, let's create a unified calculate new position function
  const calculateNewPosition = (
    activeBlock: Block,
    affectedBlock: Block,
    direction: Direction,
  ): {
    x: number;
    y: number;
    adjustedSize?: { width: number; height: number };
  } => {
    const { x, y } = affectedBlock.position;
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 600;

    // Check if blocks can swap positions without creating new overlaps
    const canSwapPositions = !blocks.some((block) => {
      if (block.id === activeBlock.id || block.id === affectedBlock.id)
        return false;

      return (
        blocksOverlap(
          { ...affectedBlock, position: activeBlock.position },
          block,
        ) ||
        blocksOverlap(
          { ...activeBlock, position: affectedBlock.position },
          block,
        )
      );
    });

    // Try swapping positions if that would resolve the overlap
    // and both blocks would fit in their new positions
    if (
      canSwapPositions &&
      activeBlock.position.x >= BLOCK_GAP &&
      activeBlock.position.y >= BLOCK_GAP &&
      activeBlock.position.x + affectedBlock.size.width <=
        containerWidth - BLOCK_GAP &&
      activeBlock.position.y + affectedBlock.size.height <=
        containerHeight - BLOCK_GAP
    ) {
      // Return active block's position for the affected block
      return activeBlock.position;
    }

    // Calculate positions based on direction
    let newPosition = { x, y };

    switch (direction) {
      case Direction.Right:
        newPosition = {
          x: activeBlock.position.x + activeBlock.size.width + BLOCK_GAP,
          y,
        };
        break;
      case Direction.Below:
        newPosition = {
          x,
          y: activeBlock.position.y + activeBlock.size.height + BLOCK_GAP,
        };
        break;
      case Direction.Left:
        newPosition = {
          x: activeBlock.position.x - affectedBlock.size.width - BLOCK_GAP,
          y,
        };
        break;
      case Direction.Above:
        newPosition = {
          x,
          y: activeBlock.position.y - affectedBlock.size.height - BLOCK_GAP,
        };
        break;
    }

    // Check if the new position keeps the block within container bounds
    const rightEdge = newPosition.x + affectedBlock.size.width;
    const bottomEdge = newPosition.y + affectedBlock.size.height;

    // If the new position would put the block outside container bounds
    if (newPosition.x < BLOCK_GAP || rightEdge > containerWidth - BLOCK_GAP) {
      // Check if resizing the block would help it fit
      if (
        direction === Direction.Right &&
        rightEdge > containerWidth - BLOCK_GAP
      ) {
        // Calculate the maximum width that would fit
        const maxWidth = containerWidth - BLOCK_GAP - newPosition.x;

        // Only resize if it doesn't make the block too small (e.g., maintain at least 100px)
        if (maxWidth >= 100) {
          return {
            x: newPosition.x,
            y: newPosition.y,
            adjustedSize: {
              width: maxWidth,
              height: affectedBlock.size.height,
            },
          };
        }
      }

      // Try to find a position at the top first
      const topPosition = {
        x: BLOCK_GAP,
        y: BLOCK_GAP,
      };

      // Check if there's enough space at the top
      let canPlaceAtTop = true;
      for (const block of blocks) {
        if (
          block.id !== affectedBlock.id &&
          blocksOverlap({ ...affectedBlock, position: topPosition }, block)
        ) {
          canPlaceAtTop = false;
          break;
        }
      }

      if (canPlaceAtTop) {
        return topPosition;
      }

      // If not at top, try to place below all blocks
      const highestY = Math.max(
        ...blocks.map((b) => b.position.y + b.size.height),
        0,
      );
      newPosition = {
        x: BLOCK_GAP,
        y: highestY + BLOCK_GAP,
      };
    }

    // Check if this new position overlaps with any other block
    const wouldOverlap = blocks.some((block) => {
      return (
        block.id !== affectedBlock.id &&
        block.id !== activeBlock.id &&
        blocksOverlap({ ...affectedBlock, position: newPosition }, block)
      );
    });

    // If there would be a new overlap, move below all blocks
    if (wouldOverlap) {
      const highestY = Math.max(
        ...blocks.map((b) => b.position.y + b.size.height),
        0,
      );
      newPosition = {
        x: BLOCK_GAP,
        y: highestY + BLOCK_GAP,
      };
    }

    // Check if we need to expand the container height
    const newBottomEdge = newPosition.y + affectedBlock.size.height;
    if (newBottomEdge > containerHeight - BLOCK_GAP) {
      const newContainerHeight = newBottomEdge + BLOCK_GAP * 2;

      // Expand the container height
      if (containerRef.current) {
        containerRef.current.style.height = `${newContainerHeight}px`;
      }
    }

    return newPosition;
  };
  const updateBlockPosition = (
    id: string,
    newPosition: { x: number; y: number },
  ) => {
    setMovingBlockId(id);

    const blockToMove = blocks.find((block) => block.id === id);
    if (!blockToMove) {
      setMovingBlockId(null);
      return;
    }

    // First, constrain the moved block to stay within container bounds
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 600;

    const constrainedPosition = {
      x: Math.max(
        BLOCK_GAP,
        Math.min(
          newPosition.x,
          containerWidth - blockToMove.size.width - BLOCK_GAP,
        ),
      ),
      y: Math.max(
        BLOCK_GAP,
        Math.min(
          newPosition.y,
          containerHeight - blockToMove.size.height - BLOCK_GAP,
        ),
      ),
    };

    const movedBlock: Block = { ...blockToMove, position: constrainedPosition };
    let updatedBlocks = blocks.map((block) =>
      block.id === id ? movedBlock : block,
    );

    // Find blocks that overlap with the moved block
    const overlappingBlocks = updatedBlocks.filter(
      (block) => block.id !== id && blocksOverlap(movedBlock, block),
    );

    // Process all overlapping blocks
    const queue = [...overlappingBlocks];
    const processedBlockIds = new Set<string>([id]);

    while (queue.length > 0) {
      const affectedBlock = queue.shift()!;
      if (processedBlockIds.has(affectedBlock.id)) continue;

      processedBlockIds.add(affectedBlock.id);

      // Determine best direction to move this block
      const direction = determineMovementDirection(
        blockToMove,
        movedBlock,
        affectedBlock,
      );

      // Calculate new position with potential size adjustment
      const positionResult = calculateNewPosition(
        movedBlock,
        affectedBlock,
        direction,
      );

      let updatedBlock = { ...affectedBlock, position: positionResult };

      // If the position calculation suggests a size adjustment
      if (positionResult.adjustedSize) {
        updatedBlock = {
          ...updatedBlock,
          size: positionResult.adjustedSize,
        };
      }

      updatedBlocks = updatedBlocks.map((block) =>
        block.id === affectedBlock.id ? updatedBlock : block,
      );

      // Check for new overlaps after moving this block
      const newOverlaps = updatedBlocks.filter(
        (block) =>
          !processedBlockIds.has(block.id) &&
          blocksOverlap(updatedBlock, block),
      );
      queue.push(...newOverlaps);
    }

    setBlocks(updatedBlocks);
    setMovingBlockId(null);
  };

  // Helper function to determine the direction of movement and best push direction
  const determineMovementDirection = (
    originalBlock: Block,
    movedBlock: Block,
    affectedBlock: Block,
  ): Direction => {
    // Get container dimensions
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 600;

    // Check if affected block is at container edges
    const blockAtRightEdge =
      affectedBlock.position.x + affectedBlock.size.width + BLOCK_GAP >=
      containerWidth;
    const blockAtBottomEdge =
      affectedBlock.position.y + affectedBlock.size.height + BLOCK_GAP >=
      containerHeight;
    const blockAtLeftEdge = affectedBlock.position.x <= BLOCK_GAP;
    const blockAtTopEdge = affectedBlock.position.y <= BLOCK_GAP;

    // Determine the primary direction of movement
    const moveRight = movedBlock.position.x > originalBlock.position.x;
    const moveLeft = movedBlock.position.x < originalBlock.position.x;
    const moveDown = movedBlock.position.y > originalBlock.position.y;
    const moveUp = movedBlock.position.y < originalBlock.position.y;

    // Calculate overlap amounts in each direction
    const overlapRight =
      movedBlock.position.x + movedBlock.size.width - affectedBlock.position.x;
    const overlapBelow =
      movedBlock.position.y + movedBlock.size.height - affectedBlock.position.y;
    const overlapLeft =
      affectedBlock.position.x +
      affectedBlock.size.width -
      movedBlock.position.x;
    const overlapAbove =
      affectedBlock.position.y +
      affectedBlock.size.height -
      movedBlock.position.y;

    // Find the smallest overlap - that's the direction that requires the least movement
    const minOverlap = Math.min(
      overlapRight,
      overlapBelow,
      overlapLeft,
      overlapAbove,
    );

    // First, check if moving in the direction of the user's drag is feasible
    // considering container boundaries
    if (moveRight && !blockAtRightEdge && overlapRight > 0)
      return Direction.Right;
    if (moveDown && !blockAtBottomEdge && overlapBelow > 0)
      return Direction.Below;
    if (moveLeft && !blockAtLeftEdge && overlapLeft > 0) return Direction.Left;
    if (moveUp && !blockAtTopEdge && overlapAbove > 0) return Direction.Above;

    // If we can't move in the direction of the user's drag due to container boundaries,
    // try to find the best alternative direction based on the minimum overlap
    // and container constraints

    // Check right direction
    if (minOverlap === overlapRight && overlapRight > 0 && !blockAtRightEdge)
      return Direction.Right;

    // Check below direction
    if (minOverlap === overlapBelow && overlapBelow > 0 && !blockAtBottomEdge)
      return Direction.Below;

    // Check left direction
    if (minOverlap === overlapLeft && overlapLeft > 0 && !blockAtLeftEdge)
      return Direction.Left;

    // Check above direction
    if (minOverlap === overlapAbove && overlapAbove > 0 && !blockAtTopEdge)
      return Direction.Above;

    // If we get here, we need to find an alternative direction that works with container bounds
    // Try all directions that don't hit container boundaries

    if (overlapRight > 0 && !blockAtRightEdge) return Direction.Right;
    if (overlapBelow > 0 && !blockAtBottomEdge) return Direction.Below;
    if (overlapLeft > 0 && !blockAtLeftEdge) return Direction.Left;
    if (overlapAbove > 0 && !blockAtTopEdge) return Direction.Above;

    // If all directions hit boundaries, we need to find the most feasible one
    // Choose based on smallest overlap (even if at boundary)
    if (minOverlap === overlapRight && overlapRight > 0) return Direction.Right;
    if (minOverlap === overlapBelow && overlapBelow > 0) return Direction.Below;
    if (minOverlap === overlapLeft && overlapLeft > 0) return Direction.Left;
    if (minOverlap === overlapAbove && overlapAbove > 0) return Direction.Above;

    // Default to Right if something goes wrong
    return Direction.Right;
  };
  return (
    <div className="flex flex-col min-h-screen h-full">
      <Header username="Xasanov Ibrohim" />

      <main className="flex-1 h-full container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard Builder</h1>

          <Button onClick={() => setShowAddDialog(true)}>Add Block</Button>
        </div>

        <div
          className="flex-1 bg-gray-50 border shrink-0 grow border-dashed border-gray-300 rounded-lg h-full min-h-[600px] relative"
          ref={containerRef}
        >
          {blocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              No blocks in dashboard
            </div>
          )}

          {blocks.map((block) => (
            <BlockComponent
              key={block.id}
              block={block}
              editMode={true}
              containerRef={containerRef}
              isMoving={block.id === movingBlockId}
              isSelected={block.id === selectedBlock?.id}
              onPositionChange={(position) =>
                updateBlockPosition(block.id, position)
              }
              onSelect={() => setSelectedBlock(block)}
              onRemove={() => removeBlock(block.id)}
              onSizeChange={(size) => updateBlockSize(block.id, size)}
              blockGap={BLOCK_GAP}
            />
          ))}
        </div>
      </main>

      {/* Add Block Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Block</DialogTitle>
            <DialogDescription>
              Choose the type of block you want to add to your dashboard.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            defaultValue={newBlockType}
            onValueChange={(value) => setNewBlockType(value as BlockType)}
          >
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
                      e.currentTarget.src =
                        "/placeholder.svg?height=150&width=200";
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
  );
}
