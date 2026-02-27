'use client';

import { useCallback, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SurveyBuilder from '@/components/surveys/SurveyBuilder';
import {
  getAllSurveys,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  activateSurvey,
  closeSurvey,
  getResponses,
} from '@/lib/services/surveyService';
import { useAuth } from '@/context/AuthContext';
import type { Survey, SurveyQuestion, SurveyResponse } from '@/types';
import { toast } from 'sonner';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Play,
  Square,
  Copy,
  ListChecks,
  BarChart3,
  Loader2,
  FileText,
  ExternalLink,
} from 'lucide-react';

export default function SurveysPage() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');

  // Builder state
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);

  // Analytics state
  const [analyticsSurvey, setAnalyticsSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const loadSurveys = useCallback(async () => {
    try {
      const data = await getAllSurveys();
      setSurveys(data);
    } catch (error) {
      console.error('Error loading surveys:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  const openBuilder = (survey?: Survey) => {
    if (survey) {
      setEditingSurvey(survey);
      setTitle(survey.title);
      setDescription(survey.description);
      setQuestions(survey.questions);
    } else {
      setEditingSurvey(null);
      setTitle('');
      setDescription('');
      setQuestions([]);
    }
    setActiveTab('builder');
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    try {
      if (editingSurvey) {
        await updateSurvey(editingSurvey.id, { title, description, questions });
        toast.success('Survey updated');
      } else {
        await createSurvey({
          title,
          description,
          status: 'draft',
          questions,
          createdBy: user?.uid || '',
        });
        toast.success('Survey created');
      }
      loadSurveys();
      setActiveTab('list');
    } catch {
      toast.error('Failed to save survey');
    }
  };

  const handleDelete = async (survey: Survey) => {
    if (!confirm(`Delete "${survey.title}"?`)) return;
    await deleteSurvey(survey.id);
    toast.success('Survey deleted');
    loadSurveys();
  };

  const handleActivate = async (survey: Survey) => {
    await activateSurvey(survey.id);
    toast.success('Survey activated');
    loadSurveys();
  };

  const handleClose = async (survey: Survey) => {
    await closeSurvey(survey.id);
    toast.success('Survey closed');
    loadSurveys();
  };

  const openAnalytics = async (survey: Survey) => {
    setAnalyticsSurvey(survey);
    setLoadingAnalytics(true);
    setActiveTab('analytics');
    try {
      const resps = await getResponses(survey.id);
      setResponses(resps);
    } catch {
      setResponses([]);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const copyLink = (surveyId: string) => {
    const url = `${window.location.origin}/surveys/${surveyId}`;
    navigator.clipboard.writeText(url);
    toast.success('Survey link copied!');
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      closed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] || ''}`}>
        {status}
      </span>
    );
  };

  // ── Analytics helpers ──
  const getQuestionStats = (questionId: string) => {
    const answers = responses
      .map((r) => r.answers[questionId])
      .filter((a) => a !== undefined && a !== null);
    return answers;
  };

  const getChoiceCounts = (questionId: string, options: string[]) => {
    const answers = getQuestionStats(questionId);
    const counts: Record<string, number> = {};
    options.forEach((opt) => (counts[opt] = 0));
    answers.forEach((a) => {
      if (Array.isArray(a)) {
        (a as string[]).forEach((v) => { if (counts[v] !== undefined) counts[v]++; });
      } else if (typeof a === 'string' && counts[a] !== undefined) {
        counts[a]++;
      }
    });
    return counts;
  };

  const getNumericAvg = (questionId: string) => {
    const answers = getQuestionStats(questionId).map(Number).filter((n) => !isNaN(n));
    if (answers.length === 0) return 0;
    return (answers.reduce((a, b) => a + b, 0) / answers.length).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Surveys</h1>
          <p className="mt-1 text-muted-foreground">
            Create surveys, collect responses, and view analytics.
          </p>
        </div>
        <Button
          onClick={() => openBuilder()}
          style={{ backgroundColor: 'var(--solatube-blue)' }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Survey
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <ListChecks className="h-4 w-4" />
            All Surveys
          </TabsTrigger>
          <TabsTrigger value="builder" className="gap-2">
            <FileText className="h-4 w-4" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* ── LIST TAB ── */}
        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </CardContent>
            </Card>
          ) : surveys.length === 0 ? (
            <Card>
              <CardContent className="flex h-48 flex-col items-center justify-center gap-2">
                <ListChecks className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No surveys yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Survey</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveys.map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell>
                        <p className="font-medium">{survey.title}</p>
                        {survey.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {survey.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{survey.questions.length}</Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={survey.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {survey.createdAt.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
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
                            <DropdownMenuItem onClick={() => openBuilder(survey)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openAnalytics(survey)}>
                              <BarChart3 className="mr-2 h-3.5 w-3.5" />
                              Analytics
                            </DropdownMenuItem>
                            {survey.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleActivate(survey)}>
                                <Play className="mr-2 h-3.5 w-3.5" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {survey.status === 'active' && (
                              <>
                                <DropdownMenuItem onClick={() => copyLink(survey.id)}>
                                  <Copy className="mr-2 h-3.5 w-3.5" />
                                  Copy Link
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleClose(survey)}>
                                  <Square className="mr-2 h-3.5 w-3.5" />
                                  Close
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(survey)}
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
        </TabsContent>

        {/* ── BUILDER TAB ── */}
        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {editingSurvey ? 'Edit Survey' : 'New Survey'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Dealer Satisfaction Survey"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description…"
                    className="min-h-[38px] resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <SurveyBuilder questions={questions} onChange={setQuestions} />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActiveTab('list')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()}>
              {editingSurvey ? 'Update Survey' : 'Create Survey'}
            </Button>
          </div>
        </TabsContent>

        {/* ── ANALYTICS TAB ── */}
        <TabsContent value="analytics" className="space-y-4">
          {!analyticsSurvey ? (
            <Card>
              <CardContent className="flex h-48 flex-col items-center justify-center gap-2">
                <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Select a survey from the list to view analytics.
                </p>
              </CardContent>
            </Card>
          ) : loadingAnalytics ? (
            <Card>
              <CardContent className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{analyticsSurvey.title}</CardTitle>
                      <CardDescription>
                        {responses.length} response{responses.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    {analyticsSurvey.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => window.open(`/surveys/${analyticsSurvey.id}`, '_blank')}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Survey
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>

              {responses.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">No responses yet.</p>
                  </CardContent>
                </Card>
              ) : (
                analyticsSurvey.questions.map((q, i) => (
                  <Card key={q.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        Q{i + 1}: {q.text || 'Untitled'}
                      </CardTitle>
                      <CardDescription className="text-xs">{q.type}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Choice-type analytics */}
                      {['single-choice', 'multiple-choice', 'dropdown', 'ranking', 'true-false'].includes(q.type) && (
                        <div className="space-y-2">
                          {Object.entries(
                            getChoiceCounts(
                              q.id,
                              q.type === 'true-false' ? ['True', 'False'] : q.options || []
                            )
                          ).map(([option, count]) => {
                            const pct = responses.length > 0 ? (count / responses.length) * 100 : 0;
                            return (
                              <div key={option}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span>{option}</span>
                                  <span className="text-muted-foreground">
                                    {count} ({pct.toFixed(0)}%)
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor: '#0082c4',
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Numeric analytics */}
                      {['star-rating', 'number-scale', 'likert-scale'].includes(q.type) && (
                        <div className="text-center py-2">
                          <p className="text-3xl font-bold" style={{ color: '#0082c4' }}>
                            {getNumericAvg(q.id)}
                          </p>
                          <p className="text-xs text-muted-foreground">Average</p>
                        </div>
                      )}

                      {/* Text analytics */}
                      {['short-answer', 'long-answer'].includes(q.type) && (
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {getQuestionStats(q.id).map((a, j) => (
                            <p key={j} className="rounded bg-muted px-2 py-1 text-xs">
                              {String(a)}
                            </p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
