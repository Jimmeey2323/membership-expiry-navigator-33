
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MembershipData } from "@/types/membership";
import { MessageCircle, Calendar, MapPin, Dumbbell, DollarSign, User } from "lucide-react";

interface MemberCardProps {
  member: MembershipData;
  onOpenAnnotations: (member: MembershipData) => void;
}

export const MemberCard = ({ member, onOpenAnnotations }: MemberCardProps) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300';
  };

  const hasAnnotations = member.comments || member.notes || (member.tags && member.tags.length > 0);

  return (
    <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">
                {member.firstName} {member.lastName}
              </CardTitle>
              <p className="text-sm text-gray-600">{member.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(member.status)}>
              {member.status}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenAnnotations(member)}
              className={`${hasAnnotations ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 text-gray-600'} hover:bg-blue-100`}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {hasAnnotations ? 'View' : 'Add'} Notes
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">ID:</span>
            <span className="text-gray-900 font-medium">{member.memberId}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Location:</span>
            <span className="text-gray-900">{member.location}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Sessions:</span>
            <span className="text-gray-900 font-medium">{member.sessionsLeft}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Paid:</span>
            <span className="text-gray-900">{member.paid || 'N/A'}</span>
          </div>
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-600">
            <span className="font-medium">Membership:</span> {member.membershipName}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            <span className="font-medium">Expires:</span> {formatDate(member.endDate)}
          </div>
        </div>
        
        {hasAnnotations && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex flex-wrap gap-1">
              {member.tags?.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                  {tag}
                </Badge>
              ))}
              {member.tags && member.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                  +{member.tags.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
