
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save } from "lucide-react";
import { MembershipData } from "@/types/membership";
import { googleSheetsService } from "@/services/googleSheets";
import { toast } from "sonner";

interface MemberAnnotationsProps {
  member: MembershipData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberId: string, comments: string, notes: string, tags: string[]) => void;
}

export const MemberAnnotations = ({ member, isOpen, onClose, onSave }: MemberAnnotationsProps) => {
  const [comments, setComments] = useState(member?.comments || '');
  const [notes, setNotes] = useState(member?.notes || '');
  const [tags, setTags] = useState<string[]>(member?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!member) return;
    
    setIsSaving(true);
    try {
      await googleSheetsService.saveAnnotation(
        member.memberId,
        member.email,
        comments,
        notes,
        tags
      );
      
      onSave(member.memberId, comments, notes, tags);
      toast.success("Annotations saved successfully!");
      onClose();
    } catch (error) {
      console.error('Error saving annotations:', error);
      toast.error("Failed to save annotations. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Save className="h-5 w-5 text-primary" />
            </div>
            Add Notes & Tags for {member.firstName} {member.lastName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Member Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Member ID:</span> {member.memberId}
              </div>
              <div>
                <span className="font-medium">Email:</span> {member.email}
              </div>
              <div>
                <span className="font-medium">Membership:</span> {member.membershipName}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <Badge variant={member.status === 'Active' ? "default" : "destructive"} className="ml-2">
                  {member.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-base font-medium">Comments</Label>
            <Textarea
              id="comments"
              placeholder="Add any comments about this member..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-medium">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add internal notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Tags</Label>
            
            {/* Add new tag */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a new tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleAddTag} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Display tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Annotations'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
