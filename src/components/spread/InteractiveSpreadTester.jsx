import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { Layers } from "lucide-react";

export default function InteractiveSpreadTester({ positions }) {
  const [shelfCards, setShelfCards] = useState([]);
  const [slotCards, setSlotCards] = useState({});

  useEffect(() => {
    resetTester();
  }, [positions]);

  const resetTester = () => {
    // Generate mock cards for testing
    const mock = Array.from({ length: Math.max(10, positions.length * 2) }).map((_, i) => ({
      id: `mock-card-${i}`,
      name: `Test Card ${i + 1}`,
      image_url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=600&fit=crop&q=80"
    }));
    setShelfCards(mock);
    setSlotCards({});
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId) return;

    let draggedCard;
    const newShelf = [...shelfCards];
    const newSlots = { ...slotCards };

    // Extract dragged card from source
    if (source.droppableId === "shelf") {
      const idx = newShelf.findIndex(c => c.id === draggableId);
      draggedCard = newShelf[idx];
      newShelf.splice(idx, 1);
    } else {
      const sourceSlot = source.droppableId.replace("slot-", "");
      draggedCard = newSlots[sourceSlot];
      delete newSlots[sourceSlot];
    }

    // Place dragged card into destination
    if (destination.droppableId === "shelf") {
      newShelf.splice(destination.index, 0, draggedCard);
    } else {
      const destSlot = destination.droppableId.replace("slot-", "");
      // if slot already has a card, swap it back to shelf
      if (newSlots[destSlot]) {
        newShelf.push(newSlots[destSlot]);
      }
      newSlots[destSlot] = draggedCard;
    }

    setShelfCards(newShelf);
    setSlotCards(newSlots);
  };

  if (!positions || positions.length === 0) {
    return (
      <div className="text-white/50 text-xl flex flex-col items-center p-8">
        <Layers className="w-16 h-16 mb-4 opacity-50" />
        Add positions to test your layout
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col xl:flex-row gap-6 w-full h-full min-h-[500px] touch-none">
        {/* Board */}
        <div className="flex-1 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-2xl aspect-square md:aspect-[4/3] mx-auto border border-white/5 rounded-xl">
            {positions.map((pos, index) => {
              const hasCard = !!slotCards[index];
              return (
                <div
                  key={index}
                  className="absolute w-20 sm:w-24 aspect-[2/3] -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: `translate(-50%, -50%) rotate(${pos.rotation || 0}deg)`,
                  }}
                >
                  <Droppable droppableId={`slot-${index}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`w-full h-full rounded-lg border-2 border-dashed transition-all duration-300 flex items-center justify-center relative
                          ${snapshot.isDraggingOver ? "border-cyan-400 bg-cyan-500/20 scale-110 z-20" : hasCard ? "border-transparent" : "border-white/30 bg-white/5"}
                        `}
                      >
                        {!hasCard && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1 opacity-50 pointer-events-none">
                            <span className="text-[10px] font-bold text-white mb-1 shadow-black drop-shadow-md leading-tight">{pos.name}</span>
                          </div>
                        )}
                        
                        <AnimatePresence>
                          {hasCard && (
                            <Draggable key={slotCards[index].id} draggableId={slotCards[index].id} index={0}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`absolute inset-0 rounded-lg overflow-hidden border-2 shadow-xl ${
                                    snapshot.isDragging ? "border-purple-400 scale-110 z-50" : "border-cyan-400/80 shadow-cyan-500/30"
                                  }`}
                                >
                                  <motion.img
                                    initial={{ scale: 0.5, opacity: 0, filter: 'brightness(2) blur(10px)' }}
                                    animate={{ scale: 1, opacity: 1, filter: 'brightness(1) blur(0px)' }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    src={slotCards[index].image_url}
                                    alt={slotCards[index].name}
                                    className="w-full h-full object-cover pointer-events-none"
                                  />
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none flex items-end p-1"
                                  >
                                    <span className="text-[9px] leading-tight text-white font-semibold shadow-black drop-shadow-md text-center w-full">
                                      {pos.name}
                                    </span>
                                  </motion.div>
                                </div>
                              )}
                            </Draggable>
                          )}
                        </AnimatePresence>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shelf */}
        <div className="xl:w-64 flex-shrink-0 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col h-64 xl:h-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Deck
            </h2>
            <button onClick={resetTester} className="text-xs text-white/50 hover:text-white">Reset</button>
          </div>
          <Droppable droppableId="shelf" direction="horizontal" isDropDisabled={false}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-1 overflow-auto p-2 rounded-xl transition-colors flex xl:flex-col gap-3 content-start flex-wrap xl:flex-nowrap ${
                  snapshot.isDraggingOver ? "bg-white/10" : ""
                }`}
              >
                <div className="flex xl:grid xl:grid-cols-2 gap-3 w-max xl:w-full">
                  {shelfCards.map((card, index) => (
                    <Draggable key={card.id} draggableId={card.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`w-16 xl:w-full aspect-[2/3] shrink-0 rounded-lg overflow-hidden border-2 shadow-lg transition-transform ${
                            snapshot.isDragging ? "border-purple-400 scale-110 z-50 shadow-purple-500/50" : "border-white/20 hover:border-white/40"
                          }`}
                        >
                          <img src={card.image_url} alt={card.name} className="w-full h-full object-cover pointer-events-none" />
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

      </div>
    </DragDropContext>
  );
}