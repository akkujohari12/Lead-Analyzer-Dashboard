let allLeads = [];

async function loadLeads() {
  const res = await fetch("/api/leads");
  const data = await res.json();
  allLeads = data;
  renderStats(data);
  displayLeads(data);
}

function renderStats(leads) {
  const total = leads.length;
  const hot = leads.filter(l => l.segment === "HOT").length;

  document.getElementById("stats").innerHTML = `
    <p>Total Leads: ${total} | 🔥 Hot Leads: ${hot}</p>
  `;
}

function displayLeads(leads) {
  const container = document.getElementById("leadsContainer");

  container.innerHTML = leads.map(lead => `
    <div class="lead-card">
      <h3>${lead.name} (${lead.score}/100)</h3>
      <p><b>Company:</b> ${lead.company}</p>
      <p><b>Segment:</b> <span class="badge ${lead.segment.toLowerCase()}">${lead.segment}</span></p>
      <p><b>Action:</b> ${lead.action}</p>
      <p style="opacity:0.6; font-size:12px;">
        Added: ${new Date(lead.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
      </p>
    </div>
  `).join("");
}

function filterLeads(segment) {
  if (segment === "ALL") {
    displayLeads(allLeads);
  } else {
    const filtered = allLeads.filter(l => l.segment === segment);
    displayLeads(filtered);
  }
}

loadLeads();
