
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Combine, List, MessageSquare, Wand2 } from "lucide-react";

export default function DashboardQuickLinks() {
  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-3 sticky top-0 z-30">
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-3 flex items-center gap-2 overflow-x-auto">
        <Link to={createPageUrl("FusionReading")}>
          <Button className="btn-dark-outline gap-2">
            <Combine className="w-4 h-4" />
            Fusion Reading
          </Button>
        </Link>
        <Link to={createPageUrl("FusionBuilder")}>
          <Button className="btn-dark-outline gap-2">
            <Wand2 className="w-4 h-4" />
            Build Fusion
          </Button>
        </Link>
        <Link to={createPageUrl("MyFusions")}>
          <Button className="btn-dark-outline gap-2">
            <List className="w-4 h-4" />
            My Fusions
          </Button>
        </Link>
        <Link to={createPageUrl("Help?tab=community")}>
          <Button className="btn-dark-outline gap-2">
            <MessageSquare className="w-4 h-4" />
            Discuss
          </Button>
        </Link>
      </div>
    </div>
  );
}
