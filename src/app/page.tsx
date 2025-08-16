"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, FileText, Mail } from "lucide-react";

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [prompt, setPrompt] = useState(
    "Summarize in bullet points for executives. Highlight only action items and owners."
  );
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [subject, setSubject] = useState("Meeting Summary");
  const editableRef = useRef<HTMLDivElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setTranscript(text);
  }

  async function generateSummary() {
    if (!transcript.trim()) {
      alert("Please paste or upload a transcript first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to summarize");
      setSummary(data.summary);
    } catch (err: any) {
      alert(err.message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  function getEditableHtml(): string {
    const edited = editableRef.current?.innerText || summary || "";
    return `<pre style="white-space:pre-wrap;font-family:system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">${escapeHtml(
      edited
    )}</pre>`;
  }

  async function sendEmail() {
    const recipients = emailTo
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      alert("Enter at least one recipient email (comma-separated).");
      return;
    }
    const html = getEditableHtml();
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: recipients, subject, html }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to send email");
      alert("Email sent!");
    } catch (err: any) {
      alert(err.message ?? "Unexpected error");
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-center mb-6">
        AI Meeting Notes Summarizer by Mohammad Iqbal
      </h1>
      <h2 className="text-2xl font-bold text-center mb-6">
         ki925053@gmail.com
      </h2>

      {/* Upload + Paste Transcript */}
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="font-medium mb-2 block">Upload Transcript</label>
            <Input
              type="file"
              accept=".txt,.md,.markdown"
              onChange={onFile}
              className="cursor-pointer"
            />
          </div>

          <div>
            <label className="font-medium mb-2 block">Or Paste Transcript</label>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your meeting transcript here..."
              rows={8}
            />
          </div>
        </CardContent>
      </Card>

      {/* Prompt */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Instruction / Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='e.g., "Summarize in bullet points for executives"'
          />
          <Button
            onClick={generateSummary}
            disabled={loading}
            className="mt-4 w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" /> Generate Summary
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Editable Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Editable Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            className="min-h-[200px] border rounded-md p-4 bg-muted text-sm whitespace-pre-wrap focus:outline-none"
            dangerouslySetInnerHTML={{
              __html: summary ? escapeHtml(summary) : "",
            }}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Tip: Click inside the box above to edit before emailing.
          </p>
        </CardContent>
      </Card>

      {/* Email Section */}
      <Card>
        <CardHeader>
          <CardTitle>Share via Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            placeholder="Recipients (comma-separated)"
          />
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email Subject"
          />
          <Button onClick={sendEmail} className="w-full">
            <Mail className="mr-2 h-4 w-4" /> Send Email
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
