
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Save, MessageCircle, StickyNote, Tag, Calendar } from "lucide-react";
import { MembershipData } from "@/types/membership";
import { googleSheetsService } from "@/services/googleSheets";
import { toast } from "sonner";

interface TimestampedNote {
  id: string;
  content: string;
  timestamp: string;
  type: 'comment' | 'note';
}

interface MemberAnnotationsProps {
  member: MembershipData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberId: string, comments: string, notes: string, tags: string[]) => void;
}

export const MemberAnnotations = ({ member, isOpen, onClose, onSave }: MemberAnnotationsProps) => {
  const [comments, setComments] = useState<TimestampedNote[]>([]);
  const [notes, setNotes] = useState<TimestampedNote[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (member) {
      // Parse existing comments and notes from the member data
      const existingComments = member.comments ? 
        member.comments.split('|||').map((comment, index) => ({
          id: `comment-${index}`,
          content: comment.split(':::')?.[0] || comment,
          timestamp: comment.split(':::')?.[1] || new Date().toISOString(),
          type: 'comment' as const
        })) : [];

      const existingNotes = member.notes ? 
        member.notes.split('|||').map((note, index) => ({
          id: `note-${index}`,
          content: note.split(':::')?.[0] || note,
          timestamp: note.split(':::')?.[1] || new Date().toISOString(),
          type: 'note' as const
        })) : [];

      setComments(existingComments);
      setNotes(existingNotes);
      setTags(member.tags || []);
    }
  }, [member]);

  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj: TimestampedNote = {
        id: `comment-${Date.now()}`,
        content: newComment.trim(),
        timestamp: new Date().toISOString(),
        type: 'comment'
      };
      setComments([...comments, newCommentObj]);
      setNewComment('');
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      const newNoteObj: TimestampedNote = {
        id: `note-${Date.now()}`,
        content: newNote.trim(),
        timestamp: new Date().toISOString(),
        type: 'note'
      };
      setNotes([...notes, newNoteObj]);
      setNewNote('');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleRemoveComment = (commentId: string) => {
    setComments(comments.filter(comment => comment.id !== commentId));
  };

  const handleRemoveNote = (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId));
  };

  const handleSave = async () => {
    if (!member) return;
    
    setIsSaving(true);
    try {
      // Convert timestamped notes back to string format for storage
      const commentsString = comments.map(c => `${c.content}:::${c.timestamp}`).join('|||');
      const notesString = notes.map(n => `${n.content}:::${n.timestamp}`).join('|||');
      
      await googleSheetsService.saveAnnotation(
        member.memberId,
        member.email,
        commentsString,
        notesString,
        tags
      );
      
      onSave(member.memberId, commentsString, notesString, tags);
      toast.success("Annotations saved successfully!");
      onClose();
    } catch (error) {
      console.error('Error saving annotations:', error);
      toast.error("Failed to save annotations. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Save className="h-5 w-5 text-blue-600" />
            </div>
            Member Annotations: {member.firstName} {member.lastName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Member Info */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Member ID:</span> 
                  <span className="ml-2 text-gray-900">{member.memberId}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span> 
                  <span className="ml-2 text-gray-900">{member.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Membership:</span> 
                  <span className="ml-2 text-gray-900">{member.membershipName}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span> 
                  <Badge variant={member.status === 'Active' ? "default" : "destructive"} className="ml-2">
                    {member.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Comments Section */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <MessageCircle className="h-5 w-5" />
                  Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new comment */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a new comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] border-gray-300 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && e.ctrlKey && handleAddComment()}
                  />
                  <Button 
                    onClick={handleAddComment} 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!newComment.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Comment
                  </Button>
                </div>

                <Separator />

                {/* Display comments */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <Calendar className="h-3 w-3" />
                          {formatDate(comment.timestamp)}
                        </div>
                        <Button
                          onClick={() => handleRemoveComment(comment.id)}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-900">{comment.content}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No comments yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <StickyNote className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new note */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a new note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[60px] border-gray-300 focus:border-green-500"
                    onKeyPress={(e) => e.key === 'Enter' && e.ctrlKey && handleAddNote()}
                  />
                  <Button 
                    onClick={handleAddNote} 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={!newNote.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>

                <Separator />

                {/* Display notes */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <Calendar className="h-3 w-3" />
                          {formatDate(note.timestamp)}
                        </div>
                        <Button
                          onClick={() => handleRemoveNote(note.id)}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-900">{note.content}</p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No notes yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tags Section */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Tag className="h-5 w-5" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Add new tag */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 border-gray-300 focus:border-purple-500"
                />
                <Button 
                  onClick={handleAddTag} 
                  size="sm" 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!newTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Display tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 bg-purple-100 text-purple-800 border-purple-300">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isSaving}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? 'Saving...' : 'Save All Annotations'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
