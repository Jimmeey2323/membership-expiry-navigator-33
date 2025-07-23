
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Save, MessageCircle, StickyNote, Tag, Calendar, Search, Filter, Clock, User, Star, Archive, Edit2, Trash2, MoreVertical } from "lucide-react";
import { MembershipData } from "@/types/membership";
import { googleSheetsService } from "@/services/googleSheets";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TimestampedNote {
  id: string;
  content: string;
  timestamp: string;
  type: 'comment' | 'note';
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  isArchived?: boolean;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'notes' | 'tags'>('comments');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const categories = ['General', 'Follow-up', 'Billing', 'Complaint', 'Compliment', 'Technical', 'Renewal'];

  useEffect(() => {
    if (member) {
      // Parse existing comments and notes from the member data
      const existingComments = member.comments ? 
        member.comments.split('|||').map((comment, index) => ({
          id: `comment-${index}`,
          content: comment.split(':::')?.[0] || comment,
          timestamp: comment.split(':::')?.[1] || new Date().toISOString(),
          type: 'comment' as const,
          priority: (comment.split(':::')?.[2] as 'low' | 'medium' | 'high') || 'medium',
          category: comment.split(':::')?.[3] || 'General',
          isArchived: comment.split(':::')?.[4] === 'true'
        })) : [];

      const existingNotes = member.notes ? 
        member.notes.split('|||').map((note, index) => ({
          id: `note-${index}`,
          content: note.split(':::')?.[0] || note,
          timestamp: note.split(':::')?.[1] || new Date().toISOString(),
          type: 'note' as const,
          priority: (note.split(':::')?.[2] as 'low' | 'medium' | 'high') || 'medium',
          category: note.split(':::')?.[3] || 'General',
          isArchived: note.split(':::')?.[4] === 'true'
        })) : [];

      setComments(existingComments);
      setNotes(existingNotes);
      setTags(member.tags || []);
    }
  }, [member]);

  const filteredComments = comments.filter(comment => {
    const matchesSearch = comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchived = showArchived ? true : !comment.isArchived;
    return matchesSearch && matchesArchived;
  });

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchived = showArchived ? true : !note.isArchived;
    return matchesSearch && matchesArchived;
  });

  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj: TimestampedNote = {
        id: `comment-${Date.now()}`,
        content: newComment.trim(),
        timestamp: new Date().toISOString(),
        type: 'comment',
        priority: selectedPriority,
        category: selectedCategory,
        isArchived: false
      };
      setComments([newCommentObj, ...comments]);
      setNewComment('');
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      const newNoteObj: TimestampedNote = {
        id: `note-${Date.now()}`,
        content: newNote.trim(),
        timestamp: new Date().toISOString(),
        type: 'note',
        priority: selectedPriority,
        category: selectedCategory,
        isArchived: false
      };
      setNotes([newNoteObj, ...notes]);
      setNewNote('');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleToggleArchive = (id: string, type: 'comment' | 'note') => {
    if (type === 'comment') {
      setComments(comments.map(comment => 
        comment.id === id ? { ...comment, isArchived: !comment.isArchived } : comment
      ));
    } else {
      setNotes(notes.map(note => 
        note.id === id ? { ...note, isArchived: !note.isArchived } : note
      ));
    }
  };

  const handleRemoveItem = (id: string, type: 'comment' | 'note') => {
    if (type === 'comment') {
      setComments(comments.filter(comment => comment.id !== id));
    } else {
      setNotes(notes.filter(note => note.id !== id));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!member) return;
    
    setIsSaving(true);
    try {
      const commentsString = comments.map(c => 
        `${c.content}:::${c.timestamp}:::${c.priority}:::${c.category}:::${c.isArchived}`
      ).join('|||');
      
      const notesString = notes.map(n => 
        `${n.content}:::${n.timestamp}:::${n.priority}:::${n.category}:::${n.isArchived}`
      ).join('|||');
      
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Star className="h-3 w-3 fill-current" />;
      case 'medium': return <Clock className="h-3 w-3" />;
      case 'low': return <Archive className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-white to-gray-50 border-0 shadow-2xl">
        <DialogHeader className="border-b border-gray-100 pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span>{member.firstName} {member.lastName}</span>
                <Badge variant="outline" className="text-xs font-medium">
                  ID: {member.memberId}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 font-normal mt-1">{member.email}</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 p-1">
          {/* Premium Member Info Card */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
            <div className="grid grid-cols-4 gap-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{member.sessionsLeft}</div>
                <div className="text-gray-600">Sessions Left</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{member.membershipName}</div>
                <div className="text-gray-600">Membership</div>
              </div>
              <div className="text-center">
                <Badge variant={member.status === 'Active' ? "default" : "destructive"} className="text-xs">
                  {member.status}
                </Badge>
                <div className="text-gray-600 mt-1">Status</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{member.location}</div>
                <div className="text-gray-600">Location</div>
              </div>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search annotations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-500"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className={cn(
                "transition-all duration-200",
                showArchived ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200"
              )}
            >
              <Archive className="h-4 w-4 mr-2" />
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </Button>
          </div>

          {/* Premium Tab Navigation */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            {[
              { id: 'comments', label: 'Comments', icon: MessageCircle, count: filteredComments.length },
              { id: 'notes', label: 'Notes', icon: StickyNote, count: filteredNotes.length },
              { id: 'tags', label: 'Tags', icon: Tag, count: tags.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 font-medium",
                  activeTab === tab.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                <Badge variant="secondary" className="text-xs">{tab.count}</Badge>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="space-y-6">
            {activeTab === 'comments' && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <MessageCircle className="h-5 w-5" />
                    Comments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Comment Form */}
                  <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-3">
                    <div className="flex gap-3">
                      <select
                        value={selectedPriority}
                        onChange={(e) => setSelectedPriority(e.target.value as any)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <Textarea
                      placeholder="Add a new comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] border-gray-200 focus:border-blue-500 resize-none"
                    />
                    <Button 
                      onClick={handleAddComment} 
                      disabled={!newComment.trim()}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Comment
                    </Button>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {filteredComments.map((comment) => (
                      <div key={comment.id} className={cn(
                        "bg-white p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
                        comment.isArchived ? "border-gray-200 opacity-60" : "border-blue-100"
                      )}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={cn("text-xs", getPriorityColor(comment.priority || 'medium'))}>
                              {getPriorityIcon(comment.priority || 'medium')}
                              {comment.priority?.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {comment.category}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {formatDate(comment.timestamp)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => handleToggleArchive(comment.id, 'comment')}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                            >
                              <Archive className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => handleRemoveItem(comment.id, 'comment')}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                      </div>
                    ))}
                    {filteredComments.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No comments found.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notes' && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <StickyNote className="h-5 w-5" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Note Form */}
                  <div className="bg-white p-4 rounded-xl border border-green-100 space-y-3">
                    <div className="flex gap-3">
                      <select
                        value={selectedPriority}
                        onChange={(e) => setSelectedPriority(e.target.value as any)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <Textarea
                      placeholder="Add a new note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[80px] border-gray-200 focus:border-green-500 resize-none"
                    />
                    <Button 
                      onClick={handleAddNote} 
                      disabled={!newNote.trim()}
                      className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {filteredNotes.map((note) => (
                      <div key={note.id} className={cn(
                        "bg-white p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
                        note.isArchived ? "border-gray-200 opacity-60" : "border-green-100"
                      )}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={cn("text-xs", getPriorityColor(note.priority || 'medium'))}>
                              {getPriorityIcon(note.priority || 'medium')}
                              {note.priority?.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {note.category}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {formatDate(note.timestamp)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => handleToggleArchive(note.id, 'note')}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-green-600"
                            >
                              <Archive className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => handleRemoveItem(note.id, 'note')}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
                      </div>
                    ))}
                    {filteredNotes.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No notes found.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'tags' && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Tag Form */}
                  <div className="bg-white p-4 rounded-xl border border-purple-100 space-y-3">
                    <div className="flex gap-3">
                      <Input
                        placeholder="Add a new tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        className="flex-1 border-gray-200 focus:border-purple-500"
                      />
                      <Button 
                        onClick={handleAddTag} 
                        disabled={!newTag.trim()}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Tags Display */}
                  <div className="bg-white p-4 rounded-xl border border-purple-100">
                    {tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1 bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 transition-colors">
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:bg-red-200 rounded-full p-0.5 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No tags added yet.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Premium Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isSaving}
              className="px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
            >
              {isSaving ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save All Annotations
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
