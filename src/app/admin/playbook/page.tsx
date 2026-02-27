'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  getAllPlaybooks,
  createPlaybook,
  updatePlaybook,
  deletePlaybook,
  setActivePlaybook,
} from '@/lib/services/playbookService';
import type { Playbook, PlaybookStep } from '@/types';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Loader2,
  BookOpen,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Pencil,
  Play,
} from 'lucide-react';

export default function PlaybookConfigurationPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Playbook | null>(null);

  // Editor state
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<PlaybookStep[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);

  const loadPlaybooks = useCallback(async () => {
    try {
      const data = await getAllPlaybooks();
      setPlaybooks(data);
    } catch (error) {
      console.error('Error loading playbooks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaybooks();
  }, [loadPlaybooks]);

  const openEditor = (pb?: Playbook) => {
    if (pb) {
      setEditing(pb);
      setName(pb.name);
      setSteps(pb.steps);
    } else {
      setEditing(null);
      setName('');
      setSteps([]);
    }
    setEditorOpen(true);
  };

  const addStep = () => {
    const newStep: PlaybookStep = {
      id: `step-${Date.now()}`,
      order: steps.length,
      name: '',
      goal: '',
      infoToCollect: [],
      aiInstructions: '',
      advancementCriteria: '',
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (id: string, data: Partial<PlaybookStep>) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const removeStep = (id: string) => {
    setSteps(
      steps.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i }))
    );
  };

  const moveStep = (index: number, dir: -1 | 1) => {
    const newSteps = [...steps];
    const target = index + dir;
    if (target < 0 || target >= newSteps.length) return;
    [newSteps[index], newSteps[target]] = [newSteps[target], newSteps[index]];
    setSteps(newSteps.map((s, i) => ({ ...s, order: i })));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editing) {
        await updatePlaybook(editing.id, { name, steps });
        toast.success('Playbook updated');
      } else {
        await createPlaybook({ name, steps, isActive: false });
        toast.success('Playbook created');
      }
      setEditorOpen(false);
      loadPlaybooks();
    } catch {
      toast.error('Failed to save playbook');
    }
  };

  const handleDelete = async (pb: Playbook) => {
    if (!confirm(`Delete "${pb.name}"?`)) return;
    await deletePlaybook(pb.id);
    toast.success('Playbook deleted');
    loadPlaybooks();
  };

  const handleActivate = async (pb: Playbook) => {
    await setActivePlaybook(pb.id);
    toast.success(`"${pb.name}" is now active`);
    loadPlaybooks();
  };

  // Info-to-collect helper
  const addInfoItem = (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;
    updateStep(stepId, { infoToCollect: [...step.infoToCollect, ''] });
  };

  const updateInfoItem = (stepId: string, index: number, value: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;
    const items = [...step.infoToCollect];
    items[index] = value;
    updateStep(stepId, { infoToCollect: items });
  };

  const removeInfoItem = (stepId: string, index: number) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;
    updateStep(stepId, { infoToCollect: step.infoToCollect.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Playbook Configuration</h1>
          <p className="mt-1 text-muted-foreground">
            Configure AI qualification playbook steps.
          </p>
        </div>
        <Button className="gap-2" onClick={() => openEditor()}>
          <Plus className="h-4 w-4" />
          New Playbook
        </Button>
      </div>

      {/* Playbook list */}
      {loading ? (
        <Card>
          <CardContent className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
      ) : playbooks.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center gap-2">
            <BookOpen className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No playbooks configured</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {playbooks.map((pb) => (
            <Card key={pb.id} className={`relative ${pb.isActive ? 'ring-2 ring-[#0082c4]' : ''}`}>
              {pb.isActive && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-[#0082c4] gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{pb.name}</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">
                  {pb.steps.length} step{pb.steps.length !== 1 ? 's' : ''} · Updated {pb.updatedAt.toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                {pb.steps.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {pb.steps.map((step, i) => (
                      <div key={step.id} className="flex items-center gap-2 text-xs">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                          {i + 1}
                        </span>
                        <span>{step.name || 'Untitled step'}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => openEditor(pb)}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  {!pb.isActive && (
                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => handleActivate(pb)}>
                      <Play className="h-3 w-3" /> Activate
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => handleDelete(pb)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Playbook' : 'New Playbook'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Playbook Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard Qualification" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Steps ({steps.length})</Label>
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addStep}>
                  <Plus className="h-3 w-3" /> Add Step
                </Button>
              </div>

              {steps.map((step, i) => (
                <Card key={step.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Step {i + 1}</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveStep(i, -1)} disabled={i === 0}>
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1}>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeStep(step.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Step Name</Label>
                        <Input value={step.name} onChange={(e) => updateStep(step.id, { name: e.target.value })} placeholder="e.g. Initial Contact" className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Goal</Label>
                        <Input value={step.goal} onChange={(e) => updateStep(step.id, { goal: e.target.value })} placeholder="What this step achieves" className="h-8 text-xs" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">AI Instructions</Label>
                      <Textarea value={step.aiInstructions} onChange={(e) => updateStep(step.id, { aiInstructions: e.target.value })} placeholder="Instructions for the AI during this step…" className="text-xs min-h-[60px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Advancement Criteria</Label>
                        <Input value={step.advancementCriteria} onChange={(e) => updateStep(step.id, { advancementCriteria: e.target.value })} placeholder="When to advance" className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Disqualification Criteria</Label>
                        <Input value={step.disqualificationCriteria || ''} onChange={(e) => updateStep(step.id, { disqualificationCriteria: e.target.value })} placeholder="When to disqualify" className="h-8 text-xs" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Info to Collect</Label>
                      {step.infoToCollect.map((item, j) => (
                        <div key={j} className="flex gap-1">
                          <Input value={item} onChange={(e) => updateInfoItem(step.id, j, e.target.value)} className="h-7 text-xs flex-1" placeholder="Data point…" />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeInfoItem(step.id, j)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => addInfoItem(step.id)}>
                        <Plus className="h-3 w-3" /> Add Item
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!name.trim()}>{editing ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
