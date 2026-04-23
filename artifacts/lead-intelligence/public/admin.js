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
    <div class="lead-card" data-id="${lead.id}" onclick="openSummary(${lead.id})" style="cursor:pointer;">
      <h3>${lead.name} (${lead.score}/100)</h3>
      <p><b>Company:</b> ${lead.company}</p>
      <p><b>Segment:</b> <span class="badge ${lead.segment.toLowerCase()}">${lead.segment}</span></p>
      <p><b>Action:</b> ${lead.action}</p>
      <p style="opacity:0.6; font-size:12px;">
        Added: ${new Date(lead.created_at.replace(" ", "T") + "Z").toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
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

function openSummary(id) {
  const lead = allLeads.find(l => l.id === id);
  if (!lead) return;

  document.getElementById("modalContent").innerHTML = `
    <h2>${lead.name}</h2>
    <p style="opacity:0.6; margin-bottom:12px;">${lead.role} · ${lead.company}</p>

    <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
      <span class="badge ${lead.segment.toLowerCase()}">${lead.segment}</span>
      <span style="opacity:0.7; font-size:14px;">Score: <b>${lead.score}/100</b></span>
    </div>

    ${lead.notes ? `<div class="modal-section"><b>📝 Notes</b><p>${lead.notes}</p></div>` : ""}

    <div class="modal-section">
      <b>💬 Outreach Message</b>
      <p>${lead.message}</p>
    </div>

    <div class="modal-section">
      <b>🚀 Next Action</b>
      <p>${lead.action}</p>
    </div>

    <p style="opacity:0.4; font-size:11px; margin-top:16px;">
      Added: ${new Date(lead.created_at.replace(" ", "T") + "Z").toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
    </p>
  `;

  document.getElementById("modal").classList.add("active");
}

function closeModal(e) {
  if (!e || e.target === document.getElementById("modal")) {
    document.getElementById("modal").classList.remove("active");
  }
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

loadLeads();
