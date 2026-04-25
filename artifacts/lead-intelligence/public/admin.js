let allLeads = [];
let segmentChartInstance = null;
let scoreChartInstance   = null;

async function loadLeads() {
  const res = await fetch("/api/leads");
  const data = await res.json();
  allLeads = data;
  renderStats(data);
  renderCharts(data);
  displayLeads(data);
}

function renderCharts(leads) {
  const hot  = leads.filter(l => l.segment === "HOT").length;
  const warm = leads.filter(l => l.segment === "WARM").length;
  const cold = leads.filter(l => l.segment === "COLD").length;

  const avgScore = seg => {
    const group = leads.filter(l => l.segment === seg);
    if (!group.length) return 0;
    return Math.round(group.reduce((s, l) => s + l.score, 0) / group.length);
  };

  const chartDefaults = {
    color: "rgba(226,232,240,0.7)",
    font: { family: "sans-serif" }
  };
  Chart.defaults.color = chartDefaults.color;
  Chart.defaults.font.family = chartDefaults.font.family;

  /* ── Donut: segment distribution ── */
  if (segmentChartInstance) segmentChartInstance.destroy();
  segmentChartInstance = new Chart(document.getElementById("segmentChart"), {
    type: "doughnut",
    data: {
      labels: ["HOT", "WARM", "COLD"],
      datasets: [{
        data: [hot, warm, cold],
        backgroundColor: [
          "rgba(239,68,68,0.75)",
          "rgba(245,158,11,0.75)",
          "rgba(16,185,129,0.75)"
        ],
        borderColor: [
          "rgba(239,68,68,0.2)",
          "rgba(245,158,11,0.2)",
          "rgba(16,185,129,0.2)"
        ],
        borderWidth: 1,
        hoverOffset: 8
      }]
    },
    options: {
      cutout: "68%",
      plugins: {
        legend: { position: "bottom", labels: { padding: 16, boxWidth: 12, font: { size: 12 } } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } }
      }
    }
  });

  /* ── Bar: avg score by segment ── */
  if (scoreChartInstance) scoreChartInstance.destroy();
  scoreChartInstance = new Chart(document.getElementById("scoreChart"), {
    type: "bar",
    data: {
      labels: ["HOT", "WARM", "COLD"],
      datasets: [{
        label: "Avg Score",
        data: [avgScore("HOT"), avgScore("WARM"), avgScore("COLD")],
        backgroundColor: [
          "rgba(239,68,68,0.55)",
          "rgba(245,158,11,0.55)",
          "rgba(16,185,129,0.55)"
        ],
        borderColor: [
          "rgba(239,68,68,0.9)",
          "rgba(245,158,11,0.9)",
          "rgba(16,185,129,0.9)"
        ],
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      scales: {
        y: {
          min: 0, max: 100,
          grid: { color: "rgba(255,255,255,0.06)" },
          ticks: { stepSize: 25, font: { size: 11 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Avg score: ${ctx.parsed.y}/100` } }
      }
    }
  });
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
