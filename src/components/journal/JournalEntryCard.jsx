import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  Edit,
  Trash2,
  Calendar,
  Tag,
  TrendingUp,
  Link as LinkIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function JournalEntryCard({ entry, onEdit, onDelete, onToggleFavorite }) {
  const moodColors = {
    hopeful: "bg-green-600/20 text-green-300",
    anxious: "bg-yellow-600/20 text-yellow-300",
    peaceful: "bg-blue-600/20 text-blue-300",
    confused: "bg-gray-600/20 text-gray-300",
    empowered: "bg-purple-600/20 text-purple-300",
    grateful: "bg-pink-600/20 text-pink-300",
    uncertain: "bg-amber-600/20 text-amber-300",
    inspired: "bg-cyan-600/20 text-cyan-300",
    reflective: "bg-indigo-600/20 text-indigo-300",
    other: "bg-slate-600/20 text-slate-300"
  };

  return (
    <Card className="bg-white/5 border border-white/10 hover:border-purple-400/40 transition-all">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">{entry.title}</h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-white/60">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(entry.date).toLocaleDateString()}
                </span>
                {entry.spread_type && (
                  <Badge className="bg-purple-600/20 text-purple-200 text-xs">
                    {entry.spread_type.replace(/_/g, ' ')}
                  </Badge>
                )}
                {entry.mood && (
                  <Badge className={`${moodColors[entry.mood] || moodColors.other} text-xs`}>
                    {entry.mood}
                  </Badge>
                )}
              </div>
            </div>
            
            <Button
              onClick={() => onToggleFavorite(entry)}
              variant="ghost"
              size="icon"
              className={entry.is_favorite ? "text-amber-400" : "text-white/40"}
            >
              <Star className={`w-5 h-5 ${entry.is_favorite ? "fill-current" : ""}`} />
            </Button>
          </div>

          {entry.question && (
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 mb-3">
              <p className="text-purple-200 italic text-sm">"{entry.question}"</p>
            </div>
          )}

          {/* Cards Drawn */}
          {entry.cards_drawn && entry.cards_drawn.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {entry.cards_drawn.slice(0, 5).map((card, i) => (
                  <Badge key={i} className="bg-cyan-600/20 text-cyan-200 text-xs">
                    {card.card_name}{card.is_reversed ? " ⟳" : ""}
                  </Badge>
                ))}
                {entry.cards_drawn.length > 5 && (
                  <Badge className="bg-white/10 text-white/60 text-xs">
                    +{entry.cards_drawn.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Entry Preview */}
          {entry.entry_content && (
            <p className="text-white/80 text-sm line-clamp-3 mb-3">
              {entry.entry_content}
            </p>
          )}

          {/* AI Themes */}
          {entry.ai_themes && entry.ai_themes.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-white/40">AI Themes:</span>
                {entry.ai_themes.slice(0, 3).map((theme, i) => (
                  <Badge key={i} className="bg-pink-600/20 text-pink-200 text-xs">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {entry.tags.map((tag, i) => (
                <Badge key={i} className="bg-white/10 text-white/70 text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Manifestation Rating */}
          {entry.manifestation_rating && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-white/60">Accuracy:</span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < entry.manifestation_rating
                        ? "text-amber-400 fill-current"
                        : "text-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Follow-up Notes */}
          {entry.follow_up_notes && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-300">Follow-up:</span>
              </div>
              <p className="text-green-200 text-sm line-clamp-2">{entry.follow_up_notes}</p>
            </div>
          )}

          {/* Reading Link */}
          {entry.reading_id && (
            <Link
              to={createPageUrl(`Reading?resume=${entry.reading_id}`)}
              className="inline-flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200"
            >
              <LinkIcon className="w-4 h-4" />
              View Original Reading
            </Link>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => onEdit(entry)}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={() => onDelete(entry.id)}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}