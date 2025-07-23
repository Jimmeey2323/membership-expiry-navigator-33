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
import { MemberCard } from "@/components/MemberCard";
import { MemberAnnotations } from "@/components/MemberAnnotations";
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
  TrendingDown,
  Grid,
  List
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
  const [selectedMember, setSelectedMember] = useState<MembershipData | null>(null);
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

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

  const handleOpenAnnotations = (member: MembershipData) => {
    setSelectedMember(member);
    setIsAnnotationsOpen(true);
  };

  const handleCloseAnnotations = () => {
    setSelectedMember(null);
    setIsAnnotationsOpen(false);
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-8 animate-fade-in">
          <Card className="p-12 max-w-md mx-auto border-gray-200 bg-white shadow-lg">
            <div className="relative mb-8">
              <div className="relative p-6 bg-blue-600 text-white rounded-full mx-auto w-fit">
                <RefreshCw className="h-12 w-12 animate-spin" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-gray-900 text-2xl font-semibold">
                Loading Dashboard
              </h2>
              <p className="text-gray-600 text-lg">
                Fetching membership data & analytics...
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-blue-600 text-white rounded-lg">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Membership Analytics
                </h1>
                <p className="text-gray-600 text-lg">
                  Advanced membership management & insights platform
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/churn-analytics">
                <Button 
                  variant="outline" 
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Churn Analytics
                </Button>
              </Link>
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={() => setIsFilterOpen(true)} 
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <CollapsibleFilters
          quickFilter={quickFilter}
          onQuickFilterChange={setQuickFilter}
          membershipData={localMembershipData}
          availableLocations={availableLocations}
        />

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Members"
            value={localMembershipData.length}
            icon={Users}
            change="+12% from last month"
            trend="up"
            tooltip="Total number of registered members"
          />
          <MetricCard
            title="Active Members"
            value={activeMembers.length}
            icon={UserCheck}
            change="+5% from last month"
            trend="up"
            tooltip="Members with active subscriptions"
          />
          <MetricCard
            title="Expired Members"
            value={expiredMembers.length}
            icon={UserX}
            change="-8% from last month"
            trend="down"
            tooltip="Members with expired subscriptions"
          />
          <MetricCard
            title="Total Sessions"
            value={localMembershipData.reduce((sum, member) => sum + member.sessionsLeft, 0)}
            icon={Dumbbell}
            change="+15% from last month"
            trend="up"
            tooltip="Total remaining sessions"
          />
        </div>

        {/* Chart */}
        <MembershipChart data={filteredData} />

        {/* Data View */}
        <div className="space-y-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <TabsList className="grid w-full grid-cols-4 max-w-md bg-gray-100">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                    <Activity className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Active
                  </TabsTrigger>
                  <TabsTrigger value="expired" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                    <UserX className="h-4 w-4 mr-2" />
                    Expired
                  </TabsTrigger>
                  <TabsTrigger value="sessions" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                    <Dumbbell className="h-4 w-4 mr-2" />
                    Sessions
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    <List className="h-4 w-4 mr-2" />
                    Table
                  </Button>
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    <Grid className="h-4 w-4 mr-2" />
                    Cards
                  </Button>
                </div>
              </div>
            </div>

            <TabsContent value="overview">
              {viewMode === 'table' ? (
                <DataTable 
                  data={filteredData} 
                  title="All Members Overview"
                  onAnnotationUpdate={handleAnnotationUpdate}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredData.map((member) => (
                    <MemberCard
                      key={member.uniqueId}
                      member={member}
                      onOpenAnnotations={handleOpenAnnotations}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="active">
              {viewMode === 'table' ? (
                <DataTable 
                  data={filteredData.filter(member => member.status === 'Active')} 
                  title="Active Members"
                  onAnnotationUpdate={handleAnnotationUpdate}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredData.filter(member => member.status === 'Active').map((member) => (
                    <MemberCard
                      key={member.uniqueId}
                      member={member}
                      onOpenAnnotations={handleOpenAnnotations}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="expired">
              {viewMode === 'table' ? (
                <DataTable 
                  data={filteredData.filter(member => member.status === 'Expired')} 
                  title="Expired Members"
                  onAnnotationUpdate={handleAnnotationUpdate}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredData.filter(member => member.status === 'Expired').map((member) => (
                    <MemberCard
                      key={member.uniqueId}
                      member={member}
                      onOpenAnnotations={handleOpenAnnotations}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sessions">
              {viewMode === 'table' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DataTable 
                    data={filteredData.filter(member => member.sessionsLeft > 0)} 
                    title="Members with Sessions"
                    onAnnotationUpdate={handleAnnotationUpdate}
                  />
                  <DataTable 
                    data={filteredData.filter(member => member.sessionsLeft === 0)} 
                    title="Members without Sessions"
                    onAnnotationUpdate={handleAnnotationUpdate}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Members with Sessions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredData.filter(member => member.sessionsLeft > 0).map((member) => (
                        <MemberCard
                          key={member.uniqueId}
                          member={member}
                          onOpenAnnotations={handleOpenAnnotations}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Members without Sessions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredData.filter(member => member.sessionsLeft === 0).map((member) => (
                        <MemberCard
                          key={member.uniqueId}
                          member={member}
                          onOpenAnnotations={handleOpenAnnotations}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <FilterSidebar
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            setQuickFilter('all');
          }}
          availableLocations={availableLocations}
          availableMembershipTypes={availableMembershipTypes}
        />

        <MemberAnnotations
          member={selectedMember}
          isOpen={isAnnotationsOpen}
          onClose={handleCloseAnnotations}
          onSave={handleAnnotationUpdate}
        />
      </div>
    </div>
  );
};

export default Index;
