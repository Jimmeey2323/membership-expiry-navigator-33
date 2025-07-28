import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/MetricCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { DataTable } from "@/components/DataTable";
import { MembershipChart } from "@/components/MembershipChart";
import { CollapsibleFilters } from "@/components/CollapsibleFilters";
import { ThemeToggle } from "@/components/ThemeToggle";
import { googleSheetsService } from "@/services/googleSheets";
import { MembershipData, FilterOptions } from "@/types/membership";
import { Link } from "react-router-dom";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Filter,
  Dumbbell,
  Activity,
  RefreshCw,
  Building2,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    locations: [],
    membershipTypes: [],
    dateRange: { start: '', end: '' },
    sessionsRange: { min: 0, max: 100 }
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [localMembershipData, setLocalMembershipData] = useState<MembershipData[]>([]);

  const { data: membershipData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['membershipData'],
    queryFn: () => googleSheetsService.getMembershipData(),
    refetchInterval: 300000,
  });

  useEffect(() => {
    if (membershipData) {
      setLocalMembershipData(membershipData);
    }
  }, [membershipData]);

  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch membership data. Using sample data for demonstration.");
    }
  }, [error]);

  const handleAnnotationUpdate = (memberId: string, comments: string, notes: string, tags: string[]) => {
    setLocalMembershipData(prev => 
      prev.map(member => 
        member.memberId === memberId 
          ? { ...member, comments, notes, tags }
          : member
      )
    );
  };

  const applyFilters = (data: MembershipData[]): MembershipData[] => {
    return data.filter(member => {
      if (filters.status.length > 0 && !filters.status.includes(member.status)) {
        return false;
      }
      if (filters.locations.length > 0 && !filters.locations.includes(member.location)) {
        return false;
      }
      if (filters.membershipTypes.length > 0 && !filters.membershipTypes.includes(member.membershipName)) {
        return false;
      }
      if (member.sessionsLeft < filters.sessionsRange.min || member.sessionsLeft > filters.sessionsRange.max) {
        return false;
      }
      if (filters.dateRange.start && new Date(member.endDate) < new Date(filters.dateRange.start)) {
        return false;
      }
      if (filters.dateRange.end && new Date(member.endDate) > new Date(filters.dateRange.end)) {
        return false;
      }
      return true;
    });
  };

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

  const applyQuickFilter = (data: MembershipData[]): MembershipData[] => {
    // If quickFilter is 'all', don't apply any additional filtering
    if (quickFilter === 'all') return data;
    
    // Handle multi-filter mode - this will be expanded when CollapsibleFilters passes active filters
    if (quickFilter === 'multi-filter') {
      // For now, return all data - the actual multi-filtering logic would be handled
      // by passing the active filters from CollapsibleFilters to Index
      return data;
    }
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    switch (quickFilter) {
      case 'active':
        return data.filter(member => member.status === 'Active');
      case 'expired':
        return data.filter(member => member.status === 'Expired');
      case 'frozen':
        return data.filter(member => member.frozen && member.frozen.toLowerCase() === 'true');
      case 'sessions':
        return data.filter(member => member.sessionsLeft > 0);
      case 'no-sessions':
        return data.filter(member => member.sessionsLeft === 0);
      case 'low-sessions':
        return data.filter(member => member.sessionsLeft > 0 && member.sessionsLeft <= 3);
      case 'medium-sessions':
        return data.filter(member => member.sessionsLeft >= 4 && member.sessionsLeft <= 10);
      case 'high-sessions':
        return data.filter(member => member.sessionsLeft > 10);
      case 'recent':
        return data.filter(member => parseDate(member.orderDate) >= thirtyDaysAgo);
      case 'weekly':
        return data.filter(member => parseDate(member.orderDate) >= sevenDaysAgo);
      case 'expiring-week':
        return data.filter(member => {
          const endDate = parseDate(member.endDate);
          return endDate >= now && endDate <= nextWeek && member.status === 'Active';
        });
      case 'expiring-month':
        return data.filter(member => {
          const endDate = parseDate(member.endDate);
          return endDate >= now && endDate <= nextMonth && member.status === 'Active';
        });
      case 'premium':
        return data.filter(member => member.membershipName && member.membershipName.toLowerCase().includes('unlimited'));
      case 'high-value':
        return data.filter(member => parseFloat(member.paid) > 5000);
      case 'unpaid':
        return data.filter(member => !member.paid || member.paid === '-' || parseFloat(member.paid) === 0);
      default:
        // Handle location filters and membership type filters
        if (availableLocations.includes(quickFilter)) {
          return data.filter(member => member.location === quickFilter);
        }
        const availableMembershipTypes = [...new Set(localMembershipData.map(m => m.membershipName).filter(Boolean))];
        if (availableMembershipTypes.includes(quickFilter)) {
          return data.filter(member => member.membershipName === quickFilter);
        }
        return data;
    }
  };

  const filteredData = applyQuickFilter(applyFilters(localMembershipData));
  const activeMembers = localMembershipData.filter(member => member.status === 'Active');
  const expiredMembers = localMembershipData.filter(member => member.status === 'Expired');
  const membersWithSessions = localMembershipData.filter(member => member.sessionsLeft > 0);
  const expiringMembers = localMembershipData.filter(member => {
    const endDate = parseDate(member.endDate);
    const now = new Date();
    return endDate >= now && endDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  });

  const availableLocations = [...new Set(localMembershipData.map(member => member.location).filter(l => l && l !== '-'))];
  const availableMembershipTypes = [...new Set(localMembershipData.map(member => member.membershipName))];

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed successfully");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="text-center space-y-8 animate-fade-in">
          <Card className="card-glass p-12 max-w-md mx-auto">
            <div className="relative mb-8">
              <div className="absolute inset-0 gradient-primary rounded-full blur-lg opacity-50 animate-glow" />
              <div className="relative p-6 gradient-primary text-white rounded-full mx-auto w-fit">
                <RefreshCw className="h-12 w-12 animate-spin" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-sophisticated text-2xl">
                Loading Dashboard
              </h2>
              <p className="text-refined text-lg">
                Fetching membership data & analytics...
              </p>
              
              {/* Loading shimmer bars */}
              <div className="space-y-3 mt-8">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i}
                    className="h-2 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-full animate-shimmer"
                    style={{ 
                      animationDelay: `${i * 200}ms`,
                      backgroundSize: '200px 100%',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh">
      <div className="container-constrained section-spacing space-y-12">
        {/* Sophisticated Header */}
        <div className="relative animate-fade-in">
          <div className="absolute inset-0 gradient-sophisticated opacity-5 rounded-3xl blur-3xl" />
          <div className="relative card-glass p-8 rounded-3xl border-2">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 gradient-primary rounded-2xl blur-lg opacity-50 animate-glow" />
                    <div className="relative p-4 gradient-primary text-white rounded-2xl shadow-2xl">
                      <Building2 className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-elegant-heading">
                      Membership Analytics
                    </h1>
                    <p className="text-refined text-xl">
                      Advanced membership management & insights platform
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link to="/churn-analytics">
                  <Button 
                    variant="outline" 
                    className="card-elevated border-destructive/20 hover:bg-destructive/5 text-destructive shadow-md hover:shadow-lg"
                  >
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Churn Analytics
                  </Button>
                </Link>
                <Button 
                  onClick={handleRefresh} 
                  variant="outline" 
                  className="card-elevated hover:bg-accent/50 shadow-md hover:shadow-lg"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  onClick={() => setIsFilterOpen(true)} 
                  className="gradient-primary shadow-lg hover:shadow-xl animate-glow"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Filters */}
        <div className="animate-slide-up">
          <CollapsibleFilters
            quickFilter={quickFilter}
            onQuickFilterChange={setQuickFilter}
            membershipData={localMembershipData}
            availableLocations={availableLocations}
          />
        </div>

        {/* Sophisticated Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-slide-up">
          <div className="absolute inset-0 gradient-mesh opacity-20 rounded-3xl blur-3xl pointer-events-none" />
          <MetricCard
            title="Total Members"
            value={localMembershipData.length}
            icon={Users}
            change="+12% from last month"
            trend="up"
            tooltip="Total number of registered members across all locations and membership types"
            drillDownData={[
              { label: 'This Month', value: 25 },
              { label: 'Last Month', value: 18 },
              { label: 'Active', value: activeMembers.length },
              { label: 'Inactive', value: expiredMembers.length }
            ]}
          />
          <MetricCard
            title="Active Members"
            value={activeMembers.length}
            icon={UserCheck}
            change="+5% from last month"
            trend="up"
            tooltip="Members with active subscriptions and valid access to facilities"
            drillDownData={[
              { label: 'New', value: 12 },
              { label: 'Renewed', value: 8 },
              { label: 'With Sessions', value: membersWithSessions.length },
              { label: 'Expiring Soon', value: expiringMembers.length }
            ]}
          />
          <MetricCard
            title="Expired Members"
            value={expiredMembers.length}
            icon={UserX}
            change="-8% from last month"
            trend="down"
            tooltip="Members whose subscriptions have expired and need renewal"
            drillDownData={[
              { label: 'This Week', value: 3 },
              { label: 'This Month', value: 8 },
              { label: 'Recoverable', value: 15 },
              { label: 'Lost', value: 5 }
            ]}
          />
          <MetricCard
            title="Total Sessions"
            value={localMembershipData.reduce((sum, member) => sum + member.sessionsLeft, 0)}
            icon={Dumbbell}
            change="+15% from last month"
            trend="up"
            tooltip="Total remaining sessions across all active memberships"
            drillDownData={[
              { label: 'Available', value: localMembershipData.reduce((sum, member) => sum + member.sessionsLeft, 0) },
              { label: 'Used This Month', value: 156 },
              { label: 'Avg per Member', value: Math.round(localMembershipData.reduce((sum, member) => sum + member.sessionsLeft, 0) / localMembershipData.length) },
              { label: 'Peak Usage', value: 45 }
            ]}
          />
        </div>

        {/* Enhanced Chart */}
        <div className="animate-slide-up">
          <MembershipChart data={filteredData} />
        </div>

        {/* Elegant Interactive Data Tables */}
        <div className="animate-slide-up">
          <Tabs defaultValue="overview" className="space-y-8">
            <div className="relative">
              <div className="absolute inset-0 gradient-mesh opacity-10 rounded-2xl blur-2xl" />
              <Card className="card-glass p-3 relative">
                <TabsList className="grid w-full grid-cols-4 bg-background/50 gap-2 p-2 backdrop-blur-sm">
                  <TabsTrigger 
                    value="overview" 
                    className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg font-semibold transition-all duration-300 data-[state=active]:scale-105 hover:bg-accent/50"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="active" 
                    className="data-[state=active]:bg-success data-[state=active]:text-success-foreground data-[state=active]:shadow-lg font-semibold transition-all duration-300 data-[state=active]:scale-105 hover:bg-accent/50"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Active ({activeMembers.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="expired" 
                    className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground data-[state=active]:shadow-lg font-semibold transition-all duration-300 data-[state=active]:scale-105 hover:bg-accent/50"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Expired ({expiredMembers.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sessions" 
                    className="data-[state=active]:bg-warning data-[state=active]:text-warning-foreground data-[state=active]:shadow-lg font-semibold transition-all duration-300 data-[state=active]:scale-105 hover:bg-accent/50"
                  >
                    <Dumbbell className="h-4 w-4 mr-2" />
                    Sessions
                  </TabsTrigger>
                </TabsList>
              </Card>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <DataTable 
                data={filteredData} 
                title="All Members Overview"
                onAnnotationUpdate={handleAnnotationUpdate}
              />
            </TabsContent>

            <TabsContent value="active" className="space-y-6">
              <DataTable 
                data={filteredData.filter(member => member.status === 'Active')} 
                title="Active Members"
                onAnnotationUpdate={handleAnnotationUpdate}
              />
            </TabsContent>

            <TabsContent value="expired" className="space-y-6">
              <DataTable 
                data={filteredData.filter(member => member.status === 'Expired')} 
                title="Expired Members"
                onAnnotationUpdate={handleAnnotationUpdate}
              />
            </TabsContent>

            <TabsContent value="sessions" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DataTable 
                  data={filteredData.filter(member => member.sessionsLeft > 0)} 
                  title="Members with Remaining Sessions"
                  onAnnotationUpdate={handleAnnotationUpdate}
                />
                <DataTable 
                  data={filteredData.filter(member => member.sessionsLeft === 0)} 
                  title="Members with No Sessions"
                  onAnnotationUpdate={handleAnnotationUpdate}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <FilterSidebar
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            // Reset quick filter when advanced filters are applied
            setQuickFilter('all');
          }}
          availableLocations={availableLocations}
          availableMembershipTypes={availableMembershipTypes}
        />
      </div>
    </div>
  );
};

export default Index;
