import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp, Search, ArrowUpDown, MessageSquare, FileText, Eye, TrendingUp, Calendar } from "lucide-react";
import { MembershipData } from "@/types/membership";
import { MemberAnnotations } from "./MemberAnnotations";
interface DataTableProps {
  data: MembershipData[];
  title: string;
  className?: string;
  onAnnotationUpdate?: (memberId: string, comments: string, notes: string, tags: string[]) => void;
}
type SortField = keyof MembershipData;
type SortDirection = 'asc' | 'desc';
export const DataTable = ({
  data,
  title,
  className = '',
  onAnnotationUpdate
}: DataTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('endDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<MembershipData | null>(null);
  const [isAnnotationOpen, setIsAnnotationOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const itemsPerPage = 15;
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => Object.values(item).some(value => value.toString().toLowerCase().includes(searchTerm.toLowerCase())));
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [data, searchTerm, sortField, sortDirection]);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage]);
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };
  const toggleRowExpansion = (memberId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId);
    } else {
      newExpanded.add(memberId);
    }
    setExpandedRows(newExpanded);
  };
  const handleOpenAnnotations = (member: MembershipData) => {
    setSelectedMember(member);
    setIsAnnotationOpen(true);
  };
  const handleAnnotationSave = (memberId: string, comments: string, notes: string, tags: string[]) => {
    if (onAnnotationUpdate) {
      onAnnotationUpdate(memberId, comments, notes, tags);
    }
    setIsAnnotationOpen(false);
    setSelectedMember(null);
  };
  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  return <>
      <TooltipProvider>
        <Card className={`business-card shadow-xl border-2 border-slate-100 ${className}`}>
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                {title}
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input placeholder="Search members..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 pr-4 py-3 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl w-80 transition-all duration-200" />
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 px-4 py-2 text-sm font-semibold border border-blue-200">
                  {filteredAndSortedData.length} records
                </Badge>
              </div>
            </div>

            <div className="border-2 border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200 h-12">
                    <TableHead className="text-slate-700 font-bold h-12">
                      <Button variant="ghost" className="h-auto p-0 font-bold text-slate-700 hover:text-blue-600" onClick={() => handleSort('memberId')}>
                        Member ID {getSortIcon('memberId')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-700 font-bold h-12">
                      <Button variant="ghost" className="h-auto p-0 font-bold text-slate-700 hover:text-blue-600" onClick={() => handleSort('firstName')}>
                        Name {getSortIcon('firstName')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-700 font-bold h-12">Email</TableHead>
                    <TableHead className="text-slate-700 font-bold h-12">
                      <Button variant="ghost" className="h-auto p-0 font-bold text-slate-700 hover:text-blue-600" onClick={() => handleSort('membershipName')}>
                        Membership {getSortIcon('membershipName')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-700 font-bold h-12">
                      <Button variant="ghost" className="h-auto p-0 font-bold text-slate-700 hover:text-blue-600" onClick={() => handleSort('endDate')}>
                        Expiry {getSortIcon('endDate')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-700 font-bold h-12">Location</TableHead>
                    <TableHead className="text-slate-700 font-bold h-12">
                      <Button variant="ghost" className="h-auto p-0 font-bold text-slate-700 hover:text-blue-600" onClick={() => handleSort('sessionsLeft')}>
                        Sessions {getSortIcon('sessionsLeft')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-700 font-bold h-12">
                      <Button variant="ghost" className="h-auto p-0 font-bold text-slate-700 hover:text-blue-600" onClick={() => handleSort('status')}>
                        Status {getSortIcon('status')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-700 font-bold h-12">Tags</TableHead>
                    <TableHead className="text-slate-700 font-bold h-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map(member => {
                  const daysUntilExpiry = getDaysUntilExpiry(member.endDate);
                  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                  const isExpanded = expandedRows.has(member.memberId);
                  return <>
                        <TableRow key={member.uniqueId} className="border-b border-slate-100 hover:bg-slate-50 transition-all duration-150 h-10" style={{
                      height: '40px'
                    }}>
                          <TableCell className="text-slate-800 font-mono text-sm h-10 py-2">{member.memberId}</TableCell>
                          <TableCell className="text-slate-800 font-medium h-10 py-2 min-w-52">
                            <div className="flex items-center gap-2">
                              {member.firstName} {member.lastName}
                              <Button variant="ghost" size="sm" onClick={() => toggleRowExpansion(member.memberId)} className="h-6 w-6 p-0 hover:bg-blue-100">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 h-10 py-2 min-w-52">{member.email}</TableCell>
                          <TableCell className="text-slate-600 h-10 py-2 min-w-64">
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="max-w-64">
                                  {member.membershipName}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{member.membershipName}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-slate-600 h-10 py-2 min-w-36">
                            <div className="flex items-center gap-2">
                              <span>{new Date(member.endDate).toLocaleDateString()}</span>
                              {isExpiringSoon && <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                      {daysUntilExpiry}d
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Expires in {daysUntilExpiry} days</p>
                                  </TooltipContent>
                                </Tooltip>}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 h-10 py-2 min-w-64">{member.location}</TableCell>
                          <TableCell className="text-center h-10 py-2">
                            <Badge variant={member.sessionsLeft > 5 ? "default" : member.sessionsLeft > 0 ? "secondary" : "destructive"} className="font-bold">
                              {member.sessionsLeft}
                            </Badge>
                          </TableCell>
                          <TableCell className="h-10 py-2">
                            <Badge variant={member.status === 'Active' ? "default" : "destructive"} className={member.status === 'Active' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : ''}>
                              {member.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="h-10 py-2">
                            <div className="flex flex-wrap gap-1">
                              {member.tags?.slice(0, 2).map((tag, index) => <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  {tag}
                                </Badge>)}
                              {member.tags && member.tags.length > 2 && <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600">
                                      +{member.tags.length - 2}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      {member.tags.slice(2).map((tag, index) => <div key={index} className="text-xs">{tag}</div>)}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>}
                            </div>
                          </TableCell>
                          <TableCell className="h-10 py-2">
                            <div className="flex gap-1">
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button variant="ghost" size="sm" onClick={() => handleOpenAnnotations(member)} className="h-8 w-8 p-0 hover:bg-blue-100">
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Add notes & tags</p>
                                </TooltipContent>
                              </Tooltip>
                              {(member.comments || member.notes) && <div className="w-2 h-2 bg-blue-600 rounded-full mt-3" title="Has annotations" />}
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {isExpanded && <TableRow className="bg-slate-50 border-b border-slate-200">
                            <TableCell colSpan={10} className="p-6">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Order Details
                                  </h4>
                                   <p className="text-sm text-slate-600">Order Date: {new Date(member.orderDate).toLocaleDateString()}</p>
                                   <p className="text-sm text-slate-600">End Date: {new Date(member.endDate).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Activity
                                  </h4>
                                   <p className="text-sm text-slate-600">Sessions Remaining: {member.sessionsLeft}</p>
                                   <p className="text-sm text-slate-600">Frozen Status: {member.frozen || 'No'}</p>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-slate-700">Contact</h4>
                                   <p className="text-sm text-slate-600">Email: {member.email}</p>
                                   <p className="text-sm text-slate-600">Member ID: {member.memberId}</p>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-slate-700">Notes</h4>
                                  <p className="text-sm text-slate-600">{member.comments || member.notes || 'No notes available'}</p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>}
                      </>;
                })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && <div className="flex items-center justify-between mt-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-slate-600 text-sm font-medium">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="border-slate-300 hover:bg-white">
                    Previous
                  </Button>
                  <div className="flex items-center px-3 py-1 bg-white border border-slate-300 rounded text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="border-slate-300 hover:bg-white">
                    Next
                  </Button>
                </div>
              </div>}
          </div>
        </Card>
      </TooltipProvider>

      <MemberAnnotations member={selectedMember} isOpen={isAnnotationOpen} onClose={() => {
      setIsAnnotationOpen(false);
      setSelectedMember(null);
    }} onSave={handleAnnotationSave} />
    </>;
};