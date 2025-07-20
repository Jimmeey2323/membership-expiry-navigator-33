
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronUp, 
  Users, 
  UserCheck, 
  UserX, 
  Dumbbell,
  Calendar,
  MapPin,
  Clock,
  TrendingUp,
  Filter,
  Sparkles
} from "lucide-react";

interface CollapsibleFiltersProps {
  quickFilter: string;
  onQuickFilterChange: (filter: string) => void;
  membershipData: any[];
  availableLocations: string[];
}

export const CollapsibleFilters = ({ 
  quickFilter, 
  onQuickFilterChange, 
  membershipData,
  availableLocations 
}: CollapsibleFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeMembers = membershipData.filter(m => m.status === 'Active');
  const expiredMembers = membershipData.filter(m => m.status === 'Expired');
  const membersWithSessions = membershipData.filter(m => m.sessionsLeft > 0);
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const recentMembers = membershipData.filter(m => new Date(m.orderDate) >= thirtyDaysAgo);
  const weeklyMembers = membershipData.filter(m => new Date(m.orderDate) >= sevenDaysAgo);
  const expiringThisMonth = membershipData.filter(m => {
    const endDate = new Date(m.endDate);
    return endDate >= now && endDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  });

  const getActiveFilters = () => {
    const filters = [];
    if (quickFilter === 'active') filters.push('Active');
    if (quickFilter === 'expired') filters.push('Expired');
    if (quickFilter === 'sessions') filters.push('With Sessions');
    if (quickFilter === 'no-sessions') filters.push('No Sessions');
    if (quickFilter === 'recent') filters.push('Recent');
    if (quickFilter === 'weekly') filters.push('Weekly');
    if (quickFilter === 'expiring') filters.push('Expiring');
    if (quickFilter.startsWith('location-')) {
      const location = quickFilter.replace('location-', '');
      filters.push(location.split(',')[0] || location);
    }
    return filters;
  };

  const activeFilters = getActiveFilters();

  const filterGroups = [
    {
      title: "Status Filters",
      filters: [
        { key: 'all', label: 'All Members', count: membershipData.length, icon: Users },
        { key: 'active', label: 'Active', count: activeMembers.length, icon: UserCheck },
        { key: 'expired', label: 'Expired', count: expiredMembers.length, icon: UserX },
        { key: 'sessions', label: 'With Sessions', count: membersWithSessions.length, icon: Dumbbell },
        { key: 'no-sessions', label: 'No Sessions', count: membershipData.length - membersWithSessions.length, icon: Clock }
      ]
    },
    {
      title: "Period Filters",
      filters: [
        { key: 'recent', label: 'Last 30 Days', count: recentMembers.length, icon: TrendingUp },
        { key: 'weekly', label: 'This Week', count: weeklyMembers.length, icon: Calendar },
        { key: 'expiring', label: 'Expiring Soon', count: expiringThisMonth.length, icon: Clock }
      ]
    },
    {
      title: "Location Filters",
      filters: availableLocations.slice(0, 6).map(location => ({
        key: `location-${location}`,
        label: location.split(',')[0] || location,
        count: membershipData.filter(member => member.location === location).length,
        icon: MapPin
      }))
    }
  ];

  const handleFilterToggle = (filterKey: string) => {
    // If the same filter is clicked, toggle it off by setting to 'all'
    if (quickFilter === filterKey) {
      onQuickFilterChange('all');
    } else {
      onQuickFilterChange(filterKey);
    }
  };

  return (
    <Card className="bg-white border-2 border-slate-100 shadow-lg">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="p-6 cursor-pointer hover:bg-slate-50 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
                  <Filter className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    Smart Filters
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                  </h3>
                  <p className="text-slate-600 font-medium">
                    {activeFilters.length > 0 ? `${activeFilters.length} filter(s) active` : 'Click to expand filter options'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {activeFilters.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeFilters.map((filter, index) => (
                      <Badge key={index} variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                        {filter}
                      </Badge>
                    ))}
                  </div>
                )}
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-600" /> : <ChevronDown className="h-5 w-5 text-slate-600" />}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-6 pb-6 space-y-6 border-t border-slate-200">
            {filterGroups.map((group, groupIndex) => (
              <div key={group.title} className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 mt-6">{group.title}</h4>
                <div className="flex flex-wrap gap-3">
                  {group.filters.map((filter) => (
                    <Button
                      key={filter.key}
                      variant={quickFilter === filter.key ? "default" : "outline"}
                      onClick={() => handleFilterToggle(filter.key)}
                      className={`h-auto py-3 px-4 flex items-center gap-3 transition-all duration-200 font-semibold ${
                        quickFilter === filter.key 
                          ? 'bg-blue-600 text-white shadow-lg scale-105 border-transparent' 
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:scale-105 hover:shadow-md'
                      }`}
                    >
                      <filter.icon className="h-4 w-4" />
                      <span>{filter.label}</span>
                      <Badge 
                        variant={quickFilter === filter.key ? "secondary" : "outline"}
                        className={`ml-1 font-bold ${
                          quickFilter === filter.key 
                            ? 'bg-white/20 text-white border-white/30' 
                            : 'bg-slate-100 border-slate-300'
                        }`}
                      >
                        {filter.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
