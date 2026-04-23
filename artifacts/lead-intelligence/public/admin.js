let allLeads = [];

async function loadLeads() {
  const res = await fetch("/api/leads");
  const data = await res.json();
  allLeads = data;
  displayLeads(data);
}

function displayLeads(leads) {
  const container = document.getElementById("leadsContainer");

  container.innerHTML = leads.map(lead => `
    <div class="lead-card">
      <h3>${lead.name} (${lead.score}/100)</h3>
      <p><b>Company:</b> ${lead.company}</p>
      <p><b>Segment:</b> <span class="badge ${lead.segment.toLowerCase()}">${lead.segment}</span></p>
      <p><b>Action:</b> ${lead.action}</p>
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
