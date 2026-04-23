import { Router } from "express";
import { db } from "../lib/db";
import { openai } from "../lib/openai";

const router = Router();

router.post("/analyze-lead", async (req, res) => {
  const { name, role, company, companySize, notes } = req.body as {
    name: string;
    role: string;
    company: string;
    companySize: number;
    notes?: string;
  };

  // ── Rule-based scoring ────────────────────────────────────────────
  let score = 20;
  const r = (role ?? "").toLowerCase();
  const n = (notes ?? "").toLowerCase();

  const senior = ["ceo","cto","coo","cfo","vp","director","head","chief","founder","president","owner"];
  const mid    = ["manager","lead","senior","principal","architect","engineer","developer","designer"];
  const junior = ["intern","junior","trainee","assistant","coordinator","associate"];

  if      (senior.some(w => r.includes(w))) score += 30;
  else if (mid.some(w => r.includes(w)))    score += 15;
  else if (junior.some(w => r.includes(w))) score -= 5;

  if      (companySize >  1000) score += 25;
  else if (companySize >   200) score += 15;
  else if (companySize >    50) score += 8;
  else                          score += 3;

  const highSignals = ["urgent","asap","immediately","budget approved","decision maker",
                       "evaluating","contract","pilot","demo","ready","purchase","buy","decision"];
  const medSignals  = ["exploring","looking","considering","planning","researching","potential","interested"];
  const lowSignals  = ["not now","later","no budget","pause","hold","just curious","curious"];

  highSignals.forEach(w => { if (n.includes(w)) score += 10; });
  medSignals.forEach(w  => { if (n.includes(w)) score += 4;  });
  lowSignals.forEach(w  => { if (n.includes(w)) score -= 12; });

  score = Math.min(100, Math.max(5, Math.round(score)));
  const segment = score >= 72 ? "HOT" : score >= 42 ? "WARM" : "COLD";

  // ── Template-based next actions ───────────────────────────────────
  const templateActions: Record<string, string> = {
    HOT:  "Book a product demo within 48 hours. Prepare a tailored ROI case study.",
    WARM: "Send a case study and follow up in 5–7 days with a light-touch check-in.",
    COLD: "Enroll in a drip email campaign. Revisit in 30 days with fresh context.",
  };
  const action = templateActions[segment];

  // ── AI-generated outreach message ─────────────────────────────────
  let message: string;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a sales intelligence assistant.\n\n" +
            "Given a lead's details and their segment, write a short, personalized outreach message " +
            "(2–3 sentences, conversational and professional, no fluff).\n\n" +
            "Do NOT include next actions.\n\n" +
            "Respond in this exact JSON format:\n{ \"message\": \"...\" }",
        },
        {
          role: "user",
          content:
            `Name: ${name}\nRole: ${role}\nCompany: ${company}\nCompany size: ${companySize} employees\n` +
            `Notes: ${notes || "None"}\nScore: ${score}/100\nSegment: ${segment}`,
        },
      ],
    });

    let raw = completion.choices[0]?.message?.content ?? "";
    raw = raw.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
    if (!raw) throw new Error("Empty response from OpenAI");
    const parsed = JSON.parse(raw);
    message = parsed.message ?? "";
  } catch (err) {
    console.error("OpenAI error, falling back to template:", err);
    const first = (name ?? "there").trim().split(" ")[0];
    const fallbackMessages: Record<string, string> = {
      HOT:  `Hi ${first}, given your role at ${company} and the urgency you've described, I'd love to schedule a quick call this week. Would Thursday work?`,
      WARM: `Hi ${first}, teams like yours at ${company} often find our solution a strong fit. I'd love to share a short case study — open to a quick chat?`,
      COLD: `Hi ${first}, I came across ${company} and thought you might find this relevant down the road. No pressure, just something to keep in mind.`,
    };
    message = fallbackMessages[segment];
  }

  // ── Persist to database ───────────────────────────────────────────
  db.run(
    `INSERT INTO leads (name, role, company, company_size, notes, score, segment, message, action)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, role, company, companySize, notes ?? "", score, segment, message, action],
    (err) => { if (err) console.error("Failed to save lead:", err.message); }
  );

  res.json({ score, segment, message, action });
});

export default router;
