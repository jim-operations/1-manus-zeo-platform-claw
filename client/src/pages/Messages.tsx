import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { MessageSquare, Plus, Loader2, Send, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";

function MessagesContent() {
  const { user } = useAuth();
  const [selectedThread, setSelectedThread] = useState<number | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const threadsQuery = trpc.messages.threads.useQuery();
  const threads = threadsQuery.data ?? [];

  const messagesQuery = trpc.messages.getMessages.useQuery(
    { threadId: selectedThread! },
    { enabled: !!selectedThread }
  );
  const messages = messagesQuery.data ?? [];

  const userSearchQuery = trpc.messages.searchUsers.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 1 }
  );
  const searchResults = userSearchQuery.data ?? [];

  const createThreadMut = trpc.messages.createThread.useMutation({
    onSuccess: (data) => {
      toast.success("Conversation created");
      setShowCompose(false);
      setSelectedThread(data.id);
      threadsQuery.refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sendMut = trpc.messages.send.useMutation({
    onSuccess: () => {
      setNewMessage("");
      messagesQuery.refetch();
      threadsQuery.refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [composeForm, setComposeForm] = useState({
    subject: "", selectedUserIds: [] as number[], firstMessage: "",
  });

  // Thread detail view
  if (selectedThread) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-3 pb-3 border-b">
          <Button variant="ghost" size="sm" onClick={() => setSelectedThread(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">
              {threads.find((t: any) => t.id === selectedThread)?.subject || `Thread #${selectedThread}`}
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messagesQuery.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-lg px-4 py-2.5 ${
                  msg.senderId === user?.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}>
                  {msg.senderId !== user?.id && (
                    <p className="text-xs font-medium mb-1 opacity-70">User #{msg.senderId}</p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-[10px] opacity-60 mt-1">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ""}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 pt-3 border-t">
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey && newMessage.trim()) {
                e.preventDefault();
                sendMut.mutate({ threadId: selectedThread, content: newMessage.trim() });
              }
            }}
          />
          <Button
            size="sm"
            disabled={sendMut.isPending || !newMessage.trim()}
            onClick={() => sendMut.mutate({ threadId: selectedThread, content: newMessage.trim() })}
          >
            {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  }

  // Thread list view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Secure messaging between staff, principals, and parents
          </p>
        </div>
        <Button onClick={() => setShowCompose(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Message
        </Button>
      </div>

      {threadsQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : threadsQuery.error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-destructive text-sm">Error: {threadsQuery.error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => threadsQuery.refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : threads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">No conversations yet</p>
            <p className="text-muted-foreground text-xs mt-1">Start a new message thread</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {threads.map((thread: any) => (
            <Card
              key={thread.id}
              className="hover:bg-accent/30 transition-colors cursor-pointer"
              onClick={() => setSelectedThread(thread.id)}
            >
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {thread.subject || `Thread #${thread.id}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleString() : "No messages"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Compose Dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Conversation</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Subject</Label><Input value={composeForm.subject} onChange={e => setComposeForm(f => ({ ...f, subject: e.target.value }))} placeholder="Optional subject" /></div>
            <div>
              <Label>Search Users</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Type a name..." />
              </div>
              {searchResults.length > 0 && (
                <div className="border rounded-md mt-1 max-h-32 overflow-y-auto">
                  {searchResults.map((u: any) => (
                    <button
                      key={u.id}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent ${composeForm.selectedUserIds.includes(u.id) ? "bg-accent" : ""}`}
                      onClick={() => {
                        setComposeForm(f => ({
                          ...f,
                          selectedUserIds: f.selectedUserIds.includes(u.id)
                            ? f.selectedUserIds.filter(id => id !== u.id)
                            : [...f.selectedUserIds, u.id],
                        }));
                      }}
                    >
                      {u.name ?? u.email ?? `User #${u.id}`}
                    </button>
                  ))}
                </div>
              )}
              {composeForm.selectedUserIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{composeForm.selectedUserIds.length} user(s) selected</p>
              )}
            </div>
            <div><Label>First Message *</Label><Textarea value={composeForm.firstMessage} onChange={e => setComposeForm(f => ({ ...f, firstMessage: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
            <Button
              disabled={createThreadMut.isPending || composeForm.selectedUserIds.length === 0 || !composeForm.firstMessage.trim()}
              onClick={() => {
                createThreadMut.mutate({
                  subject: composeForm.subject || undefined,
                  participantIds: composeForm.selectedUserIds,
                });
              }}
            >
              {createThreadMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Start Conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Messages() {
  return (<DashboardLayout><MessagesContent /></DashboardLayout>);
}
