import { Router } from "express";

const router = Router();

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

router.post("/analyze-lead", (req, res) => {
  const { name, role, company, companySize, notes } = req.body as {
    name: string;
    role: string;
    company: string;
    companySize: number;
    notes?: string;
  };

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
  const first   = (name ?? "there").trim().split(" ")[0];

  const messages: Record<string, string[]> = {
    HOT: [
      `Hi ${first}, I noticed ${company} is at a stage where our platform could make an immediate impact. I'd love to set up a 20-minute call this week — does Thursday work?`,
      `${first}, given your role at ${company} and what you've shared, I think we can solve your core challenge fast. Can we schedule a quick discovery call?`,
    ],
    WARM: [
      `Hi ${first}, teams like yours at ${company} often find our solution cuts through the complexity you're navigating. I'd love to share a short case study — open to a quick chat?`,
      `${first}, I think there's a genuine fit between what ${company} is working toward and what we offer. Would a 15-minute intro call be worthwhile?`,
    ],
    COLD: [
      `Hi ${first}, I came across ${company} and thought you might find this relevant down the road. Sending over a quick overview — no pressure, just something to keep in mind.`,
      `${first}, happy to share how teams similar to ${company} are approaching this. No strings attached — just a resource that might be useful when the timing is right.`,
    ],
  };

  const actions: Record<string, string[]> = {
    HOT: [
      "Book a product demo within 48 hours. Prepare an ROI case study tailored to their vertical and company size.",
      "Fast-track to discovery call. Loop in your account executive for closing support.",
    ],
    WARM: [
      "Send a tailored case study or industry report. Follow up in 5–7 days with a light-touch check-in.",
      "Add to nurture sequence. Schedule a soft follow-up next week to gauge readiness.",
    ],
    COLD: [
      "Enroll in a drip email campaign. Revisit in 30 days with fresh context or a relevant industry insight.",
      "Monitor activity signals. Tag for future re-engagement when company stage or budget conditions change.",
    ],
  };

  res.json({
    score,
    segment,
    message: pick(messages[segment]),
    action:  pick(actions[segment]),
  });
});

export default router;
