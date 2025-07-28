
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Sparkles,
  X,
  Search,
  Settings,
  Target,
  Zap,
  Star,
  AlertCircle,
  BookOpen,
  CreditCard,
  DollarSign
} from "lucide-react";

interface MultiFilter {
  status: string[];
  locations: string[];
  membershipTypes: string[];
  dateFilters: string[];
  sessionFilters: string[];
  customFilters: string[];
}

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
  const [activeFilters, setActiveFilters] = useState<MultiFilter>({
    status: [],
    locations: [],
    membershipTypes: [],
    dateFilters: [],
    sessionFilters: [],
    customFilters: []
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionRange, setSessionRange] = useState([0, 50]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Enhanced date parsing function
  const parseDate = (dateStr: string): Date => {
    if (!dateStr || dateStr === '-') return new Date(0);
    
    // Handle various date formats from Google Sheets
    let cleanDateStr = dateStr.trim();
    
    // If it contains time info, remove it for basic date parsing
    if (cleanDateStr.includes(' ')) {
      cleanDateStr = cleanDateStr.split(' ')[0];
    }
    
    // Try parsing DD/MM/YYYY format
    if (cleanDateStr.includes('/')) {
      const parts = cleanDateStr.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }
    
    // Try parsing YYYY-MM-DD format
    if (cleanDateStr.includes('-')) {
      const parsedDate = new Date(cleanDateStr);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    
    // Fallback to direct Date constructor
    const fallbackDate = new Date(dateStr);
    return isNaN(fallbackDate.getTime()) ? new Date(0) : fallbackDate;
  };

  const activeMembers = membershipData.filter(m => m.status === 'Active');
  const expiredMembers = membershipData.filter(m => m.status === 'Expired');
  const membersWithSessions = membershipData.filter(m => m.sessionsLeft > 0);
  const frozenMembers = membershipData.filter(m => m.frozen && m.frozen.toLowerCase() === 'true');
  const unpaidMembers = membershipData.filter(m => !m.paid || m.paid === '-' || parseFloat(m.paid) === 0);
  const premiumMembers = membershipData.filter(m => m.membershipName && m.membershipName.toLowerCase().includes('unlimited'));
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const recentMembers = membershipData.filter(m => parseDate(m.orderDate) >= thirtyDaysAgo);
  const weeklyMembers = membershipData.filter(m => parseDate(m.orderDate) >= sevenDaysAgo);
  const expiringThisWeek = membershipData.filter(m => {
    const endDate = parseDate(m.endDate);
    return endDate >= now && endDate <= nextWeek && m.status === 'Active';
  });
  const expiringThisMonth = membershipData.filter(m => {
    const endDate = parseDate(m.endDate);
    return endDate >= now && endDate <= nextMonth && m.status === 'Active';
  });
  const highValueMembers = membershipData.filter(m => parseFloat(m.paid) > 5000);
  const lowSessionMembers = membershipData.filter(m => m.sessionsLeft > 0 && m.sessionsLeft <= 3);
  
  const availableMembershipTypes = [...new Set(membershipData.map(m => m.membershipName).filter(Boolean))];

  // Multi-filter management
  const toggleFilter = (category: keyof MultiFilter, value: string) => {
    setActiveFilters(prev => {
      const currentFilters = prev[category];
      const isActive = currentFilters.includes(value);
      
      let newFilters;
      if (isActive) {
        newFilters = currentFilters.filter(f => f !== value);
      } else {
        newFilters = [...currentFilters, value];
      }
      
      const updatedFilters = { ...prev, [category]: newFilters };
      
      // Notify parent component with combined filter string
      const allActiveFilters = Object.values(updatedFilters).flat();
      onQuickFilterChange(allActiveFilters.length > 0 ? 'multi-filter' : 'all');
      
      return updatedFilters;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({
      status: [],
      locations: [],
      membershipTypes: [],
      dateFilters: [],
      sessionFilters: [],
      customFilters: []
    });
    setSearchTerm("");
    setSessionRange([0, 50]);
    onQuickFilterChange('all');
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).flat().length + (searchTerm ? 1 : 0);
  };

  const isFilterActive = (category: keyof MultiFilter, value: string) => {
    return activeFilters[category].includes(value);
  };

  const filterGroups = [
    {
      title: "Status Filters",
      category: "status" as keyof MultiFilter,
      icon: Users,
      filters: [
        { key: 'active', label: 'Active Members', count: activeMembers.length, icon: UserCheck, color: 'bg-green-100 text-green-800 border-green-200' },
        { key: 'expired', label: 'Expired Members', count: expiredMembers.length, icon: UserX, color: 'bg-red-100 text-red-800 border-red-200' },
        { key: 'frozen', label: 'Frozen Accounts', count: frozenMembers.length, icon: Clock, color: 'bg-blue-100 text-blue-800 border-blue-200' },
        { key: 'sessions', label: 'With Sessions', count: membersWithSessions.length, icon: Dumbbell, color: 'bg-purple-100 text-purple-800 border-purple-200' },
        { key: 'no-sessions', label: 'No Sessions Left', count: membershipData.length - membersWithSessions.length, icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
      ]
    },
    {
      title: "Date Filters",
      category: "dateFilters" as keyof MultiFilter,
      icon: Calendar,
      filters: [
        { key: 'recent', label: 'Joined Last 30 Days', count: recentMembers.length, icon: TrendingUp, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
        { key: 'weekly', label: 'Joined This Week', count: weeklyMembers.length, icon: Calendar, color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
        { key: 'expiring-week', label: 'Expiring This Week', count: expiringThisWeek.length, icon: AlertCircle, color: 'bg-orange-100 text-orange-800 border-orange-200' },
        { key: 'expiring-month', label: 'Expiring This Month', count: expiringThisMonth.length, icon: Clock, color: 'bg-amber-100 text-amber-800 border-amber-200' }
      ]
    },
    {
      title: "Session Filters",
      category: "sessionFilters" as keyof MultiFilter,
      icon: Dumbbell,
      filters: [
        { key: 'low-sessions', label: 'Low Sessions (≤3)', count: lowSessionMembers.length, icon: AlertCircle, color: 'bg-red-100 text-red-800 border-red-200' },
        { key: 'medium-sessions', label: 'Medium Sessions (4-10)', count: membershipData.filter(m => m.sessionsLeft >= 4 && m.sessionsLeft <= 10).length, icon: Target, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        { key: 'high-sessions', label: 'High Sessions (>10)', count: membershipData.filter(m => m.sessionsLeft > 10).length, icon: Star, color: 'bg-green-100 text-green-800 border-green-200' }
      ]
    },
    {
      title: "Location Filters",
      category: "locations" as keyof MultiFilter,
      icon: MapPin,
      filters: availableLocations.map(location => ({
        key: location,
        label: location.split(',')[0] || location,
        count: membershipData.filter(member => member.location === location).length,
        icon: MapPin,
        color: 'bg-teal-100 text-teal-800 border-teal-200'
      }))
    },
    {
      title: "Membership Type Filters",
      category: "membershipTypes" as keyof MultiFilter,
      icon: BookOpen,
      filters: availableMembershipTypes.slice(0, 6).map(type => ({
        key: type,
        label: type,
        count: membershipData.filter(member => member.membershipName === type).length,
        icon: BookOpen,
        color: 'bg-violet-100 text-violet-800 border-violet-200'
      }))
    },
    {
      title: "Business Intelligence",
      category: "customFilters" as keyof MultiFilter,
      icon: Settings,
      filters: [
        { key: 'premium', label: 'Premium Members', count: premiumMembers.length, icon: Star, color: 'bg-amber-100 text-amber-800 border-amber-200' },
        { key: 'high-value', label: 'High Value (>₹5000)', count: highValueMembers.length, icon: DollarSign, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        { key: 'unpaid', label: 'Payment Issues', count: unpaidMembers.length, icon: CreditCard, color: 'bg-red-100 text-red-800 border-red-200' }
      ]
    }
  ];

  const getFilteredGroups = () => {
    if (!searchTerm) return filterGroups;
    
    return filterGroups.map(group => ({
      ...group,
      filters: group.filters.filter(filter => 
        filter.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        filter.key.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(group => group.filters.length > 0);
  };

  return (
    <Card className="card-glass border-2 shadow-xl animate-fade-in">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="p-6 cursor-pointer hover:bg-accent/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 gradient-primary rounded-xl blur-lg opacity-50 animate-glow" />
                  <div className="relative p-3 gradient-primary text-white rounded-xl shadow-lg">
                    <Filter className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-elegant-heading flex items-center gap-2">
                    Smart Filters
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  </h3>
                  <p className="text-refined font-medium">
                    {getActiveFilterCount() > 0 
                      ? `${getActiveFilterCount()} filter(s) active - Multi-select enabled` 
                      : 'Advanced multi-filter system'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getActiveFilterCount() > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="gradient-primary text-white shadow-md">
                      {getActiveFilterCount()} Active
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAllFilters();
                      }}
                      className="h-8 px-2 hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-6 pb-6 space-y-8 border-t border-border/50">
            {/* Search and Advanced Controls */}
            <div className="flex items-center gap-4 pt-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search filters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 card-elevated"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`card-elevated transition-all duration-200 ${showAdvanced ? 'bg-primary/10 text-primary border-primary/20' : ''}`}
              >
                <Settings className="h-4 w-4 mr-2" />
                Advanced
              </Button>
            </div>

            {/* Advanced Controls */}
            {showAdvanced && (
              <div className="card-glass p-4 space-y-4 border border-border/50 rounded-lg animate-fade-in">
                <h4 className="text-sophisticated font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Advanced Controls
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Sessions Range</label>
                    <div className="px-3">
                      <Slider
                        value={sessionRange}
                        onValueChange={setSessionRange}
                        max={50}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{sessionRange[0]} sessions</span>
                        <span>{sessionRange[1]} sessions</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Quick Actions</label>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setActiveFilters(prev => ({ ...prev, status: ['active'] }));
                        onQuickFilterChange('multi-filter');
                      }}>
                        Active Only
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setActiveFilters(prev => ({ ...prev, sessionFilters: ['low-sessions'] }));
                        onQuickFilterChange('multi-filter');
                      }}>
                        Low Sessions
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filter Groups */}
            {getFilteredGroups().map((group, groupIndex) => (
              <div key={group.title} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <group.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="text-sophisticated font-semibold">{group.title}</h4>
                  <div className="text-xs text-muted-foreground">
                    ({group.filters.reduce((sum, f) => sum + f.count, 0)} total)
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {group.filters.map((filter) => {
                    const isActive = isFilterActive(group.category, filter.key);
                    return (
                      <Button
                        key={filter.key}
                        variant={isActive ? "default" : "outline"}
                        onClick={() => toggleFilter(group.category, filter.key)}
                        className={`h-auto py-3 px-4 flex items-center gap-3 transition-all duration-300 font-medium hover:scale-105 ${
                          isActive 
                            ? 'gradient-primary text-white shadow-lg border-transparent' 
                            : 'card-elevated hover:bg-accent/50 hover:shadow-md'
                        }`}
                      >
                        <filter.icon className="h-4 w-4" />
                        <span>{filter.label}</span>
                        <Badge 
                          variant={isActive ? "secondary" : "outline"}
                          className={`ml-1 font-bold ${
                            isActive 
                              ? 'bg-white/20 text-white border-white/30' 
                              : filter.color || 'bg-muted border-border'
                          }`}
                        >
                          {filter.count}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Active Filters Summary */}
            {getActiveFilterCount() > 0 && (
              <div className="card-glass p-4 border border-primary/20 rounded-lg animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sophisticated font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Active Filters Summary
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(activeFilters).map(([category, filters]) =>
                    filters.map((filter) => (
                      <Badge
                        key={`${category}-${filter}`}
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
                        onClick={() => toggleFilter(category as keyof MultiFilter, filter)}
                      >
                        {filter}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))
                  )}
                  {searchTerm && (
                    <Badge
                      variant="outline"
                      className="bg-accent/10 text-accent-foreground border-accent/20"
                    >
                      Search: "{searchTerm}"
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setSearchTerm("")} />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
