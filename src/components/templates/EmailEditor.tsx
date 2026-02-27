'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, ArrowLeft, Eye, Code } from 'lucide-react';

interface EmailEditorProps {
    initialJson?: string;
    onSave: (html: string, json: string) => Promise<void>;
    onBack: () => void;
}

export default function EmailEditor({
    initialJson,
    onSave,
    onBack,
}: EmailEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gjsRef = useRef<any>(null);
    const [saving, setSaving] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!editorRef.current || gjsRef.current) return;

        const initEditor = async () => {
            const grapesjs = (await import('grapesjs')).default;
            const newsletterPlugin = (await import('grapesjs-preset-newsletter')).default;

            // Import GrapesJS CSS
            if (!document.getElementById('gjs-css')) {
                const link = document.createElement('link');
                link.id = 'gjs-css';
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/grapesjs@0.22.14/dist/css/grapes.min.css';
                document.head.appendChild(link);
            }

            const editor = grapesjs.init({
                container: editorRef.current!,
                height: '100%',
                width: 'auto',
                storageManager: false,
                plugins: [newsletterPlugin],
                pluginsOpts: {
                    [newsletterPlugin as unknown as string]: {
                        modalTitleImport: 'Import HTML',
                        importPlaceholder: '<table>...</table>',
                    },
                },
                canvas: {
                    styles: [
                        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
                    ],
                },
                deviceManager: {
                    devices: [
                        { name: 'Desktop', width: '' },
                        { name: 'Tablet', width: '768px', widthMedia: '992px' },
                        { name: 'Mobile', width: '320px', widthMedia: '480px' },
                    ],
                },
            });

            // Apply Solatube brand styles to editor panels
            editor.on('load', () => {
                const style = document.createElement('style');
                style.textContent = `
          .gjs-one-bg { background-color: #1e293b; }
          .gjs-two-color { color: #94a3b8; }
          .gjs-three-bg { background-color: #0082c4; }
          .gjs-four-color, .gjs-four-color-h:hover { color: #0082c4; }
          .gjs-pn-btn.gjs-pn-active { color: #fdb927; }
        `;
                document.head.appendChild(style);
            });

            // Load existing project JSON
            if (initialJson) {
                try {
                    editor.loadProjectData(JSON.parse(initialJson));
                } catch {
                    console.warn('Could not load project JSON, starting fresh');
                }
            } else {
                // Default Solatube template
                editor.setComponents(`
          <table style="width:100%;max-width:600px;margin:0 auto;font-family:Inter,Arial,sans-serif;">
            <tr>
              <td style="background-color:#0082c4;padding:24px;text-align:center;">
                <h1 style="color:white;margin:0;font-size:24px;">Premier Dealer Portal</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 24px;background-color:#ffffff;">
                <h2 style="color:#54565a;margin:0 0 16px;">Your content here</h2>
                <p style="color:#64748b;line-height:1.6;margin:0;">
                  Start building your email by editing this content or dragging in new blocks from the right panel.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#f8fafc;padding:16px 24px;text-align:center;">
                <p style="color:#94a3b8;font-size:12px;margin:0;">
                  © 2026 Solatube International. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        `);
            }

            gjsRef.current = editor;
            setReady(true);
        };

        initEditor();

        return () => {
            if (gjsRef.current) {
                gjsRef.current.destroy();
                gjsRef.current = null;
            }
        };
    }, [initialJson]);

    const handleSave = async () => {
        if (!gjsRef.current) return;
        setSaving(true);
        try {
            const html = gjsRef.current.runCommand('gjs-get-inlined-html');
            const json = JSON.stringify(gjsRef.current.getProjectData());
            await onSave(html, json);
            toast.success('Template saved');
        } catch {
            toast.error('Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-80px)] flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b bg-background px-4 py-2">
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Templates
                </Button>
                <div className="flex items-center gap-2">
                    {ready && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (gjsRef.current) {
                                        const html = gjsRef.current.runCommand('gjs-get-inlined-html');
                                        const w = window.open('', '_blank');
                                        w?.document.write(html);
                                        w?.document.close();
                                    }
                                }}
                                className="gap-1.5"
                            >
                                <Eye className="h-3.5 w-3.5" />
                                Preview
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (gjsRef.current) {
                                        const html = gjsRef.current.runCommand('gjs-get-inlined-html');
                                        navigator.clipboard.writeText(html);
                                        toast.success('HTML copied to clipboard');
                                    }
                                }}
                                className="gap-1.5"
                            >
                                <Code className="h-3.5 w-3.5" />
                                Copy HTML
                            </Button>
                        </>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={saving || !ready}
                        style={{ backgroundColor: 'var(--solatube-blue)' }}
                        className="gap-1.5"
                    >
                        <Save className="h-3.5 w-3.5" />
                        {saving ? 'Saving…' : 'Save Template'}
                    </Button>
                </div>
            </div>

            {/* GrapesJS Canvas */}
            <div ref={editorRef} className="flex-1" />
        </div>
    );
}
