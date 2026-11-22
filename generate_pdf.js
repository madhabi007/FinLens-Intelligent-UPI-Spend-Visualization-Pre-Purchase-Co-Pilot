const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FinLens - Product Requirements Document & Technical Architecture</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1E293B;
      background: #FFFFFF;
      font-size: 11pt;
      line-height: 1.58;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Cover / Header Section */
    .doc-header {
      border-bottom: 2px solid #0F766E;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }

    .doc-badge {
      display: inline-block;
      background: #CCFBF1;
      color: #0F766E;
      font-size: 8.5pt;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .doc-title {
      font-size: 24pt;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.03em;
      line-height: 1.2;
      margin-bottom: 6px;
    }

    .doc-subtitle {
      font-size: 13pt;
      color: #475569;
      font-weight: 500;
      margin-bottom: 18px;
    }

    .metadata-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      font-size: 9.5pt;
      background: #F8FAFC;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #E2E8F0;
    }

    .metadata-table td {
      padding: 8px 14px;
      border-bottom: 1px solid #E2E8F0;
    }

    .metadata-table tr:last-child td {
      border-bottom: none;
    }

    .metadata-table td:first-child {
      font-weight: 700;
      color: #475569;
      width: 28%;
      background: #F1F5F9;
    }

    .metadata-table td:last-child {
      color: #0F172A;
      font-weight: 500;
    }

    /* Headings */
    h1 {
      font-size: 16pt;
      font-weight: 800;
      color: #0F172A;
      margin-top: 28px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #E2E8F0;
      page-break-after: avoid;
    }

    h2 {
      font-size: 12.5pt;
      font-weight: 700;
      color: #0F766E;
      margin-top: 18px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }

    h3 {
      font-size: 11pt;
      font-weight: 700;
      color: #334155;
      margin-top: 14px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }

    p {
      margin-bottom: 10px;
      color: #334155;
      text-align: justify;
    }

    ul, ol {
      margin-left: 20px;
      margin-bottom: 12px;
      color: #334155;
    }

    li {
      margin-bottom: 5px;
    }

    strong {
      color: #0F172A;
      font-weight: 700;
    }

    code {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 9pt;
      background: #F1F5F9;
      padding: 2px 5px;
      border-radius: 4px;
      color: #0F766E;
      border: 1px solid #E2E8F0;
    }

    pre {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 8.5pt;
      background: #0F172A;
      color: #F8FAFC;
      padding: 12px 14px;
      border-radius: 8px;
      margin: 12px 0;
      overflow-x: auto;
      line-height: 1.45;
      page-break-inside: avoid;
    }

    pre code {
      background: transparent;
      color: inherit;
      border: none;
      padding: 0;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      overflow: hidden;
    }

    table.data-table th {
      background: #0F766E;
      color: #FFFFFF;
      font-weight: 700;
      text-align: left;
      padding: 9px 12px;
      border: 1px solid #0D9488;
    }

    table.data-table td {
      padding: 8px 12px;
      border: 1px solid #E2E8F0;
      color: #334155;
    }

    table.data-table tr:nth-child(even) {
      background: #F8FAFC;
    }

    /* Callout & Cards */
    .callout-box {
      background: #F0FDFA;
      border-left: 4px solid #0F766E;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      margin: 14px 0;
      page-break-inside: avoid;
    }

    .callout-box.warning {
      background: #FFFBEB;
      border-left-color: #D97706;
    }

    .callout-title {
      font-weight: 700;
      font-size: 10pt;
      color: #0F766E;
      margin-bottom: 4px;
    }

    .callout-box.warning .callout-title {
      color: #B45309;
    }

    .pill {
      display: inline-block;
      font-size: 8pt;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .pill.green { background: #DCFCE7; color: #15803D; }
    .pill.orange { background: #FFEDD5; color: #C2410C; }
    .pill.red { background: #FEE2E2; color: #B91C1C; }

    /* Page Break Helper */
    .page-break {
      page-break-before: always;
    }

    .footer-note {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid #E2E8F0;
      font-size: 8.5pt;
      color: #94A3B8;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- ==================== HEADER ==================== -->
  <div class="doc-header">
    <span class="doc-badge">Product Requirements Document &amp; Technical Architecture</span>
    <h1 class="doc-title" style="border:none; margin:0;">FinLens: Intelligent UPI Spend Visualization &amp; Pre-Purchase Co-Pilot</h1>
    <div class="doc-subtitle">Spatial, Temporal &amp; Point-of-Sale Intelligence Grounded in 6-Month UPI Ledger</div>

    <table class="metadata-table">
      <tr><td>Document Version</td><td>v1.2 (Production-Ready Release)</td></tr>
      <tr><td>Author / Lead</td><td>FinLens Product Design &amp; Architecture Group</td></tr>
      <tr><td>Dataset Ingested</td><td>Authentic 6-Month Google Pay UPI Statement (720 Records · ₹3,42,251 Outflow · ₹3,16,415 Inflow)</td></tr>
      <tr><td>Core Capabilities</td><td>Temporal Circadian Grid, Google Maps Cartography, Camera UPI Scanner, Grounded Deterministic AI Coach</td></tr>
      <tr><td>Security Model</td><td>Salted PBKDF2 Hashing, Per-User File Isolation, Zero Model Training, Complete Account Deletion</td></tr>
      <tr><td>Live Public URL</td><td>https://odds-pleasant-spelling-ftp.trycloudflare.com (Cloudflare Secure Tunnel)</td></tr>
    </table>
  </div>

  <!-- ==================== SECTION 1 ==================== -->
  <h1>1. Executive Summary &amp; Vision</h1>
  <p>
    <strong>FinLens</strong> is a paradigm-shifting personal financial intelligence platform engineered specifically for the high-frequency micro-payment era of UPI (Unified Payments Interface). 
    Traditional personal finance software operates as an end-of-month <em>post-mortem</em>, presenting passive pie charts after budgets have already been exhausted. FinLens reimagines financial management through a dual-engine architecture:
  </p>

  <div class="callout-box">
    <div class="callout-title">The FinLens Dual-Engine Architecture</div>
    <p style="margin:0;">
      <strong>1. Retrospective Rhythm &amp; Spatial Analysis:</strong> Uncovers <em>when</em> and <em>where</em> cash leaks occur via a 24-hour &times; 7-day circadian heatmap and street-level Google Maps clustering.<br>
      <strong>2. Point-of-Sale Decision Intervention:</strong> Intercepts impulse purchases <em>before</em> they are finalized through a live camera UPI QR scanner that calculates real remaining budget headroom in real time.
    </p>
  </div>

  <p>
    Grounded in an authentic 81-page bank and Google Pay statement spanning April 1 to September 30, 2026 (720 verified transactions), FinLens proves that visual intelligence and point-of-sale friction transform mindless spending into intentional wealth accumulation.
  </p>

  <!-- ==================== SECTION 2 ==================== -->
  <h1>2. The Problem Statement: Why Traditional Personal Finance Is Broken</h1>
  
  <h2>2.1 The "Post-Mortem" Budgeting Trap</h2>
  <p>
    Traditional budgeting applications (such as Mint, Walnut, and native banking dashboards) alert users on the 30th of the month that they exceeded their dining or shopping budget. At that point, the capital is permanently gone. Financial apps fail not because users lack discipline, but because <strong>they lack real-time decision support at the point of sale</strong>.
  </p>

  <h2>2.2 UPI-Induced Micro-Spending Blindness</h2>
  <p>
    Unified Payments Interface (UPI) has removed all physical and cognitive friction from transactions. A ₹40 tea, ₹380 iced latte, or ₹849 quick-commerce grocery order occurs in under 4 seconds via biometric scan or PIN. Because physical cash never leaves the consumer's hand, micro-spends trigger zero psychological loss aversion. In our 6-month analysis, micro-transactions under ₹500 accounted for over 64% of total transaction volume.
  </p>

  <h2>2.3 Absence of Temporal and Spatial Context</h2>
  <p>
    Standard bank statements list raw chronological logs (e.g. <em>"12 Aug - Blinkit - ₹420"</em>). They fail to answer the critical behavioural questions:
  </p>
  <ul>
    <li><strong>When is the leak happening?</strong> Are orders driven by weekday morning routines or late-night emotional exhaustion?</li>
    <li><strong>Where is the leak concentrated?</strong> Is spending concentrated around a 1-km radius near the office or during weekend trips?</li>
  </ul>

  <!-- ==================== SECTION 3 ==================== -->
  <h1>3. The FinLens Solution &amp; Core Value Proposition</h1>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width:25%;">Dimension</th>
        <th style="width:35%;">Traditional Finance Apps</th>
        <th style="width:40%;">FinLens Co-Pilot</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Intervention Timing</strong></td>
        <td>End-of-month retroactive alerts</td>
        <td><strong>Pre-Purchase:</strong> Real-time scan before entering UPI PIN</td>
      </tr>
      <tr>
        <td><strong>Temporal Analysis</strong></td>
        <td>Flat monthly or annual bars</td>
        <td><strong>Circadian Grid:</strong> 24 hours &times; 7 days weekly rhythm</td>
      </tr>
      <tr>
        <td><strong>Spatial Analysis</strong></td>
        <td>None (pure numeric totals)</td>
        <td><strong>Google Maps Cartography:</strong> Density circles by neighborhood</td>
      </tr>
      <tr>
        <td><strong>AI Financial Guidance</strong></td>
        <td>Generic chatbots with hallucinations</td>
        <td><strong>Deterministic AI Coach:</strong> Grounded strictly in authentic ledger</td>
      </tr>
      <tr>
        <td><strong>Data Privacy</strong></td>
        <td>Aggregated &amp; monetized for credit cards</td>
        <td><strong>Salted PBKDF2 encryption</strong>, zero LLM model training</td>
      </tr>
    </tbody>
  </table>

  <!-- ==================== SECTION 4 ==================== -->
  <div class="page-break"></div>
  <h1>4. In-Depth Feature Specifications</h1>

  <h2>Feature 1: Temporal Spending Heatmap (Week Rhythm &amp; Calendar)</h2>
  <ul>
    <li><strong>Circadian Matrix:</strong> An 8-row &times; 24-column grid mapping transactions into 2-hour slots across Monday through Sunday.</li>
    <li><strong>Adaptive Intensity Gradients:</strong> Visual color scaling from subtle canvas olive up to vibrant terracotta (<code>#E76F51</code>) highlighting peak financial velocity.</li>
    <li><strong>Recurring Anomaly Engine:</strong> Automatically isolates high-frequency spikes (e.g. <em>"Friday 8–10 pm is your costliest recurring slot, 3.1&times; your typical slot"</em>).</li>
    <li><strong>Dual-Mode Display:</strong> Toggle seamlessly between aggregate <em>Week Rhythm</em> and chronological <em>Calendar</em> view.</li>
    <li><strong>Granular Category Chips:</strong> Instant zero-latency filtering by <em>Food Delivery, Groceries, Dining/Café, Transport, Shopping, Travel, Health, Fun, Bills/Utilities</em>.</li>
    <li><strong>Interactive Slot Drilldown:</strong> Clicking any cell displays every matching transaction with exact timestamp, merchant, and rupee amount.</li>
  </ul>

  <h2>Feature 2: Geographic Spending Heat Map (Google Maps Engine)</h2>
  <ul>
    <li><strong>Google Maps JavaScript API Integration:</strong> Clean, high-contrast custom slate styling powered by authorized API key.</li>
    <li><strong>Proportional Spending Circles:</strong> Radius and visual fill opacity scale dynamically with total expenditure in each locality.</li>
    <li><strong>Preset Macro/Micro Switchers:</strong>
      <ul>
        <li><em>All India:</em> Macro view illustrating inter-city lifestyle spending (Pune living vs. Delhi NCR travel).</li>
        <li><em>Pune Metropolitan:</em> Neighborhood clusters across Kothrud, Karve Road, Deccan, and Hinjawadi.</li>
        <li><em>Delhi NCR:</em> Travel and medical spikes across Noida Sector 62, Nehru Place, and Lajpat Nagar.</li>
      </ul>
    </li>
    <li><strong>Area Inspector Card:</strong> Highlights total outflow, transaction count, and the top 4 merchants for any clicked locality.</li>
  </ul>

  <h2>Feature 3: Pre-Purchase Lens &amp; UPI QR Scanner</h2>
  <ul>
    <li><strong>Live Device Camera Feed:</strong> Direct integration via <code>navigator.mediaDevices.getUserMedia</code> with front/rear camera flip.</li>
    <li><strong>Native Barcode/QR Detection:</strong> Integrated <code>BarcodeDetector</code> API decoding <code>upi://pay</code> URLs.</li>
    <li><strong>Bill &amp; Receipt Image Uploader:</strong> Upload gallery screenshots of payment QRs or grocery invoices.</li>
    <li><strong>1-Tap Authentic Statement Presets:</strong> Pre-loaded standees derived from real statement merchants (<em>Third Wave Coffee ₹380, Blinkit ₹849, Decathlon ₹2,199, Uber ₹340, Swiggy ₹620</em>).</li>
    <li><strong>Real-Time Affordability Engine:</strong>
      <ul>
        <li><span class="pill green">Safe to Spend</span> Under 15% of weekly allowance.</li>
        <li><span class="pill orange">Caution</span> Consumes 15%–35% of remaining category headroom.</li>
        <li><span class="pill red">Budget Alert</span> Exceeds monthly category ceiling.</li>
      </ul>
    </li>
    <li><strong>Visual Budget Barometer:</strong> Real-time progress bar displaying current spend, +impact slice, and remaining buffer.</li>
    <li><strong>Merchant Historical Dossier:</strong> Displays exact count of historical visits and lifetime rupees spent with that merchant.</li>
    <li><strong>Direct UPI Deep-Link:</strong> 1-click button triggering native UPI checkout in Google Pay, PhonePe, or Paytm.</li>
    <li><strong>Manual Quick-Check Tool:</strong> Form to evaluate any custom store, amount, and category before purchase.</li>
  </ul>

  <h2>Feature 4: Grounded AI Money Coach</h2>
  <ul>
    <li><strong>Deterministic Analytics:</strong> Answers user queries by executing verified aggregation queries across the 720 transactions.</li>
    <li><strong>Pre-Configured Scenario Engines:</strong> 6-month summary, Manali/March vacation feasibility, Swiggy vs. Blinkit breakdowns, and weekend overspend caps.</li>
    <li><strong>Visual Decision Cards:</strong> Generates dynamic donut graphs and budget status pills inline in the conversation.</li>
    <li><strong>Speech Recognition:</strong> Integrated Web Speech API (<code>SpeechRecognition</code>) with audio ripple indicator.</li>
    <li><strong>Clear Chat:</strong> 1-click conversation reset.</li>
  </ul>

  <!-- ==================== SECTION 5 ==================== -->
  <div class="page-break"></div>
  <h1>5. Ground Truth Financial Ledger Analysis (6 Months)</h1>
  <p>FinLens was developed and calibrated against an authentic 81-page Google Pay statement (April 1 – September 30, 2026):</p>

  <table class="data-table">
    <thead>
      <tr>
        <th>Metric Name</th>
        <th>Verified Metric Value</th>
        <th>Product Context &amp; Significance</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Statement Period</strong></td>
        <td>April 1, 2026 – September 30, 2026</td>
        <td>Full 6 calendar months (183 continuous days)</td>
      </tr>
      <tr>
        <td><strong>Total Verified Transactions</strong></td>
        <td>720 records</td>
        <td>612 Outflow payments + 108 Inflow receipts</td>
      </tr>
      <tr>
        <td><strong>Total Outflow (Sent)</strong></td>
        <td>₹3,42,250.98</td>
        <td>Everyday living, rent, travel, shopping, dining</td>
      </tr>
      <tr>
        <td><strong>Total Inflow (Received)</strong></td>
        <td>₹3,16,415.00</td>
        <td>Salaries, reimbursements, peer-to-peer transfers</td>
      </tr>
      <tr>
        <td><strong>Net Balance Delta</strong></td>
        <td>-₹25,835.98</td>
        <td>Average monthly deficit of ₹4,306 covered by savings</td>
      </tr>
      <tr>
        <td><strong>Dominant Category</strong></td>
        <td>Groceries &amp; Food Delivery (₹68,400)</td>
        <td>142 separate quick-commerce orders (Zepto, Swiggy, Blinkit)</td>
      </tr>
      <tr>
        <td><strong>Primary Living Hub</strong></td>
        <td>Pune Metropolitan (84% · ₹2,88,400)</td>
        <td>High density in Kothrud, Karve Road, Deccan Gymkhana</td>
      </tr>
      <tr>
        <td><strong>Secondary Travel Hub</strong></td>
        <td>Delhi NCR (13% · ₹42,850)</td>
        <td>Cleartrip flights, IHL Noida hospital, Nehru Place</td>
      </tr>
    </tbody>
  </table>

  <!-- ==================== SECTION 6 ==================== -->
  <h1>6. Complete Project File Directory &amp; Module Map</h1>

  <pre><code>c:\\Users\\madha\\Downloads\\Fin/
├── data/
│   └── users/
│       ├── .gitkeep                   # Preserves folder structure in Git
│       └── demo-user-madhabi.json     # Private isolated user database (720 records)
├── public/
│   ├── data/
│   │   └── madhabi_upi.json           # Sanitized 6-month ledger dataset
│   ├── app.js                         # Core Client Engine (State, Maps, Camera, Coach)
│   ├── index.html                     # Semantic Accessible App Shell
│   └── style.css                      # Tokenized Design System &amp; Responsive Layout
├── .gitignore                         # Protects node_modules, binaries, and live user data
├── package.json                       # Express server manifest &amp; dependencies
├── parse_6months.js                   # Automated PDF to JSON statement extraction script
├── server.js                          # Express.js REST API with Salted PBKDF2 Auth
├── PROJECT_DOCUMENTATION.md           # Full Product PRD in Google Document Markdown
└── README.md                          # Quick start instructions &amp; developer setup</code></pre>

  <!-- ==================== SECTION 7 ==================== -->
  <div class="page-break"></div>
  <h1>7. Data Security, Privacy &amp; Cryptography</h1>
  <div class="callout-box">
    <div class="callout-title">Guaranteed Financial Data Privacy</div>
    <p style="margin:0;">
      Personal financial ledgers are classified as high-risk sensitive data. FinLens implements strict zero-knowledge principles.
    </p>
  </div>

  <ul>
    <li><strong>Per-User Data Isolation:</strong> Every registered user has an isolated JSON database in <code>data/users/&lt;userId&gt;.json</code>. Cross-tenant data access is strictly blocked at the API layer.</li>
    <li><strong>Cryptographic Password Hashing:</strong> Passwords are hashed using salted <strong>PBKDF2 (10,000 iterations)</strong> with random 16-byte salt generated per user. Plaintext passwords are never stored.</li>
    <li><strong>Zero AI Model Training:</strong> Statements are processed deterministically. Transactions are <strong>never sent to OpenAI, Anthropic, or external LLMs</strong> for model training.</li>
    <li><strong>Complete Account Deletion:</strong> Users have permanent "Wipe Data &amp; Delete Account" capability with zero residual logging.</li>
  </ul>

  <!-- ==================== SECTION 8 ==================== -->
  <h1>8. How to Create the Git Repository &amp; Push to GitHub</h1>
  <p>Follow these exact terminal commands to push this codebase to your GitHub account:</p>

  <h3>Step 1: Install Git (If not installed)</h3>
  <pre><code>winget install --id Git.Git -e --source winget</code></pre>

  <h3>Step 2: Configure Git Identity</h3>
  <pre><code>git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"</code></pre>

  <h3>Step 3: Initialize Repository &amp; Commit Code</h3>
  <pre><code>cd c:\\Users\\madha\\Downloads\\Fin
git init
git add .
git commit -m "feat: initial release of FinLens UPI Spend Intelligence &amp; Pre-Purchase Scanner"</code></pre>

  <h3>Step 4: Create Repo on GitHub &amp; Push</h3>
  <p>Create a new empty repository named <code>finlens</code> on <a href="https://github.com/new">github.com/new</a> (leave README and .gitignore unchecked), then run:</p>
  <pre><code>git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/finlens.git
git push -u origin main</code></pre>

  <div class="footer-note">
    FinLens &copy; 2026 &middot; Intelligent UPI Spend Visualization &amp; Pre-Purchase Co-Pilot &middot; Confidential PRD Specification
  </div>

</body>
</html>
`;

const tempHtmlPath = path.join(__dirname, 'temp_doc.html');
const outputPdfPath = path.join(__dirname, 'FinLens_Product_Documentation.pdf');
const publicPdfPath = path.join(__dirname, 'public', 'FinLens_Product_Documentation.pdf');

fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const cmd = `"${chromePath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputPdfPath}" "${tempHtmlPath}"`;

console.log('Generating PDF via Headless Chrome...');
execSync(cmd, { stdio: 'inherit' });

// Copy to public folder for direct browser viewing/download
fs.copyFileSync(outputPdfPath, publicPdfPath);
fs.unlinkSync(tempHtmlPath);

console.log('PDF successfully generated at: ' + outputPdfPath);
console.log('Public copy available at: ' + publicPdfPath);
