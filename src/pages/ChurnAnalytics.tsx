import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { googleSheetsService } from "@/services/googleSheets";
import { MembershipData } from "@/types/membership";
import { TrendingDown, Calendar, Users, AlertTriangle, ArrowLeft, Calculator, BarChart3, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
interface ChurnMetrics {
  month: string;
  startingMembers: number;
  newMembers: number;
  expiredMembers: number;
  endingMembers: number;
  churnRate: number;
  churnCount: number;
}
const ChurnAnalytics = () => {
  const {
    data: membershipData = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['membershipData'],
    queryFn: () => googleSheetsService.getMembershipData(),
    refetchInterval: 300000
  });
  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch membership data. Using sample data for demonstration.");
    }
  }, [error]);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Get memberships expiring/expired in current month
  const currentMonthData = useMemo(() => {
    return membershipData.filter(member => {
      const endDate = new Date(member.endDate);
      return endDate.getMonth() === currentMonth && endDate.getFullYear() === currentYear;
    });
  }, [membershipData, currentMonth, currentYear]);

  // Calculate month-on-month churn metrics
  const churnMetrics = useMemo(() => {
    const metrics: ChurnMetrics[] = [];
    const months = [];

    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.toLocaleString('default', {
          month: 'long',
          year: 'numeric'
        }),
        monthIndex: date.getMonth(),
        year: date.getFullYear()
      });
    }
    months.forEach((monthData, index) => {
      const monthStart = new Date(monthData.year, monthData.monthIndex, 1);
      const monthEnd = new Date(monthData.year, monthData.monthIndex + 1, 0);

      // Members active at start of month
      const startingMembers = membershipData.filter(member => {
        const endDate = new Date(member.endDate);
        const orderDate = new Date(member.orderDate);
        return orderDate < monthStart && endDate >= monthStart;
      }).length;

      // New members in this month
      const newMembers = membershipData.filter(member => {
        const orderDate = new Date(member.orderDate);
        return orderDate >= monthStart && orderDate <= monthEnd;
      }).length;

      // Members who expired in this month
      const expiredMembers = membershipData.filter(member => {
        const endDate = new Date(member.endDate);
        return endDate >= monthStart && endDate <= monthEnd && member.status === 'Expired';
      }).length;

      // Active members at end of month
      const endingMembers = membershipData.filter(member => {
        const endDate = new Date(member.endDate);
        const orderDate = new Date(member.orderDate);
        return orderDate <= monthEnd && endDate > monthEnd;
      }).length;

      // Churn rate calculation: (Members Lost / Starting Members) * 100
      const churnRate = startingMembers > 0 ? expiredMembers / startingMembers * 100 : 0;
      metrics.push({
        month: monthData.month,
        startingMembers,
        newMembers,
        expiredMembers,
        endingMembers,
        churnRate: Number(churnRate.toFixed(2)),
        churnCount: expiredMembers
      });
    });
    return metrics;
  }, [membershipData]);
  const currentMonthMetrics = churnMetrics[churnMetrics.length - 1];
  const previousMonthMetrics = churnMetrics[churnMetrics.length - 2];
  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8 max-w-sm mx-auto bg-white shadow-2xl">
          <div className="text-center space-y-4">
            <BarChart3 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
            <h2 className="text-xl font-semibold text-slate-900">Loading Churn Analytics</h2>
            <p className="text-slate-600">Calculating churn metrics...</p>
          </div>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="space-y-1">
              <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl shadow-lg">
                  <TrendingDown className="h-7 w-7" />
                </div>
                Churn Analytics
              </h1>
              <p className="text-slate-600 font-medium text-lg">
                Detailed membership churn analysis and retention metrics
              </p>
            </div>
          </div>
        </div>

        {/* Current Month Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-white border-2 border-slate-100 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <TrendingDown className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-700">Current Churn Rate</h3>
            </div>
            <p className="text-3xl font-bold text-red-600 mb-2">
              {currentMonthMetrics?.churnRate || 0}%
            </p>
            <p className="text-sm text-slate-600">
              {currentMonthMetrics?.churnCount || 0} members lost this month
            </p>
          </Card>

          <Card className="p-6 bg-white border-2 border-slate-100 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-700">Expiring This Month</h3>
            </div>
            <p className="text-3xl font-bold text-orange-600 mb-2">
              {currentMonthData.length}
            </p>
            <p className="text-sm text-slate-600">
              Members with end dates in current month
            </p>
          </Card>

          <Card className="p-6 bg-white border-2 border-slate-100 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-700">Starting Members</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-2">
              {currentMonthMetrics?.startingMembers || 0}
            </p>
            <p className="text-sm text-slate-600">
              Active at start of month
            </p>
          </Card>

          <Card className="p-6 bg-white border-2 border-slate-100 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Calculator className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-700">Churn Change</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600 mb-2">
              {previousMonthMetrics ? `${((currentMonthMetrics?.churnRate || 0) - previousMonthMetrics.churnRate).toFixed(2)}%` : 'N/A'}
            </p>
            <p className="text-sm text-slate-600">
              vs previous month
            </p>
          </Card>
        </div>

        {/* Churn Calculation Explanation */}
        <Card className="bg-white border-2 border-slate-100 shadow-xl">
          <div className="p-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Calculator className="h-6 w-6 text-blue-600" />
              Churn Rate Calculation
            </h3>
            <div className="bg-slate-50 p-6 rounded-xl border-2 border-slate-200">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800">Formula Used:</h4>
                <div className="bg-white p-4 rounded-lg border border-slate-300 font-mono text-lg">
                  <span className="text-red-600 font-bold">Churn Rate = (Members Lost in Period / Starting Members) × 100</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h5 className="font-semibold text-slate-700 mb-2">Starting Members</h5>
                    <p className="text-sm text-slate-600">Members with active subscriptions at the beginning of the month</p>
                    <p className="text-lg font-bold text-blue-600 mt-2">
                      {currentMonthMetrics?.startingMembers || 0}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h5 className="font-semibold text-slate-700 mb-2">Members Lost</h5>
                    <p className="text-sm text-slate-600">Members whose subscriptions expired during the month</p>
                    <p className="text-lg font-bold text-red-600 mt-2">
                      {currentMonthMetrics?.expiredMembers || 0}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h5 className="font-semibold text-slate-700 mb-2">Calculation</h5>
                    <p className="text-sm text-slate-600">
                      ({currentMonthMetrics?.expiredMembers || 0} ÷ {currentMonthMetrics?.startingMembers || 1}) × 100
                    </p>
                    <p className="text-lg font-bold text-purple-600 mt-2">
                      = {currentMonthMetrics?.churnRate || 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Detailed Tables */}
        <Tabs defaultValue="current-month" className="space-y-6">
          <Card className="p-2 bg-white border-2 border-slate-100 shadow-sm">
            <TabsList className="grid w-full grid-cols-3 bg-slate-50 gap-1 p-1">
              <TabsTrigger value="current-month" className="data-[state=active]:bg-red-600 data-[state=active]:text-white font-semibold">
                <Calendar className="h-4 w-4 mr-2" />
                Current Month
              </TabsTrigger>
              <TabsTrigger value="trends" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">
                <BarChart3 className="h-4 w-4 mr-2" />
                Monthly Trends
              </TabsTrigger>
              <TabsTrigger value="detailed-list" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white font-semibold">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Detailed List
              </TabsTrigger>
            </TabsList>
          </Card>

          <TabsContent value="current-month">
            <Card className="bg-white border-2 border-slate-100 shadow-xl">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  Current Month Expiring/Expired Members ({currentMonthData.length})
                </h3>
                <div className="border-2 border-slate-100 rounded-2xl overflow-hidden max-h-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 border-b-2 border-slate-200">
                        <TableHead className="font-bold text-slate-700">Member ID</TableHead>
                        <TableHead className="font-bold text-slate-700">Name</TableHead>
                        <TableHead className="font-bold text-slate-700">Email</TableHead>
                        <TableHead className="font-bold text-slate-700">Membership</TableHead>
                        <TableHead className="font-bold text-slate-700">End Date</TableHead>
                        <TableHead className="font-bold text-slate-700">Status</TableHead>
                        <TableHead className="font-bold text-slate-700">Sessions Left</TableHead>
                        <TableHead className="font-bold text-slate-700">Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="max-h-[30px] ">
                      {currentMonthData.map(member => <TableRow key={member.uniqueId} className="border-b border-slate-100 hover:bg-slate-50 text-left whitespace-nowrap ">
                          <TableCell className="font-mono text-sm">{member.memberId}</TableCell>
                          <TableCell className="font-medium min-w-52">{member.firstName} {member.lastName}</TableCell>
                          <TableCell className="text-slate-600 min-w-52">{member.email}</TableCell>
                          <TableCell className="text-slate-600 min-w-52">{member.membershipName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{new Date(member.endDate).toLocaleDateString()}</span>
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={member.status === 'Active' ? "default" : "destructive"} className="min-w-36 py-2">
                              {member.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={member.sessionsLeft > 0 ? "secondary" : "destructive"} className="min-w-8 text-center ">
                              {member.sessionsLeft}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600">{member.location}</TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card className="bg-white border-2 border-slate-100 shadow-xl">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  Month-on-Month Churn Analysis
                </h3>
                <div className="border-2 border-slate-100 rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 border-b-2 border-slate-200">
                        <TableHead className="font-bold text-slate-700">Month</TableHead>
                        <TableHead className="font-bold text-slate-700">Starting Members</TableHead>
                        <TableHead className="font-bold text-slate-700">New Members</TableHead>
                        <TableHead className="font-bold text-slate-700">Expired Members</TableHead>
                        <TableHead className="font-bold text-slate-700">Ending Members</TableHead>
                        <TableHead className="font-bold text-slate-700">Churn Rate</TableHead>
                        <TableHead className="font-bold text-slate-700">Churn Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {churnMetrics.map((metric, index) => <TableRow key={metric.month} className="border-b border-slate-100 hover:bg-slate-50">
                          <TableCell className="font-medium">{metric.month}</TableCell>
                          <TableCell className="text-center">{metric.startingMembers}</TableCell>
                          <TableCell className="text-center text-green-600 font-medium">+{metric.newMembers}</TableCell>
                          <TableCell className="text-center text-red-600 font-medium">-{metric.expiredMembers}</TableCell>
                          <TableCell className="text-center">{metric.endingMembers}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={metric.churnRate > 10 ? "destructive" : metric.churnRate > 5 ? "secondary" : "default"} className="font-bold">
                              {metric.churnRate}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-red-600 font-medium">{metric.churnCount}</TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="detailed-list">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border-2 border-red-100 shadow-xl">
                <div className="p-6">
                  <h4 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    Expired This Month
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {currentMonthData.filter(m => m.status === 'Expired').map(member => <div key={member.uniqueId} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-semibold text-slate-800">
                            {member.firstName} {member.lastName}
                          </h5>
                          <Badge variant="destructive" className="text-xs">Expired</Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">
                          <strong>Email:</strong> {member.email}
                        </p>
                        <p className="text-sm text-slate-600 mb-1">
                          <strong>Membership:</strong> {member.membershipName}
                        </p>
                        <p className="text-sm text-slate-600 mb-1">
                          <strong>End Date:</strong> {new Date(member.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-slate-600">
                          <strong>Sessions Left:</strong> {member.sessionsLeft}
                        </p>
                      </div>)}
                  </div>
                </div>
              </Card>

              <Card className="bg-white border-2 border-orange-100 shadow-xl">
                <div className="p-6">
                  <h4 className="text-xl font-bold text-orange-700 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Expiring This Month
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {currentMonthData.filter(m => m.status === 'Active').map(member => <div key={member.uniqueId} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-semibold text-slate-800">
                            {member.firstName} {member.lastName}
                          </h5>
                          <Badge className="text-xs bg-orange-100 text-orange-800">Expiring</Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">
                          <strong>Email:</strong> {member.email}
                        </p>
                        <p className="text-sm text-slate-600 mb-1">
                          <strong>Membership:</strong> {member.membershipName}
                        </p>
                        <p className="text-sm text-slate-600 mb-1">
                          <strong>End Date:</strong> {new Date(member.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-slate-600">
                          <strong>Sessions Left:</strong> {member.sessionsLeft}
                        </p>
                      </div>)}
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
export default ChurnAnalytics;