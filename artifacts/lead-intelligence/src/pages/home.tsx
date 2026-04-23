import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, Target, MessageSquare, ArrowRight, BarChart2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  company: z.string().min(1, "Company is required"),
  companySize: z.string().min(1, "Company size is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Segment = "HOT" | "WARM" | "COLD";

interface LeadResult {
  score: number;
  segment: Segment;
  outreachMessage: string;
  nextAction: string;
}

function analyzeLead(values: FormValues): LeadResult {
  let score = 20;
  const notes = (values.notes || "").toLowerCase();
  const role = values.role.toLowerCase();
  const size = values.companySize;

  const seniorRoles = ["ceo", "cto", "coo", "cfo", "vp", "director", "head", "chief", "founder", "president", "owner"];
  const midRoles = ["manager", "lead", "senior", "principal", "architect", "engineer", "developer", "designer"];
  const juniorRoles = ["intern", "junior", "trainee", "assistant", "coordinator", "associate"];
  const isSenior = seniorRoles.some(r => role.includes(r));
  const isMid = midRoles.some(r => role.includes(r));
  const isJunior = juniorRoles.some(r => role.includes(r));

  if (isSenior) score += 30;
  else if (isMid) score += 15;
  else if (isJunior) score -= 5;

  if (size === "enterprise") score += 25;
  else if (size === "mid-market") score += 15;
  else if (size === "smb") score += 8;
  else if (size === "startup") score += 3;

  const highIntent = ["urgent", "asap", "immediately", "budget approved", "decision maker", "evaluating", "contract", "pilot", "demo", "ready", "purchase", "buy", "decision"];
  const medIntent = ["exploring", "looking", "considering", "planning", "researching", "potential", "interested"];
  const lowIntent = ["not now", "later", "no budget", "pause", "hold", "curious", "just curious"];

  const highCount = highIntent.filter(w => notes.includes(w)).length;
  const medCount = medIntent.filter(w => notes.includes(w)).length;
  const lowCount = lowIntent.filter(w => notes.includes(w)).length;

  score += highCount * 10;
  score += medCount * 4;
  score -= lowCount * 12;

  score = Math.min(100, Math.max(5, score));

  let segment: Segment;
  if (score >= 72) segment = "HOT";
  else if (score >= 42) segment = "WARM";
  else segment = "COLD";

  const name = values.name.split(" ")[0];
  const company = values.company;

  const messages: Record<Segment, string[]> = {
    HOT: [
      `Hi ${name}, I noticed ${company} is at a stage where our platform could make an immediate impact. I'd love to set up a 20-minute call this week — does Thursday work?`,
      `${name}, given your role at ${company} and what you've shared, I think we can solve your core challenge fast. Can we schedule a quick discovery call?`,
    ],
    WARM: [
      `Hi ${name}, teams like yours at ${company} often find our solution cuts through the complexity you're navigating. I'd love to share a short case study — open to a quick chat?`,
      `${name}, I think there's a genuine fit between what ${company} is working toward and what we offer. Would a 15-minute intro call be worthwhile?`,
    ],
    COLD: [
      `Hi ${name}, I came across ${company} and thought you might find this relevant down the road. Sending over a quick overview — no pressure, just something to keep in mind.`,
      `${name}, happy to share how teams similar to ${company} are approaching this. No strings attached — just a resource that might be useful when the timing is right.`,
    ],
  };

  const actions: Record<Segment, string[]> = {
    HOT: [
      "Book a product demo within 48 hours. Prepare ROI case study for their vertical.",
      "Fast-track to discovery call. Loop in AE for closing support.",
    ],
    WARM: [
      "Send tailored case study or industry report. Follow up in 5–7 days.",
      "Add to nurture sequence. Schedule a light-touch check-in next week.",
    ],
    COLD: [
      "Enroll in drip email campaign. Revisit in 30 days with fresh context.",
      "Monitor activity signals. Tag for future re-engagement when conditions change.",
    ],
  };

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  return {
    score,
    segment,
    outreachMessage: pick(messages[segment]),
    nextAction: pick(actions[segment]),
  };
}

const segmentConfig: Record<Segment, { label: string; bg: string; text: string; border: string; dot: string }> = {
  HOT: {
    label: "HOT",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  WARM: {
    label: "WARM",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  COLD: {
    label: "COLD",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
};

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 72
      ? "bg-gradient-to-r from-red-400 to-red-500"
      : score >= 42
      ? "bg-gradient-to-r from-amber-400 to-amber-500"
      : "bg-gradient-to-r from-emerald-400 to-emerald-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Lead Score</span>
        <span
          className="text-2xl font-bold text-foreground tabular-nums"
          data-testid="text-lead-score"
        >
          {score}
          <span className="text-base font-normal text-muted-foreground">/100</span>
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${score}%` }}
          data-testid="progress-lead-score"
        />
      </div>
    </div>
  );
}

export default function Home() {
  const [result, setResult] = useState<LeadResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visible, setVisible] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      role: "",
      company: "",
      companySize: "",
      notes: "",
    },
  });

  function onSubmit(values: FormValues) {
    setVisible(false);
    setIsAnalyzing(true);
    setTimeout(() => {
      const res = analyzeLead(values);
      setResult(res);
      setIsAnalyzing(false);
      setTimeout(() => setVisible(true), 50);
    }, 900);
  }

  const seg = result ? segmentConfig[result.segment] : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">AI-Powered</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
            Lead Intelligence
          </h1>
          <p className="text-muted-foreground text-base">
            Analyze prospects instantly. Get a lead score, segment, and personalized outreach — in seconds.
          </p>
        </div>

        {/* Form Card */}
        <div
          className="bg-card border border-card-border rounded-2xl p-8 mb-6"
          style={{ boxShadow: "var(--shadow-md)" }}
        >
          <h2 className="text-base font-semibold text-foreground mb-6">Prospect Details</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jane Smith"
                          data-testid="input-name"
                          className="h-10 rounded-xl border-border bg-background focus-visible:ring-primary/30"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Role / Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="VP of Engineering"
                          data-testid="input-role"
                          className="h-10 rounded-xl border-border bg-background focus-visible:ring-primary/30"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Company</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Acme Corp"
                          data-testid="input-company"
                          className="h-10 rounded-xl border-border bg-background focus-visible:ring-primary/30"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companySize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Company Size</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger
                            className="h-10 rounded-xl border-border bg-background focus:ring-primary/30"
                            data-testid="select-company-size"
                          >
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="startup">Startup (1–50)</SelectItem>
                          <SelectItem value="smb">SMB (51–200)</SelectItem>
                          <SelectItem value="mid-market">Mid-Market (201–1,000)</SelectItem>
                          <SelectItem value="enterprise">Enterprise (1,000+)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Notes{" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. Mentioned they're evaluating tools urgently, decision maker, budget approved..."
                        data-testid="textarea-notes"
                        className="resize-none rounded-xl border-border bg-background min-h-[90px] focus-visible:ring-primary/30"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isAnalyzing}
                data-testid="button-analyze"
                className="w-full h-11 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Lead...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Analyze Lead
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>

        {/* Results */}
        {result && seg && (
          <div
            className="space-y-4 transition-all duration-500"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.45s ease, transform 0.45s ease",
            }}
            data-testid="section-results"
          >
            {/* Score + Segment Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Score Card */}
              <div
                className="bg-card border border-card-border rounded-2xl p-6"
                style={{ boxShadow: "var(--shadow-sm)" }}
                data-testid="card-score"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Lead Score</span>
                </div>
                <ScoreBar score={result.score} />
              </div>

              {/* Segment Card */}
              <div
                className="bg-card border border-card-border rounded-2xl p-6"
                style={{ boxShadow: "var(--shadow-sm)" }}
                data-testid="card-segment"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Segment</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${seg.bg} ${seg.text} ${seg.border}`}
                    data-testid="badge-segment"
                  >
                    <span className={`w-2 h-2 rounded-full ${seg.dot}`} />
                    {seg.label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {result.segment === "HOT"
                      ? "High priority — act fast"
                      : result.segment === "WARM"
                      ? "Nurture and follow up"
                      : "Long-term pipeline"}
                  </span>
                </div>
              </div>
            </div>

            {/* Outreach Message */}
            <div
              className="bg-card border border-card-border rounded-2xl p-6"
              style={{ boxShadow: "var(--shadow-sm)" }}
              data-testid="card-outreach"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">Outreach Message</span>
              </div>
              <p
                className="text-sm text-foreground leading-relaxed bg-muted/50 rounded-xl p-4 border border-border/50 italic"
                data-testid="text-outreach-message"
              >
                "{result.outreachMessage}"
              </p>
            </div>

            {/* Next Action */}
            <div
              className="bg-card border border-card-border rounded-2xl p-6"
              style={{ boxShadow: "var(--shadow-sm)" }}
              data-testid="card-next-action"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">Recommended Next Action</span>
              </div>
              <p
                className="text-sm text-foreground leading-relaxed"
                data-testid="text-next-action"
              >
                {result.nextAction}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
