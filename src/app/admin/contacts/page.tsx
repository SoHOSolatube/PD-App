'use client';

import { useCallback, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ContactDialog from '@/components/contacts/ContactDialog';
import ContactNotes from '@/components/contacts/ContactNotes';
import PendingApprovalQueue from '@/components/contacts/PendingApprovalQueue';
import {
  getAllContacts,
  createContact,
  updateContact,
  deleteContact,
} from '@/lib/services/contactService';
import { getCategories, type Category } from '@/lib/services/settingsService';
import type { Contact } from '@/types';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  MessageSquare,
  Users,
  Clock,
  ArrowUpDown,
  Filter,
  X,
} from 'lucide-react';

type SortField = 'name' | 'email' | 'createdAt';
type SortDir = 'asc' | 'desc';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCats, setFilterCats] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  // Notes panel
  const [notesContact, setNotesContact] = useState<Contact | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [contactData, catData] = await Promise.all([
        getAllContacts({
          search,
          categories: filterCats.length > 0 ? filterCats : undefined,
          sortBy,
          sortDir,
        }),
        getCategories(),
      ]);
      setContacts(contactData);
      setCategories(catData);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [search, filterCats, sortBy, sortDir]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (
    data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'notes'>
  ) => {
    if (editContact) {
      await updateContact(editContact.id, data);
    } else {
      await createContact(data);
    }
    loadData();
  };

  const handleDelete = async (contact: Contact) => {
    if (!confirm(`Delete ${contact.name}?`)) return;
    try {
      await deleteContact(contact.id);
      toast.success('Contact deleted');
      loadData();
    } catch {
      toast.error('Failed to delete contact');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const toggleCatFilter = (catId: string) => {
    setFilterCats((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name || catId;

  const getCategoryColor = (catId: string) =>
    categories.find((c) => c.id === catId)?.color || '#6b7280';

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      className={`ml-1 inline h-3 w-3 ${sortBy === field ? 'text-foreground' : 'text-muted-foreground/40'
        }`}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="mt-1 text-muted-foreground">
            {contacts.length} premier dealer contact{contacts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditContact(null);
            setDialogOpen(true);
          }}
          style={{ backgroundColor: 'var(--solatube-blue)' }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Users className="h-4 w-4" />
            All Contacts
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending Approvals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {categories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Categories
                    {filterCats.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {filterCats.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {categories.map((cat) => (
                    <DropdownMenuItem
                      key={cat.id}
                      onClick={() => toggleCatFilter(cat.id)}
                      className="gap-2"
                    >
                      <div
                        className={`h-3 w-3 rounded-full border ${filterCats.includes(cat.id) ? '' : 'opacity-30'
                          }`}
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </DropdownMenuItem>
                  ))}
                  {filterCats.length > 0 && (
                    <DropdownMenuItem
                      onClick={() => setFilterCats([])}
                      className="text-muted-foreground"
                    >
                      <X className="mr-2 h-3 w-3" />
                      Clear filters
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Contact Table */}
          {loading ? (
            <Card>
              <CardContent className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </CardContent>
            </Card>
          ) : contacts.length === 0 ? (
            <Card>
              <CardContent className="flex h-48 flex-col items-center justify-center gap-2">
                <Users className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {search || filterCats.length > 0
                    ? 'No contacts match your filters.'
                    : 'No contacts yet. Add your first one!'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('name')}
                    >
                      Name <SortIcon field="name" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('email')}
                    >
                      Email <SortIcon field="email" />
                    </TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('createdAt')}
                    >
                      Created <SortIcon field="createdAt" />
                    </TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">
                        {contact.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contact.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contact.phone || '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contact.company || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {contact.categories.map((catId) => (
                            <Badge
                              key={catId}
                              variant="outline"
                              className="text-[10px]"
                              style={{
                                borderColor: getCategoryColor(catId),
                                color: getCategoryColor(catId),
                              }}
                            >
                              {getCategoryName(catId)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {contact.createdAt.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditContact(contact);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setNotesContact(contact)}
                            >
                              <MessageSquare className="mr-2 h-3.5 w-3.5" />
                              Notes ({contact.notes.length})
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(contact)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Notes Panel */}
          {notesContact && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Notes for {notesContact.name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotesContact(null)}
                >
                  Close
                </Button>
              </div>
              <ContactNotes
                contactId={notesContact.id}
                notes={notesContact.notes}
                onNoteAdded={loadData}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending">
          <PendingApprovalQueue />
        </TabsContent>
      </Tabs>

      {/* Contact Dialog */}
      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={editContact}
        categories={categories}
        onSave={handleSave}
      />
    </div>
  );
}
