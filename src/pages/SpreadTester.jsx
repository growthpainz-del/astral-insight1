import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPageUrl } from "@/utils";
import { ArrowLeft, RefreshCw, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SpreadTester() {
  const [spreads, setSpreads] = useState([]);
  const [selectedSpreadId, setSelectedSpreadId] = useState("");
  const [spread, setSpread] = useState(null);
  
  // mock deck of cards
  const [shelfCards, setShelfCards] = useState([]);
  const [slotCards, setSlotCards] = useState({}); // mapping of slotIndex -> card object

  useEffect(() => {
    (async () => {
      try {
        const allSpreads = await base44.entities.Spread.list();
        setSpreads(allSpreads || []);
        if (allSpreads?.length > 0) {
          setSelectedSpreadId(allSpreads[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch spreads", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedSpreadId) {
      const selected = spreads.find(s => s.id === selectedSpreadId);
      setSpread(selected);
      resetTester(selected);
    }
  }, [selectedSpreadId, spreads]);

  const resetTester = (currentSpread) => {
    // Generate mock cards
    const mock = Array.from({ length: 15 }).map((_, i) => ({
      id: `mock-card-${i}`,
      name: `Card ${i + 1}`,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black text-white p-4 md:p-8 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Studio")}>
              <Button variant="ghost" className="text-purple-300 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Studio
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              Spread Tester
            </h1>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Select value={selectedSpreadId} onValueChange={setSelectedSpreadId}>
              <SelectTrigger className="w-full md:w-64 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select a spread" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/20 text-white">
                {spreads.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => resetTester(spread)} variant="outline" className="border-white/20 shrink-0">
              <RefreshCw className="w-4 h-4 mr-2" /> Reset
            </Button>
          </div>
        </div>

        {/* Drag and Drop Area */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-[600px] touch-none">
            {/* Shelf */}
            <div className="lg:w-72 flex-shrink-0 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-purple-300 flex items-center gap-2">
                <Layers className="w-5 h-5" /> Cards
              </h2>
              <Droppable droppableId="shelf" direction="vertical">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto min-h-[200px] p-2 rounded-xl transition-colors ${
                      snapshot.isDraggingOver ? "bg-white/10" : ""
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      {shelfCards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`w-full aspect-[2/3] rounded-lg overflow-hidden border-2 shadow-lg transition-transform ${
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

            {/* Board */}
            <div className="flex-1 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center p-8">
              {spread ? (
                <div className="relative w-full h-full max-w-4xl aspect-square md:aspect-[4/3] mx-auto border border-white/5 rounded-xl">
                  {spread.positions.map((pos, index) => {
                    const hasCard = !!slotCards[index];
                    return (
                      <div
                        key={index}
                        className="absolute w-24 sm:w-32 aspect-[2/3] -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
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
                                ${snapshot.isDraggingOver ? "border-cyan-400 bg-cyan-500/20 scale-110" : hasCard ? "border-transparent" : "border-white/30 bg-white/5"}
                              `}
                            >
                              {!hasCard && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 opacity-50 pointer-events-none">
                                  <span className="text-xs font-bold text-white mb-1 shadow-black drop-shadow-md">{pos.name}</span>
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
                                          className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none flex items-end p-2"
                                        >
                                          <span className="text-[10px] leading-tight text-white font-semibold shadow-black drop-shadow-md text-center w-full">
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
              ) : (
                <div className="text-white/50 text-xl flex flex-col items-center">
                  <Layers className="w-16 h-16 mb-4 opacity-50" />
                  Select a spread to start testing
                </div>
              )}
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}