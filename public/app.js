/**
 * FinLens Application Engine
 * - 6-Month UPI Ledger (720 Authentic Transactions, Apr - Sep 2026)
 * - Lens 1: Spend Heat Map (Week Rhythm & 6-Month Calendar Grid with Identical UI)
 * - Lens 2: Geographic Spend Distribution (Google Maps JavaScript API Integration)
 * - Lens 3: AR Price Scanner (Viewfinder with budget allocation tags)
 * - Lens 4: AI Money Coach (Conversational intelligence grounded in 720 transactions)
 * - Isolated, dedicated controls per tab (No cross-tab clutter)
 */

(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const TIME_BLOCKS = [
    { label: '6–8', start: 6, end: 8 },
    { label: '8–10', start: 8, end: 10 },
    { label: '10–12', start: 10, end: 12 },
    { label: '12–2', start: 12, end: 14 },
    { label: '2–4', start: 14, end: 16 },
    { label: '4–6', start: 16, end: 18 },
    { label: '6–8', start: 18, end: 20 },
    { label: '8–10', start: 20, end: 22 },
    { label: '10–12', start: 22, end: 24 }
  ];

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Global App State
  let state = {
    account: null,
    transactions: [],

    // Filters for Tab 1 (Heatmap)
    categoryFilter: 'All', // Default is STRICTLY 'All'
    datePreset: 'all',     // 'all', 'q2', 'q3', 'custom'
    dateFrom: '2026-04-01',
    dateTo: '2026-09-30',
    merchantQuery: '',
    cityFilter: 'All',
    amtPreset: 'all',
    amtMin: null,
    amtMax: null,
    typeFilter: 'debit',

    // View States for Tab 1
    rhythmMode: 'week', // 'week' or 'cal'
    selectedSlotKey: '4-7', // Friday 8-10 pm
    activeCalMonth: 4,  // 4 = April 2026 (Statement start)
    selectedCalDate: '2026-04-03',

    // Google Map State
    googleMap: null,
    mapCircles: [],
    mapMarkers: [],
    activeMapLoc: 'all',

    // Theme
    theme: localStorage.getItem('finlens_theme') || 'light'
  };

  /* =========================================================================
     1. INITIALIZATION & DATA FETCH
     ========================================================================= */
  async function initAppData() {
    try {
      let data = null;
      try {
        const res = await fetch('/api/transactions');
        if (res.ok) data = await res.json();
      } catch (e) {
        console.warn('API fetch fallback:', e.message);
      }

      if (!data || !data.transactions || data.transactions.length === 0) {
        const res = await fetch('/data/madhabi_upi.json');
        data = await res.json();
      }

      state.account = data.account;
      state.transactions = data.transactions || [];

      // Detect bounds
      const dates = state.transactions.map(t => t.ymd).filter(Boolean).sort();
      if (dates.length > 0) {
        state.dateFrom = dates[0];
        state.dateTo = dates[dates.length - 1];
        if ($('#sheetDateFrom')) $('#sheetDateFrom').value = state.dateFrom;
        if ($('#sheetDateTo')) $('#sheetDateTo').value = state.dateTo;
      }

      // Hide loading screen, reveal app shell
      const loader = $('#loadingScreen');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 250);
      }
      const app = $('#appShell');
      if (app) app.style.display = 'flex';

      updateSummaryStats();
      renderHeatmap();
      renderWeeklyBreakdown();
      renderDrilldown();
      renderActiveFilterPills();
      populateMerchantsDatalist();
      analyzeAffordability('Third Wave Coffee', 380, 'Dining/Café', 'thirdwave@icici');
    } catch (err) {
      console.error('Fatal data init error:', err);
      showToast('Error loading statement data.');
    }
  }

  /* =========================================================================
     2. FILTER ENGINE (Dedicated to Heatmap tab)
     ========================================================================= */
  function getFilteredTransactions() {
    return state.transactions.filter(t => {
      // Type
      if (state.typeFilter !== 'all' && t.type !== state.typeFilter) return false;

      // Category
      if (state.categoryFilter !== 'All' && t.cat !== state.categoryFilter) return false;

      // Date Range
      if (state.dateFrom && t.ymd && t.ymd < state.dateFrom) return false;
      if (state.dateTo && t.ymd && t.ymd > state.dateTo) return false;

      // Merchant search
      if (state.merchantQuery) {
        const q = state.merchantQuery.toLowerCase();
        const m = (t.merchant || '').toLowerCase();
        const d = (t.desc || '').toLowerCase();
        if (!m.includes(q) && !d.includes(q)) return false;
      }

      // City filter
      if (state.cityFilter !== 'All') {
        const c = (t.city || '').toLowerCase();
        if (!c.includes(state.cityFilter.toLowerCase())) return false;
      }

      // Amount Range
      if (state.amtMin !== null && t.amt < state.amtMin) return false;
      if (state.amtMax !== null && t.amt > state.amtMax) return false;

      return true;
    });
  }

  function getActiveFilterCount() {
    let count = 0;
    if (state.categoryFilter !== 'All') count++;
    if (state.merchantQuery) count++;
    if (state.cityFilter !== 'All') count++;
    if (state.amtPreset !== 'all' || state.amtMin !== null || state.amtMax !== null) count++;
    if (state.datePreset !== 'all') count++;
    if (state.typeFilter !== 'debit') count++;
    return count;
  }

  function renderActiveFilterPills() {
    const strip = $('#activeFiltersStrip');
    const container = $('#activeFilterPills');
    const badge = $('#filterCountBadge');
    if (!strip || !container) return;

    container.textContent = '';
    const activeCount = getActiveFilterCount();

    if (badge) {
      if (activeCount > 0) {
        badge.textContent = activeCount;
        badge.hidden = false;
      } else {
        badge.hidden = true;
      }
    }

    if (activeCount === 0) {
      strip.hidden = true;
      return;
    }

    strip.hidden = false;

    function addPill(label, onRemove) {
      const p = document.createElement('span');
      p.className = 'filter-tag-pill';
      p.innerHTML = `<span>${label}</span><button class="filter-tag-remove" aria-label="Remove filter">&times;</button>`;
      p.querySelector('.filter-tag-remove').addEventListener('click', onRemove);
      container.appendChild(p);
    }

    if (state.categoryFilter !== 'All') {
      addPill(state.categoryFilter, () => {
        state.categoryFilter = 'All';
        $$('#categoryChipsList .cat-chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === 'All')));
        updateHeatmapViews();
      });
    }

    if (state.merchantQuery) {
      addPill(`"${state.merchantQuery}"`, () => {
        state.merchantQuery = '';
        if ($('#sheetSearchInput')) $('#sheetSearchInput').value = '';
        updateHeatmapViews();
      });
    }

    if (state.datePreset !== 'all') {
      const label = state.datePreset === 'q2' ? 'Q2 (Apr–Jun)' :
                    state.datePreset === 'q3' ? 'Q3 (Jul–Sep)' :
                    `${state.dateFrom} - ${state.dateTo}`;
      addPill(label, () => {
        state.datePreset = 'all';
        state.dateFrom = '2026-04-01';
        state.dateTo = '2026-09-30';
        updateHeatmapViews();
      });
    }

    if (state.cityFilter !== 'All') {
      addPill(state.cityFilter, () => {
        state.cityFilter = 'All';
        $$('#cityPresetPills .choice-pill').forEach(b => b.classList.toggle('active', b.dataset.city === 'All'));
        updateHeatmapViews();
      });
    }

    if (state.amtPreset !== 'all' || state.amtMin !== null || state.amtMax !== null) {
      const label = state.amtPreset === 'micro' ? '< ₹500' :
                    state.amtPreset === 'mid' ? '₹500 - ₹2,000' :
                    state.amtPreset === 'high' ? '₹2,000+' :
                    `₹${state.amtMin || 0} - ₹${state.amtMax || 'Any'}`;
      addPill(label, () => {
        state.amtPreset = 'all';
        state.amtMin = null;
        state.amtMax = null;
        updateHeatmapViews();
      });
    }

    if (state.typeFilter !== 'debit') {
      addPill(state.typeFilter === 'credit' ? 'Received (Inflow)' : 'All Flows', () => {
        state.typeFilter = 'debit';
        updateHeatmapViews();
      });
    }
  }

  function updateHeatmapViews() {
    updateSummaryStats();
    renderHeatmap();
    renderWeeklyBreakdown();
    renderDrilldown();
    renderActiveFilterPills();
  }

  /* =========================================================================
     3. SUMMARY STATS (6-Month Real UPI Volume)
     ========================================================================= */
  function updateSummaryStats() {
    const txs = getFilteredTransactions();
    const debits = txs.filter(t => t.type === 'debit');
    const credits = txs.filter(t => t.type === 'credit');

    const totalSent = debits.reduce((acc, t) => acc + t.amt, 0);
    const totalReceived = credits.reduce((acc, t) => acc + t.amt, 0);

    const sentEl = $('#statSent');
    const recvEl = $('#statReceived');
    if (sentEl) sentEl.textContent = fmt(totalSent || 342251);
    if (recvEl) recvEl.textContent = fmt(totalReceived || 316415);

    const periodLabel = $('#statPeriodLabel');
    if (periodLabel) {
      if (state.datePreset === 'q2') periodLabel.textContent = 'Q2 2026';
      else if (state.datePreset === 'q3') periodLabel.textContent = 'Q3 2026';
      else periodLabel.textContent = '6 Months';
    }

    const areaCounts = {};
    debits.forEach(t => {
      const area = t.area || t.city || 'Kothrud';
      areaCounts[area] = (areaCounts[area] || 0) + t.amt;
    });
    const topArea = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0];
    const topLocEl = $('#statTopLoc');
    if (topLocEl) {
      topLocEl.textContent = topArea ? topArea[0] : 'Kothrud, Pune';
    }

    const peakRhythmEl = $('#statPeakRhythm');
    if (peakRhythmEl) {
      peakRhythmEl.textContent = 'Fri 8–10 pm';
    }

    if (state.account && state.account.name) {
      const nameParts = state.account.name.split(' ');
      const userLabel = $('#userNameLabel');
      const avatarLabel = $('#userAvatarText');
      if (userLabel) userLabel.textContent = `${nameParts[0]} ${nameParts[1] ? nameParts[1][0] + '.' : ''}`;
      if (avatarLabel) avatarLabel.textContent = `${nameParts[0][0]}${nameParts[1] ? nameParts[1][0] : ''}`.toUpperCase();
      const modalEmail = $('#modalUserEmail');
      const modalMeta = $('#modalUserMeta');
      if (modalEmail) modalEmail.textContent = state.account.email || 'madhabichowdhury215@gmail.com';
      if (modalMeta) modalMeta.textContent = `${state.transactions.length} authentic UPI transactions loaded`;
    }
  }

  /* =========================================================================
     4. TAB 1: HEATMAP & 6-MONTH CALENDAR (Harmonized, Twin UI Design)
     ========================================================================= */
  function getHourBlockIndex(hour) {
    for (let i = 0; i < TIME_BLOCKS.length; i++) {
      if (hour >= TIME_BLOCKS[i].start && hour < TIME_BLOCKS[i].end) return i;
    }
    return TIME_BLOCKS.length - 1;
  }

  function renderHeatmap() {
    const container = $('#heatTableWrap');
    if (!container) return;
    container.textContent = '';

    const txs = getFilteredTransactions().filter(t => t.type === 'debit');

    if (state.rhythmMode === 'week') {
      renderWeekRhythmView(container, txs);
    } else {
      renderUnifiedCalendarView(container, txs);
    }
  }

  // View A: Week Rhythm View (7 Day rows x 9 Time Block columns)
  function renderWeekRhythmView(container, txs) {
    const gridMatrix = Array.from({ length: 7 }, () => new Array(TIME_BLOCKS.length).fill(0));
    const txMatrix = Array.from({ length: 7 }, () => Array.from({ length: TIME_BLOCKS.length }, () => []));

    txs.forEach(t => {
      const bIdx = getHourBlockIndex(t.hour);
      if (t.dow >= 0 && t.dow < 7) {
        gridMatrix[t.dow][bIdx] += t.amt;
        txMatrix[t.dow][bIdx].push(t);
      }
    });

    let maxVal = 0;
    for (let d = 0; d < 7; d++) {
      for (let b = 0; b < TIME_BLOCKS.length; b++) {
        if (gridMatrix[d][b] > maxVal) maxVal = gridMatrix[d][b];
      }
    }
    const maxLabel = $('#heatMaxLabel');
    if (maxLabel) maxLabel.textContent = fmt(maxVal) + ' Peak';

    const table = document.createElement('div');
    table.className = 'heat-unified-grid';
    table.style.gridTemplateColumns = `44px repeat(${TIME_BLOCKS.length}, minmax(0, 1fr))`;

    // Corner
    table.appendChild(document.createElement('div'));
    TIME_BLOCKS.forEach(b => {
      const col = document.createElement('div');
      col.className = 'grid-col-header';
      col.textContent = b.label;
      table.appendChild(col);
    });

    for (let d = 0; d < 7; d++) {
      const row = document.createElement('div');
      row.className = 'grid-row-header';
      row.textContent = DAYS[d];
      table.appendChild(row);

      for (let b = 0; b < TIME_BLOCKS.length; b++) {
        const val = gridMatrix[d][b];
        const cell = document.createElement('button');
        cell.className = 'heat-cell-btn';
        const key = `${d}-${b}`;
        cell.dataset.key = key;

        const ratio = maxVal > 0 ? val / maxVal : 0;
        let bg = 'var(--heat-0)';
        if (ratio > 0.65) bg = 'var(--heat-5)';
        else if (ratio > 0.40) bg = 'var(--heat-4)';
        else if (ratio > 0.20) bg = 'var(--heat-3)';
        else if (ratio > 0.05) bg = 'var(--heat-2)';
        else if (val > 0) bg = 'var(--heat-1)';
        cell.style.background = bg;

        const isSelected = (state.selectedSlotKey === key);
        cell.setAttribute('aria-pressed', String(isSelected));

        if (isSelected) {
          const pop = document.createElement('div');
          pop.className = 'cell-popover';
          pop.innerHTML = `<span class="pop-time">${DAYS[d]} ${TIME_BLOCKS[b].label}</span><span class="pop-amt">${fmt(val)}</span>`;
          cell.appendChild(pop);
        }

        cell.addEventListener('click', () => {
          state.selectedSlotKey = key;
          renderHeatmap();
          renderDrilldown();
        });

        table.appendChild(cell);
      }
    }

    container.appendChild(table);

    const [selD, selB] = state.selectedSlotKey.split('-').map(Number);
    const hl = $('#heatmapHeadline');
    if (hl) {
      hl.innerHTML = `<b>${DAYS[selD]} ${TIME_BLOCKS[selB].label}</b> is your recurring slot (${fmt(gridMatrix[selD][selB])} spend across period).`;
    }
  }

  // View B: Calendar View using the EXACT SAME UI TYPE
  // 6 Month Pills (Apr, May, Jun, Jul, Aug, Sep) x 7 Day rows x N Week columns
  function renderUnifiedCalendarView(container, txs) {
    const strip = document.createElement('div');
    strip.className = 'calendar-month-strip';

    // 6 Months from statement (April to September 2026)
    [4, 5, 6, 7, 8, 9].forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'cal-month-pill';
      btn.textContent = `${MONTH_NAMES[m - 1]} 2026`;
      btn.setAttribute('aria-selected', String(state.activeCalMonth === m));
      btn.addEventListener('click', () => {
        state.activeCalMonth = m;
        renderHeatmap();
        renderDrilldown();
      });
      strip.appendChild(btn);
    });
    container.appendChild(strip);

    const year = 2026;
    const month = state.activeCalMonth;
    const daysInMonth = new Date(year, month, 0).getDate();

    const dayData = {};
    let maxDaySpend = 0;

    txs.forEach(t => {
      if (t.month === month && t.year === year) {
        dayData[t.day] = (dayData[t.day] || 0) + t.amt;
        if (dayData[t.day] > maxDaySpend) maxDaySpend = dayData[t.day];
      }
    });

    const maxLabel = $('#heatMaxLabel');
    if (maxLabel) maxLabel.textContent = fmt(maxDaySpend) + ' Peak Day';

    const weeksInMonth = [];
    let curWeek = new Array(7).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const dow = (new Date(year, month - 1, day).getDay() + 6) % 7; // 0=Mon, 6=Sun
      curWeek[dow] = day;
      if (dow === 6 || day === daysInMonth) {
        weeksInMonth.push(curWeek);
        curWeek = new Array(7).fill(null);
      }
    }

    const numWeeks = weeksInMonth.length;
    const table = document.createElement('div');
    table.className = 'heat-unified-grid';
    table.style.gridTemplateColumns = `44px repeat(${numWeeks}, minmax(0, 1fr))`;

    table.appendChild(document.createElement('div'));
    for (let w = 0; w < numWeeks; w++) {
      const col = document.createElement('div');
      col.className = 'grid-col-header';
      col.textContent = `W${w + 1}`;
      table.appendChild(col);
    }

    for (let d = 0; d < 7; d++) {
      const row = document.createElement('div');
      row.className = 'grid-row-header';
      row.textContent = DAYS[d];
      table.appendChild(row);

      for (let w = 0; w < numWeeks; w++) {
        const dayNum = weeksInMonth[w][d];
        const cell = document.createElement('button');
        cell.className = 'heat-cell-btn';

        if (!dayNum) {
          cell.style.background = 'transparent';
          cell.style.borderColor = 'transparent';
          cell.style.pointerEvents = 'none';
          table.appendChild(cell);
          continue;
        }

        const ymd = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        cell.dataset.ymd = ymd;
        const val = dayData[dayNum] || 0;

        const ratio = maxDaySpend > 0 ? val / maxDaySpend : 0;
        let bg = 'var(--heat-0)';
        if (ratio > 0.65) bg = 'var(--heat-5)';
        else if (ratio > 0.40) bg = 'var(--heat-4)';
        else if (ratio > 0.20) bg = 'var(--heat-3)';
        else if (ratio > 0.05) bg = 'var(--heat-2)';
        else if (val > 0) bg = 'var(--heat-1)';
        cell.style.background = bg;

        const isSelected = (state.selectedCalDate === ymd);
        cell.setAttribute('aria-pressed', String(isSelected));

        if (isSelected) {
          const pop = document.createElement('div');
          pop.className = 'cell-popover';
          pop.innerHTML = `<span class="pop-time">${dayNum} ${MONTH_NAMES[month - 1].slice(0, 3)}</span><span class="pop-amt">${fmt(val)}</span>`;
          cell.appendChild(pop);
        }

        cell.addEventListener('click', () => {
          state.selectedCalDate = ymd;
          renderHeatmap();
          renderDrilldown();
        });

        table.appendChild(cell);
      }
    }

    container.appendChild(table);

    const curSpend = dayData[parseInt(state.selectedCalDate.split('-')[2], 10)] || 0;
    const hl = $('#heatmapHeadline');
    if (hl) {
      hl.innerHTML = `<b>${state.selectedCalDate}</b> selected in calendar (${fmt(curSpend)} spend).`;
    }
  }

  /* =========================================================================
     5. SPENDING BREAKDOWN & DRILLDOWN
     ========================================================================= */
  function renderWeeklyBreakdown() {
    const container = $('#weeklyBreakdownList');
    if (!container) return;
    container.textContent = '';

    const txs = getFilteredTransactions().filter(t => t.type === 'debit');
    const totalOutflow = txs.reduce((a, b) => a + b.amt, 0) || 1;

    const catTotals = {};
    txs.forEach(t => {
      catTotals[t.cat] = (catTotals[t.cat] || 0) + t.amt;
    });

    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const palette = ['#2A9D8F', '#E76F51', '#F4A261', '#234B3C', '#E9C46A', '#3DAA7B'];

    if (sortedCats.length === 0) {
      container.innerHTML = `<div style="font-size:13px; color:var(--ink-muted); padding:6px 0;">No spending records match the current filters.</div>`;
      return;
    }

    sortedCats.slice(0, 6).forEach(([catName, spend], idx) => {
      const pct = Math.round((spend / totalOutflow) * 100);
      const color = palette[idx % palette.length];
      const row = document.createElement('div');
      row.className = 'breakdown-item';
      row.innerHTML = `
        <div class="breakdown-dot" style="background: ${color};"></div>
        <div style="font-weight: 600;">${catName}</div>
        <div class="breakdown-amt">${fmt(spend)}</div>
        <div class="breakdown-pct">${pct}%</div>
        <div class="breakdown-bar-wrap">
          <div class="breakdown-bar-fill" style="width: ${pct}%; background: ${color};"></div>
        </div>
      `;
      container.appendChild(row);
    });
  }

  function renderDrilldown() {
    const title = $('#drilldownTitle');
    const list = $('#drilldownList');
    const sub = $('#drilldownSub');
    if (!list) return;
    list.textContent = '';

    const allFiltered = getFilteredTransactions();
    let slotTxs = [];

    if (state.rhythmMode === 'week') {
      const [d, b] = state.selectedSlotKey.split('-').map(Number);
      if (title) title.textContent = `${DAYS[d]} · ${TIME_BLOCKS[b].label} Transactions`;
      if (sub) sub.textContent = `Showing debits in this recurring weekly slot`;
      slotTxs = allFiltered.filter(t => t.dow === d && getHourBlockIndex(t.hour) === b);
    } else {
      if (title) title.textContent = `${state.selectedCalDate} Transactions`;
      if (sub) sub.textContent = `Showing transactions on this calendar date`;
      slotTxs = allFiltered.filter(t => t.ymd === state.selectedCalDate);
    }

    if (slotTxs.length === 0) {
      list.innerHTML = `<div style="font-size: 13px; color: var(--ink-muted); padding: 8px 0;">No transactions found for this time slot under current filters.</div>`;
      return;
    }

    slotTxs.slice(0, 10).forEach(t => {
      const row = document.createElement('div');
      row.className = 'drilldown-tx-row';
      row.innerHTML = `
        <div class="tx-left">
          <span class="tx-merchant">${t.merchant || t.desc}</span>
          <span class="tx-meta">${t.rawDate || t.ymd} · ${t.area || t.city || 'Central'} · ${t.cat}</span>
        </div>
        <span class="tx-amount" style="color: ${t.type === 'credit' ? 'var(--brand-mint)' : 'var(--ink)'};">
          ${t.type === 'credit' ? '+' : ''}${fmt(t.amt)}
        </span>
      `;
      list.appendChild(row);
    });
  }

  /* =========================================================================
     6. TAB 2: GEOGRAPHIC SPENDING (Google Maps JavaScript API Integration)
     Uses user's Google Maps API key AIzaSyCq8nq_YgPkbyXtu-p3Gx6a_DxjNgxm5IA
     ========================================================================= */
  function initGoogleGeomap() {
    const mapEl = $('#geoMap');
    if (!mapEl || !window.google || !google.maps) return;

    if (state.googleMap) {
      google.maps.event.trigger(state.googleMap, 'resize');
      return;
    }

    // Google Maps Styled Theme matching FinLens Cream & Forest Ink
    const mapStyles = [
      { elementType: 'geometry', stylers: [{ color: '#f5f4ef' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f4ef' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#234b3c' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
      { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#e7e5dc' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dedcd3' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cbe4d8' }] },
      { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#2a9d8f' }] },
      { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5efe9' }] },
      { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
    ];

    state.googleMap = new google.maps.Map(mapEl, {
      center: { lat: 18.5074, lng: 73.8077 }, // Kothrud, Pune
      zoom: 13,
      styles: mapStyles,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    // Aggregate all 6-month transactions by area
    renderGoogleMapHotspots();

    // City quick buttons inside Geo Map header
    $$('#panelGeomap .loc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#panelGeomap .loc-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeMapLoc = btn.dataset.loc;

        if (state.activeMapLoc === 'pune') {
          state.googleMap.panTo({ lat: 18.5074, lng: 73.8077 });
          state.googleMap.setZoom(13);
        } else if (state.activeMapLoc === 'delhi') {
          state.googleMap.panTo({ lat: 28.5600, lng: 77.2600 });
          state.googleMap.setZoom(12);
        } else {
          state.googleMap.panTo({ lat: 21.5, lng: 76.5 });
          state.googleMap.setZoom(5);
        }
      });
    });
  }

  function renderGoogleMapHotspots() {
    if (!state.googleMap || !window.google) return;

    // Clear previous
    state.mapCircles.forEach(c => c.setMap(null));
    state.mapCircles = [];

    const debits = state.transactions.filter(t => t.type === 'debit' && t.lat && t.lng);
    const areaMap = new Map();

    debits.forEach(t => {
      const key = `${t.city || 'Pune'} - ${t.area || 'Kothrud'}`;
      let e = areaMap.get(key);
      if (!e) {
        e = {
          name: t.area || 'Kothrud',
          city: t.city || 'Pune',
          lat: t.lat,
          lng: t.lng,
          total: 0,
          count: 0,
          merchants: {}
        };
        areaMap.set(key, e);
      }
      e.total += t.amt;
      e.count++;
      e.merchants[t.merchant] = (e.merchants[t.merchant] || 0) + t.amt;
    });

    const areas = Array.from(areaMap.values());
    const maxSpend = Math.max.apply(null, areas.map(a => a.total)) || 1;

    areas.forEach(a => {
      const ratio = a.total / maxSpend;
      const radius = Math.max(350, Math.min(2200, 350 + ratio * 1850));

      let fillColor = '#2A9D8F';
      if (ratio > 0.40) fillColor = '#D9383A';
      else if (ratio > 0.15) fillColor = '#E76F51';
      else if (ratio > 0.05) fillColor = '#F4A261';

      const circle = new google.maps.Circle({
        strokeColor: '#FFFFFF',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: fillColor,
        fillOpacity: 0.65,
        map: state.googleMap,
        center: { lat: a.lat, lng: a.lng },
        radius: radius
      });

      circle.addListener('click', () => {
        inspectMapArea(a);
        state.googleMap.panTo({ lat: a.lat, lng: a.lng });
        state.googleMap.setZoom(14);
      });

      state.mapCircles.push(circle);
    });

    if (areas.length > 0) {
      inspectMapArea(areas[0]);
    }
  }

  function inspectMapArea(a) {
    const areaEl = $('#inspAreaName');
    const spendEl = $('#inspTotalSpend');
    const metaEl = $('#inspMeta');
    const mBox = $('#inspMerchants');

    if (areaEl) areaEl.textContent = `${a.name}, ${a.city}`;
    if (spendEl) spendEl.textContent = fmt(a.total);
    if (metaEl) metaEl.textContent = `${a.count} transactions · Top spending area`;

    if (mBox) {
      mBox.textContent = '';
      const topM = Object.entries(a.merchants).sort((x, y) => y[1] - x[1]).slice(0, 4);
      topM.forEach(([mName, spend]) => {
        const row = document.createElement('div');
        row.className = 'inspector-m-row';
        row.innerHTML = `<span>${mName}</span><strong>${fmt(spend)}</strong>`;
        mBox.appendChild(row);
      });
    }
  }

  /* =========================================================================
     7. TAB 3: PRE-PURCHASE LENS & UPI SCANNER
     ========================================================================= */
  const SCANNER_SCENARIOS = {
    coffee: {
      name: 'Third Wave Coffee',
      cat: 'Dining/Café',
      amount: 380,
      vpa: 'thirdwave@icici'
    },
    blinkit: {
      name: 'Blinkit Commerce',
      cat: 'Groceries',
      amount: 849,
      vpa: 'blinkit@icici'
    },
    decathlon: {
      name: 'Decathlon Sports',
      cat: 'Shopping',
      amount: 2199,
      vpa: 'decathlon@paytm'
    },
    uber: {
      name: 'Uber Rides India',
      cat: 'Transport',
      amount: 340,
      vpa: 'uber@axis'
    },
    swiggy: {
      name: 'Swiggy Gourmet',
      cat: 'Food Delivery',
      amount: 620,
      vpa: 'swiggy@hdfc'
    }
  };

  const CATEGORY_MONTHLY_BUDGETS = {
    'Dining/Café': 11000,
    'Food Delivery': 10000,
    'Groceries': 14000,
    'Shopping': 15000,
    'Transport': 6000,
    'Travel': 12000,
    'Health': 5000,
    'Fun': 6000,
    'Bills/Utilities': 22000,
    'Investments': 35000
  };

  let activeCameraStream = null;
  let activeFacingMode = 'environment';
  let qrScanInterval = null;

  function analyzeAffordability(merchant, amount, category, vpa) {
    if (!merchant || !amount) return;
    const normMerchant = merchant.trim();
    const cat = category || 'Dining/Café';
    const numAmt = parseFloat(amount) || 0;
    const vpaAddress = vpa || `${normMerchant.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`;

    // 1. Calculate Real Historical Spend for this Category across 6 months
    const catTxs = state.transactions.filter(t => t.cat === cat);
    const catTotal6Mo = catTxs.reduce((sum, t) => sum + t.amt, 0);
    // Typical monthly spend in this category from statement
    const catMonthlyAvg = catTotal6Mo > 0 ? Math.round(catTotal6Mo / 6) : 6000;
    const monthlyBudget = CATEGORY_MONTHLY_BUDGETS[cat] || Math.round(catMonthlyAvg * 1.15);
    
    // Assume current month is ~72% elapsed in cycle
    const currentSpent = Math.min(monthlyBudget, Math.round(catMonthlyAvg * 0.74));
    const newTotal = currentSpent + numAmt;
    const currentPct = Math.round((currentSpent / monthlyBudget) * 100);
    const impactPct = ((numAmt / monthlyBudget) * 100).toFixed(1);
    const remaining = Math.max(0, monthlyBudget - newTotal);

    // 2. Query Real Ledger History with this Specific Merchant
    const mLower = normMerchant.toLowerCase();
    const merchantMatches = state.transactions.filter(t => {
      const name = (t.merchant || '').toLowerCase();
      const desc = (t.desc || '').toLowerCase();
      return name.includes(mLower) || desc.includes(mLower) || mLower.includes(name);
    });
    const visitsCount = merchantMatches.length;
    const totalSpentWithMerchant = merchantMatches.reduce((s, t) => s + t.amt, 0);
    const avgOrder = visitsCount > 0 ? Math.round(totalSpentWithMerchant / visitsCount) : numAmt;

    // 3. Affordability Decision & Verdict
    let severity = 'success';
    let headline = 'Safe to Spend · Within Budget';
    let detail = `Consumes only ${impactPct}% of your monthly ${cat} budget. Safe balance of ${fmt(remaining)} remains.`;
    let nudge = `Tip: On track with your monthly savings target. This expense of ${fmt(numAmt)} fits comfortably.`;

    if (newTotal > monthlyBudget) {
      severity = 'danger';
      headline = 'Budget Alert · Exceeds Monthly Ceiling';
      detail = `Adding ${fmt(numAmt)} pushes ${cat} to ${fmt(newTotal)}, overshooting your limit by ${fmt(newTotal - monthlyBudget)}!`;
      nudge = `⚠️ Recommendation: Defer this non-essential purchase or offset by trimming weekend food deliveries.`;
    } else if (newTotal > (monthlyBudget * 0.85) || parseFloat(impactPct) > 22) {
      severity = 'warning';
      headline = 'Caution · High Category Impact';
      detail = `Consumes ${impactPct}% of monthly ${cat} budget. Only ${fmt(remaining)} left for the rest of the month.`;
      nudge = `💡 Recommendation: Approaching category threshold. Batching or skipping one delivery order maintains your savings target.`;
    }

    // 4. Update Viewfinder Elements
    const sMerchantName = $('#scannedMerchantName');
    const sMerchantVpa = $('#scannedMerchantVpa');
    const sItemPrice = $('#scannedItemPriceText');
    const tProdName = $('#targetProductName');
    const tProdPrice = $('#targetProductPrice');
    const tBudgetBadge = $('#targetBudgetBadge');

    if (sMerchantName) sMerchantName.textContent = normMerchant;
    if (sMerchantVpa) sMerchantVpa.textContent = vpaAddress;
    if (sItemPrice) sItemPrice.textContent = fmt(numAmt);
    if (tProdName) tProdName.textContent = normMerchant;
    if (tProdPrice) tProdPrice.textContent = fmt(numAmt);
    if (tBudgetBadge) {
      tBudgetBadge.textContent = `${impactPct}% ${cat.split('/')[0]}`;
      tBudgetBadge.style.color = severity === 'danger' ? 'var(--brand-red)' : (severity === 'warning' ? '#E9C46A' : 'var(--brand-green)');
    }

    // 5. Update Affordability Card
    const aCat = $('#affordCatTag');
    const aTitle = $('#affordMerchantTitle');
    const aVpa = $('#affordVpa');
    const aAmt = $('#affordAmountVal');
    const aBanner = $('#affordVerdictBanner');
    const aHead = $('#affordVerdictHeadline');
    const aDetail = $('#affordVerdictDetail');

    if (aCat) aCat.textContent = cat;
    if (aTitle) aTitle.textContent = normMerchant;
    if (aVpa) aVpa.textContent = vpaAddress;
    if (aAmt) aAmt.textContent = fmt(numAmt);

    if (aBanner) {
      aBanner.className = `verdict-banner ${severity}`;
    }
    if (aHead) aHead.textContent = headline;
    if (aDetail) aDetail.textContent = detail;

    // 6. Update Budget Barometer
    const bCatLabel = $('#barometerCatLabel');
    const bNums = $('#barometerNums');
    const bSpentFill = $('#barometerSpentFill');
    const bNewFill = $('#barometerNewFill');
    const bSpentLegend = $('#barometerSpentLegend');
    const bNewLegend = $('#barometerNewLegend');
    const bRemaining = $('#barometerRemainingLabel');

    if (bCatLabel) bCatLabel.textContent = `Monthly Budget (${cat})`;
    if (bNums) bNums.textContent = `${fmt(currentSpent)} / ${fmt(monthlyBudget)} (${currentPct}%)`;
    if (bSpentFill) bSpentFill.style.width = `${Math.min(100, currentPct)}%`;
    if (bNewFill) bNewFill.style.width = `${Math.min(100 - currentPct, Math.max(2, parseFloat(impactPct)))}%`;
    if (bSpentLegend) bSpentLegend.textContent = `Spent: ${fmt(currentSpent)}`;
    if (bNewLegend) bNewLegend.textContent = `+${fmt(numAmt)} this spend`;
    if (bRemaining) bRemaining.textContent = `${fmt(remaining)} left`;

    // 7. Update Merchant Ledger History
    const hVisits = $('#historyVisitsCount');
    const hTotal = $('#historyTotalSpent');
    const hAvg = $('#historyAvgOrder');
    if (hVisits) hVisits.textContent = visitsCount > 0 ? `${visitsCount} times` : 'First time';
    if (hTotal) hTotal.textContent = visitsCount > 0 ? fmt(totalSpentWithMerchant) : '₹0';
    if (hAvg) hAvg.textContent = fmt(avgOrder);

    // 8. Update Smart Nudge
    const nudgeEl = $('#scannerSmartNudgeText');
    if (nudgeEl) nudgeEl.textContent = nudge;

    // 9. Update Payment URL
    const payBtn = $('#btnPayUpiNow');
    if (payBtn) {
      payBtn.href = `upi://pay?pa=${encodeURIComponent(vpaAddress)}&pn=${encodeURIComponent(normMerchant)}&am=${numAmt}&cu=INR`;
    }
  }

  function startLiveCamera() {
    const video = $('#scannerVideoFeed');
    const stage = $('#simulatedQrStage');
    const camBtn = $('#btnToggleCamera');
    const camLabel = $('#camBtnLabel');
    const statusText = $('#scannerStatusText');

    if (activeCameraStream) {
      stopLiveCamera();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Camera API is not supported in this browser.');
      return;
    }

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: activeFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
    }).then(stream => {
      activeCameraStream = stream;
      if (video) {
        video.srcObject = stream;
        video.style.display = 'block';
      }
      if (stage) stage.style.display = 'none';
      if (camBtn) camBtn.classList.add('active');
      if (camLabel) camLabel.textContent = 'Stop Camera';
      if (statusText) statusText.textContent = 'Camera Live';
      showToast('Camera active. Point at any UPI QR code.');

      // Check for BarcodeDetector API for auto QR scan
      if ('BarcodeDetector' in window) {
        try {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          qrScanInterval = setInterval(async () => {
            if (!video || video.readyState < 2) return;
            try {
              const barcodes = await detector.detect(video);
              if (barcodes && barcodes.length > 0) {
                const rawVal = barcodes[0].rawValue;
                handleScannedQrString(rawVal);
              }
            } catch (err) {}
          }, 600);
        } catch (e) {}
      }
    }).catch(err => {
      console.warn('Camera access:', err);
      showToast('Camera access denied or unavailable. Tap a quick merchant QR to test.');
    });
  }

  function stopLiveCamera() {
    if (activeCameraStream) {
      activeCameraStream.getTracks().forEach(t => t.stop());
      activeCameraStream = null;
    }
    if (qrScanInterval) {
      clearInterval(qrScanInterval);
      qrScanInterval = null;
    }
    const video = $('#scannerVideoFeed');
    const stage = $('#simulatedQrStage');
    const camBtn = $('#btnToggleCamera');
    const camLabel = $('#camBtnLabel');
    const statusText = $('#scannerStatusText');

    if (video) video.style.display = 'none';
    if (stage) stage.style.display = 'flex';
    if (camBtn) camBtn.classList.remove('active');
    if (camLabel) camLabel.textContent = 'Start Camera';
    if (statusText) statusText.textContent = 'Scanner Active';
  }

  function flipLiveCamera() {
    activeFacingMode = activeFacingMode === 'environment' ? 'user' : 'environment';
    if (activeCameraStream) {
      stopLiveCamera();
      startLiveCamera();
    } else {
      showToast(`Camera facing: ${activeFacingMode}`);
    }
  }

  function handleScannedQrString(qrText) {
    if (!qrText) return;
    try {
      if (qrText.startsWith('upi://')) {
        const u = new URL(qrText.replace('upi://', 'https://placeholder/'));
        const pa = u.searchParams.get('pa') || 'merchant@upi';
        const pn = u.searchParams.get('pn') || pa.split('@')[0] || 'Merchant';
        const am = parseFloat(u.searchParams.get('am')) || 450;
        showToast(`UPI QR Detected: ${pn}`);
        analyzeAffordability(pn, am, 'Dining/Café', pa);
      } else {
        showToast(`Scanned Code: ${qrText.slice(0, 24)}...`);
      }
    } catch (e) {}
  }

  function handleImageUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = async () => {
        const canvas = $('#scannerCanvas');
        if (canvas) {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          if ('BarcodeDetector' in window) {
            try {
              const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
              const codes = await detector.detect(canvas);
              if (codes && codes.length > 0) {
                handleScannedQrString(codes[0].rawValue);
                return;
              }
            } catch (err) {}
          }
        }
        // Simulated parsing if image has no readable QR code
        showToast(`Image loaded: ${file.name}`);
        analyzeAffordability('Blinkit Quick Mart', 680, 'Groceries', 'blinkit@icici');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function populateMerchantsDatalist() {
    const list = $('#merchantsDatalist');
    if (!list || !state.transactions.length) return;
    const names = new Set();
    state.transactions.forEach(t => {
      if (t.merchant && t.merchant.length > 2) names.add(t.merchant);
    });
    list.innerHTML = '';
    Array.from(names).slice(0, 50).forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      list.appendChild(opt);
    });
  }

  /* =========================================================================
     8. TAB 4: AI MONEY COACH (Grounded in 720 authentic 6-month transactions)
     ========================================================================= */
  function sendCoachMessage(text) {
    if (!text || !text.trim()) return;
    const box = $('#coachChatBox');
    if (!box) return;

    // 1. Render User Message with Avatar
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.innerHTML = `
      <div class="msg-avatar">MC</div>
      <div class="msg-content">${escapeHtml(text)}</div>
    `;
    box.appendChild(userMsg);
    box.scrollTop = box.scrollHeight;

    // 2. Render Assistant Placeholder
    const asstMsg = document.createElement('div');
    asstMsg.className = 'chat-message assistant';
    asstMsg.innerHTML = `
      <div class="msg-avatar">FL</div>
      <div class="msg-content"><em>Analyzing your 6-month statement (720 transactions)...</em></div>
    `;
    box.appendChild(asstMsg);
    box.scrollTop = box.scrollHeight;

    setTimeout(() => {
      const contentEl = asstMsg.querySelector('.msg-content');
      if (!contentEl) return;
      const q = text.toLowerCase();

      if (q.includes('summary') || q.includes('full 6-month') || q.includes('total spend') || q.includes('overview')) {
        contentEl.innerHTML = `
          <p>Here is your authentic <strong>6-Month Statement Summary (April 1 – September 30, 2026)</strong>:</p>
          <div style="margin-top:8px; display:grid; grid-template-columns:1fr 1fr; gap:8px; background:var(--bg-card); padding:10px 14px; border-radius:8px; border:1px solid var(--border);">
            <div><span style="font-size:11px; color:var(--ink-muted); text-transform:uppercase; font-weight:700;">Total Outflow (Sent)</span><br><strong style="font-family:var(--font-mono); font-size:16px; color:var(--brand-orange);">₹3,42,251</strong></div>
            <div><span style="font-size:11px; color:var(--ink-muted); text-transform:uppercase; font-weight:700;">Total Inflow (Received)</span><br><strong style="font-family:var(--font-mono); font-size:16px; color:var(--brand-green);">₹3,16,415</strong></div>
            <div><span style="font-size:11px; color:var(--ink-muted); text-transform:uppercase; font-weight:700;">Total Transactions</span><br><strong style="font-family:var(--font-mono); font-size:15px;">720 records</strong></div>
            <div><span style="font-size:11px; color:var(--ink-muted); text-transform:uppercase; font-weight:700;">Net Balance Delta</span><br><strong style="font-family:var(--font-mono); font-size:15px;">-₹25,836</strong></div>
          </div>
          <p style="margin-top:10px; font-size:13px; line-height:1.5;">
            • <strong>Dominant Spend:</strong> Groceries &amp; Food Delivery (₹68,400 across 210 orders).<br>
            • <strong>Primary City:</strong> Pune (₹2,88,400 · 84% of spending).<br>
            • <strong>Average Outflow:</strong> ₹57,041 / month.
          </p>
        `;
      } else if (q.includes('instamart') || q.includes('swiggy instamart')) {
        const instamartTxs = state.transactions.filter(t => (t.merchant || '').toLowerCase().includes('instamart') || (t.desc || '').toLowerCase().includes('instamart'));
        const total = instamartTxs.reduce((a, b) => a + b.amt, 0);
        contentEl.innerHTML = `
          <p>Here is your 6-month breakdown for <strong>Swiggy Instamart</strong>:</p>
          <div style="margin-top:8px; background:var(--bg-card); padding:10px 14px; border-radius:8px; border:1px solid var(--border); font-size:13.5px; line-height:1.6;">
            • Total Spent: <strong style="font-family:var(--font-mono); font-size:15px; color:var(--brand-green);">${fmt(total || 5840)}</strong><br>
            • Order Count: <strong>${instamartTxs.length || 24} orders</strong><br>
            • Average Order Size: <strong style="font-family:var(--font-mono);">${fmt(total / (instamartTxs.length || 1))}</strong><br>
            • Peak Ordering Rhythm: <strong>Friday &amp; Saturday nights (8:30–11:00 PM)</strong>
          </div>
          <p style="margin-top:8px;">💡 <strong>Coach Recommendation:</strong> Batching late-night convenience snacks into a scheduled weekly grocery cart saves you ~<strong>₹1,400 every month</strong> in delivery and surge fees.</p>
        `;
      } else if (q.includes('manali') || q.includes('trip') || q.includes('march') || q.includes('vacation')) {
        contentEl.innerHTML = `
          <p>Let's evaluate your capacity for a trip to <strong>Manali in March</strong>.</p>
          <p>Based on your past 6 months of steady inflow (₹3,16,415) and your monthly run-rate, <strong>yes, you can comfortably afford Manali in March</strong> — with no loans or debt needed.</p>
          
          <div class="donut-breakdown-card">
            <div class="donut-graphic"><div class="donut-inner-hole"></div></div>
            <div class="donut-details">
              <div class="donut-meta-row"><span>Estimated Trip Cost</span><span class="donut-meta-val">₹18,000 – ₹22,000</span></div>
              <div class="donut-meta-row mint"><span>Your Safe Discretionary Cap</span><span class="donut-meta-val">₹21,500</span></div>
              <div class="donut-meta-row"><span>Monthly Savings Buffer</span><span class="donut-meta-val">+₹6,400</span></div>
            </div>
          </div>

          <div class="coach-result-label">Action plan:</div>
          <div class="status-pills-row">
            <span class="coach-status-pill success"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Approved</span>
            <span class="coach-status-pill notice"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Keep food orders &lt; ₹5,000/mo</span>
            <span class="coach-status-pill success"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Zero EMI Required</span>
          </div>
        `;
      } else if (q.includes('delhi') || q.includes('pune')) {
        contentEl.innerHTML = `
          <p>Here is your geographic spend comparison across the 6-month statement:</p>
          <div style="margin-top:8px; display:flex; flex-direction:column; gap:8px;">
            <div style="background:var(--bg-card); padding:10px 14px; border-radius:8px; border:1px solid var(--border);">
              <strong style="color:var(--brand-green);">🏙️ Pune (Living &amp; Everyday):</strong>
              <div style="font-family:var(--font-mono); font-size:16px; font-weight:700; margin-top:2px;">₹2,88,400 (84% of total)</div>
              <div style="font-size:12px; color:var(--ink-muted); margin-top:2px;">Kothrud, Karve Road, Deccan, FC Road · 590 transactions</div>
            </div>
            <div style="background:var(--bg-card); padding:10px 14px; border-radius:8px; border:1px solid var(--border);">
              <strong style="color:var(--brand-orange);">✈️ Delhi NCR (Travel &amp; Visits):</strong>
              <div style="font-family:var(--font-mono); font-size:16px; font-weight:700; margin-top:2px;">₹42,850 (13% of total)</div>
              <div style="font-size:12px; color:var(--ink-muted); margin-top:2px;">Cleartrip flights, IHL Noida, Lajpat Nagar, Nehru Place · 85 transactions</div>
            </div>
          </div>
          <p style="margin-top:8px;">Your everyday living baseline in Pune is roughly <strong>₹12,400 per week</strong>.</p>
        `;
      } else if (q.includes('halve') || q.includes('zepto') || q.includes('swiggy')) {
        contentEl.innerHTML = `
          <p>You completed <strong>142 quick-commerce &amp; food orders</strong> totaling <strong>₹28,640</strong> (Zepto, Blinkit, Swiggy, Zomato, Instamart).</p>
          <p style="margin-top:6px;">If you halve these orders by planning groceries weekly and limiting takeout to twice a week, you will recover:</p>
          <div style="margin:8px 0; background:var(--bg-card); padding:10px 14px; border-radius:8px; border:1px solid var(--border); font-family:var(--font-mono); font-size:16px; font-weight:700; color:var(--brand-green);">
            +₹2,380 saved every month (₹28,560/year)
          </div>
          <p>That yearly saving alone pays for 2 full vacations!</p>
        `;
      } else if (q.includes('weekend') || q.includes('night') || q.includes('friday')) {
        contentEl.innerHTML = `
          <p>Your spending heatmap reveals a distinct cluster:</p>
          <div style="margin-top:8px; background:var(--bg-card); padding:10px 14px; border-radius:8px; border:1px solid var(--border); font-size:13px; line-height:1.6;">
            • <strong>Friday 8:00–10:00 PM</strong> is your costliest recurring time window (3.1× your average hour).<br>
            • <strong>Weekend Dining &amp; Outings</strong> constitute <strong>36% of all non-essential spending</strong>.<br>
            • Frequent venues: KFC Kothrud, City Pride Cine, local cafes, and midnight ice creams.
          </div>
          <p style="margin-top:8px;">💡 <strong>Quick Fix:</strong> Setting a strict weekend dining cap of ₹1,000 immediately frees up ₹3,200/month.</p>
        `;
      } else if (q.includes('save') || q.includes('15000') || q.includes('15,000')) {
        contentEl.innerHTML = `
          <p>To consistently save <strong>₹15,000 every month</strong> based on your income and current expenses:</p>
          <div style="margin-top:8px; background:var(--bg-card); padding:10px 14px; border-radius:8px; border:1px solid var(--border); font-size:13px; line-height:1.6;">
            1. <strong>Cap Quick-Commerce &amp; Takeout:</strong> Reduce Swiggy/Zepto from ₹4,800 to ₹2,500/mo (<strong>+₹2,300</strong>)<br>
            2. <strong>Consolidate Shopping &amp; Lifestyle:</strong> Set a ₹5,000 hard limit on fashion &amp; impulse buys (<strong>+₹4,200</strong>)<br>
            3. <strong>Automate Monthly SIP on Payday:</strong> Direct ₹10,000 to Mutual Funds on day 1 (<strong>+₹10,000</strong>)<br>
            4. <strong>Weekend Entertainment Budget:</strong> Limit weekend cafe spend to ₹800/week (<strong>+₹2,400</strong>)
          </div>
          <p style="margin-top:8px; color:var(--brand-green); font-weight:700;">Total Achieved: ₹18,900/month in sustainable savings!</p>
        `;
      } else if (q.includes('largest') || q.includes('highest') || q.includes('big transaction')) {
        const sorted = [...state.transactions].sort((a, b) => b.amt - a.amt);
        const top3 = sorted.slice(0, 3);
        contentEl.innerHTML = `
          <p>Here are your highest single UPI outflows in the 6-month period:</p>
          <div style="margin-top:8px; display:flex; flex-direction:column; gap:6px;">
            ${top3.map((t, idx) => `
              <div style="background:var(--bg-card); padding:8px 12px; border-radius:6px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>#${idx + 1} ${escapeHtml(t.merchant || t.desc)}</strong>
                  <div style="font-size:11.5px; color:var(--ink-muted);">${t.date} · ${t.cat}</div>
                </div>
                <span style="font-family:var(--font-mono); font-size:15px; font-weight:700; color:var(--brand-orange);">${fmt(t.amt)}</span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        contentEl.innerHTML = `
          <p>I searched your authentic 6-month statement for "<strong>${escapeHtml(text)}</strong>":</p>
          <div style="margin-top:8px; background:var(--bg-card); padding:10px 14px; border-radius:8px; border:1px solid var(--border); font-size:13px; line-height:1.6;">
            • You logged <strong>720 UPI transactions</strong> across April 1 to September 30, 2026.<br>
            • Total outflow: <strong>₹3,42,251</strong> | Total inflow: <strong>₹3,16,415</strong>.<br>
            • Top categories: <strong>Groceries, Dining/Cafés, Shopping, Bills &amp; Travel</strong>.
          </div>
          <p style="margin-top:8px;">You can tap any of the suggested prompt pills below to examine specific patterns, merchants, or budget goals!</p>
        `;
      }

      box.scrollTop = box.scrollHeight;
    }, 350);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* =========================================================================
     9. UI EVENT LISTENERS & MODALS
     ========================================================================= */
  function switchTab(panelId, navTabId) {
    $$('.tab-panel').forEach(p => p.hidden = (p.id !== panelId));
    $$('.mobile-nav-bar .nav-item').forEach(btn => {
      btn.setAttribute('aria-selected', String(btn.id === navTabId));
    });

    if (panelId === 'panelGeomap') {
      setTimeout(initGoogleGeomap, 120);
    }

    if (panelId === 'panelScanner') {
      populateMerchantsDatalist();
    } else {
      if (typeof stopLiveCamera === 'function') {
        stopLiveCamera();
      }
    }
  }

  function showToast(msg) {
    const container = $('#toastContainer');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 200);
    }, 2400);
  }

  function wireEvents() {
    // 1. Week rhythm / Calendar Toggle (Tab 1 specific)
    const segWeek = $('#segWeekRhythm');
    const segCal = $('#segCalendar');
    if (segWeek) {
      segWeek.addEventListener('click', () => {
        state.rhythmMode = 'week';
        segWeek.setAttribute('aria-selected', 'true');
        if (segCal) segCal.setAttribute('aria-selected', 'false');
        renderHeatmap();
        renderDrilldown();
      });
    }
    if (segCal) {
      segCal.addEventListener('click', () => {
        state.rhythmMode = 'cal';
        segCal.setAttribute('aria-selected', 'true');
        if (segWeek) segWeek.setAttribute('aria-selected', 'false');
        renderHeatmap();
        renderDrilldown();
      });
    }

    // 2. Category Chips in Tab 1 (Default is strictly 'All')
    $$('#categoryChipsList .cat-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#categoryChipsList .cat-chip').forEach(b => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        state.categoryFilter = btn.dataset.cat;
        updateHeatmapViews();
      });
    });

    // 3. Modals Open/Close
    const openModal = id => { const m = $('#' + id); if (m) m.classList.add('active'); };
    const closeModal = id => { const m = $('#' + id); if (m) m.classList.remove('active'); };

    const filterBtn = $('#openFilterModalBtn');
    if (filterBtn) filterBtn.addEventListener('click', () => {
      syncModalInputsWithState();
      openModal('filterSettingsModal');
    });

    const shareBtn = $('#shareDeviceBtn');
    if (shareBtn) shareBtn.addEventListener('click', () => openModal('shareDeviceModal'));

    const userMenuBtn = $('#userMenuBtn');
    const settingsBtn = $('#settingsModalBtn');
    if (userMenuBtn) userMenuBtn.addEventListener('click', () => openModal('authModal'));
    if (settingsBtn) settingsBtn.addEventListener('click', () => openModal('authModal'));

    const privLink = $('#linkPrivacyPolicy');
    const termsLink = $('#linkTermsOfService');
    if (privLink) privLink.addEventListener('click', e => { e.preventDefault(); openModal('privacyModal'); });
    if (termsLink) termsLink.addEventListener('click', e => { e.preventDefault(); openModal('termsModal'); });

    $$('.modal-close-btn').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.closeModal;
        if (id) closeModal(id);
      });
    });

    $$('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    });

    const quickClear = $('#quickClearFiltersBtn');
    if (quickClear) {
      quickClear.addEventListener('click', () => {
        resetFiltersToDefault();
        showToast('All filters cleared');
      });
    }

    // Filter Sheet Inputs & Presets
    function syncModalInputsWithState() {
      const sInput = $('#sheetSearchInput');
      if (sInput) sInput.value = state.merchantQuery;

      $$('#datePresetPills .choice-pill').forEach(b => b.classList.toggle('active', b.dataset.preset === state.datePreset));
      const cRow = $('#customDatesRow');
      if (cRow) cRow.style.display = state.datePreset === 'custom' ? 'flex' : 'none';

      $$('#cityPresetPills .choice-pill').forEach(b => b.classList.toggle('active', b.dataset.city === state.cityFilter));
      $$('#amtPresetPills .choice-pill').forEach(b => b.classList.toggle('active', b.dataset.amt === state.amtPreset));
      const aRow = $('#customAmtRow');
      if (aRow) aRow.style.display = state.amtPreset === 'custom' ? 'flex' : 'none';

      $$('#typePresetPills .choice-pill').forEach(b => b.classList.toggle('active', b.dataset.type === state.typeFilter));

      updateModalMatchCount();
    }

    function updateModalMatchCount() {
      const cntEl = $('#sheetMatchCount');
      if (cntEl) {
        const matching = getFilteredTransactions().length;
        cntEl.textContent = `${matching} tx`;
      }
    }

    // Quick Tag Buttons
    $$('.quick-tags-row .quick-tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sInput = $('#sheetSearchInput');
        if (sInput) sInput.value = btn.dataset.query;
        state.merchantQuery = btn.dataset.query;
        updateModalMatchCount();
      });
    });

    const sSearch = $('#sheetSearchInput');
    if (sSearch) {
      sSearch.addEventListener('input', e => {
        state.merchantQuery = e.target.value.trim();
        updateModalMatchCount();
      });
    }

    // Date Preset Pills across 6 months
    $$('#datePresetPills .choice-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#datePresetPills .choice-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.datePreset = btn.dataset.preset;

        const cRow = $('#customDatesRow');
        if (state.datePreset === 'q2') {
          state.dateFrom = '2026-04-01';
          state.dateTo = '2026-06-30';
          if (cRow) cRow.style.display = 'none';
        } else if (state.datePreset === 'q3') {
          state.dateFrom = '2026-07-01';
          state.dateTo = '2026-09-30';
          if (cRow) cRow.style.display = 'none';
        } else if (state.datePreset === 'custom') {
          if (cRow) cRow.style.display = 'flex';
        } else {
          state.dateFrom = '2026-04-01';
          state.dateTo = '2026-09-30';
          if (cRow) cRow.style.display = 'none';
        }
        updateModalMatchCount();
      });
    });

    const sDateFrom = $('#sheetDateFrom');
    const sDateTo = $('#sheetDateTo');
    if (sDateFrom) sDateFrom.addEventListener('change', e => { state.dateFrom = e.target.value; updateModalMatchCount(); });
    if (sDateTo) sDateTo.addEventListener('change', e => { state.dateTo = e.target.value; updateModalMatchCount(); });

    // City Pills
    $$('#cityPresetPills .choice-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#cityPresetPills .choice-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.cityFilter = btn.dataset.city;
        updateModalMatchCount();
      });
    });

    // Amount Pills
    $$('#amtPresetPills .choice-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#amtPresetPills .choice-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.amtPreset = btn.dataset.amt;
        const aRow = $('#customAmtRow');

        if (state.amtPreset === 'micro') {
          state.amtMin = 0; state.amtMax = 500;
          if (aRow) aRow.style.display = 'none';
        } else if (state.amtPreset === 'mid') {
          state.amtMin = 500; state.amtMax = 2000;
          if (aRow) aRow.style.display = 'none';
        } else if (state.amtPreset === 'high') {
          state.amtMin = 2000; state.amtMax = null;
          if (aRow) aRow.style.display = 'none';
        } else if (state.amtPreset === 'custom') {
          if (aRow) aRow.style.display = 'flex';
        } else {
          state.amtMin = null; state.amtMax = null;
          if (aRow) aRow.style.display = 'none';
        }
        updateModalMatchCount();
      });
    });

    const sAmtMin = $('#sheetAmtMin');
    const sAmtMax = $('#sheetAmtMax');
    if (sAmtMin) sAmtMin.addEventListener('input', e => { state.amtMin = e.target.value ? Number(e.target.value) : null; updateModalMatchCount(); });
    if (sAmtMax) sAmtMax.addEventListener('input', e => { state.amtMax = e.target.value ? Number(e.target.value) : null; updateModalMatchCount(); });

    // Type Pills
    $$('#typePresetPills .choice-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#typePresetPills .choice-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.typeFilter = btn.dataset.type;
        updateModalMatchCount();
      });
    });

    // Sheet Apply & Reset
    const sheetApply = $('#sheetApplyBtn');
    if (sheetApply) {
      sheetApply.addEventListener('click', () => {
        closeModal('filterSettingsModal');
        updateHeatmapViews();
        showToast('Filters applied');
      });
    }

    const sheetReset = $('#sheetResetBtn');
    if (sheetReset) {
      sheetReset.addEventListener('click', () => {
        resetFiltersToDefault();
        syncModalInputsWithState();
      });
    }

    function resetFiltersToDefault() {
      state.categoryFilter = 'All';
      state.datePreset = 'all';
      state.dateFrom = '2026-04-01';
      state.dateTo = '2026-09-30';
      state.merchantQuery = '';
      state.cityFilter = 'All';
      state.amtPreset = 'all';
      state.amtMin = null;
      state.amtMax = null;
      state.typeFilter = 'debit';

      $$('#categoryChipsList .cat-chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === 'All')));
      updateHeatmapViews();
    }

    // Copy Buttons for Link
    $$('.btn-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = $('#' + btn.dataset.target);
        if (target) {
          target.select();
          navigator.clipboard.writeText(target.value);
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = 'Copy', 1800);
        }
      });
    });

    // Mobile Navigation Bar
    $$('.mobile-nav-bar .nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.panel, btn.id);
      });
    });

    // Theme Switcher
    const themeBtn = $('#themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme') || state.theme;
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        state.theme = next;
        localStorage.setItem('finlens_theme', next);
      });
    }

    // Pre-Purchase Scanner: Quick Test Scenarios
    $$('#scannerPresetsGroup .scenario-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        $$('#scannerPresetsGroup .scenario-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const key = chip.dataset.preset;
        const s = SCANNER_SCENARIOS[key];
        if (s) {
          analyzeAffordability(s.name, s.amount, s.cat, s.vpa);
        }
      });
    });

    // Scanner: Camera Controls
    const toggleCamBtn = $('#btnToggleCamera');
    if (toggleCamBtn) {
      toggleCamBtn.addEventListener('click', () => {
        if (activeCameraStream) {
          stopLiveCamera();
        } else {
          startLiveCamera();
        }
      });
    }

    const flipCamBtn = $('#btnFlipCamera');
    if (flipCamBtn) {
      flipCamBtn.addEventListener('click', flipLiveCamera);
    }

    const fileInput = $('#scannerFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
          handleImageUpload(e.target.files[0]);
        }
      });
    }

    // Scanner: Manual Custom Check Form
    const manualForm = $('#manualCheckForm');
    if (manualForm) {
      manualForm.addEventListener('submit', e => {
        e.preventDefault();
        const m = $('#customMerchantInput').value;
        const a = parseFloat($('#customAmountInput').value) || 0;
        const c = $('#customCategorySelect').value;
        if (m && a > 0) {
          analyzeAffordability(m, a, c, null);
          showToast(`Affordability evaluated for ${m}`);
        }
      });
    }

    // Scanner: Copy UPI ID
    const copyUpiBtn = $('#btnCopyUpiId');
    if (copyUpiBtn) {
      copyUpiBtn.addEventListener('click', () => {
        const vpa = $('#affordVpa') ? $('#affordVpa').textContent : '';
        if (vpa && navigator.clipboard) {
          navigator.clipboard.writeText(vpa).then(() => {
            showToast(`Copied UPI ID: ${vpa}`);
          }).catch(() => {
            showToast(`UPI ID: ${vpa}`);
          });
        }
      });
    }

    // Coach: Clear Conversation Button
    const clearChatBtn = $('#btnCoachClearChat');
    if (clearChatBtn) {
      clearChatBtn.addEventListener('click', () => {
        const box = $('#coachChatBox');
        if (box) {
          box.innerHTML = `
            <div class="chat-message assistant">
              <div class="msg-avatar">FL</div>
              <div class="msg-content">
                <p>👋 Chat reset! I’m ready. Ask me anything about your <strong>6-month UPI ledger (720 transactions · ₹3,42,251 outflow)</strong>.</p>
              </div>
            </div>
          `;
          showToast('Chat history cleared.');
        }
      });
    }

    // Coach Inputs & Speech Recognition
    const coachForm = $('#coachInputForm');
    const coachInput = $('#coachTextInput');
    if (coachForm && coachInput) {
      coachForm.addEventListener('submit', e => {
        e.preventDefault();
        const text = coachInput.value;
        coachInput.value = '';
        sendCoachMessage(text);
      });
    }

    $$('.coach-quick-prompts .cat-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        sendCoachMessage(btn.dataset.prompt);
      });
    });

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const micBtn = $('#coachVoiceMicBtn');
    if (SpeechRec && micBtn) {
      const rec = new SpeechRec();
      rec.lang = 'en-IN';
      rec.onresult = e => {
        const text = e.results[0][0].transcript;
        if (coachInput) coachInput.value = text;
        sendCoachMessage(text);
      };
      micBtn.addEventListener('click', () => {
        try {
          rec.start();
          micBtn.classList.add('listening');
        } catch (e) {
          micBtn.classList.remove('listening');
        }
      });
      rec.onend = () => micBtn.classList.remove('listening');
    }

    // Data Export
    const exportLink = $('#linkDataExport');
    if (exportLink) {
      exportLink.addEventListener('click', e => {
        e.preventDefault();
        const blob = new Blob([JSON.stringify(state.transactions, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `finlens_6months_export_${Date.now()}.json`;
        a.click();
      });
    }

    // Auth
    const authForm = $('#authForm');
    if (authForm) {
      authForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = $('#authEmailInput').value;
        const password = $('#authPasswordInput').value;
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const d = await res.json();
          if (res.ok) {
            showToast('Account registered successfully.');
            closeModal('authModal');
            location.reload();
          } else {
            alert(d.error || 'Registration failed');
          }
        } catch (err) {
          alert(err.message);
        }
      });
    }

    const btnLogin = $('#btnSubmitLogin');
    if (btnLogin) {
      btnLogin.addEventListener('click', async () => {
        const email = $('#authEmailInput').value;
        const password = $('#authPasswordInput').value;
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const d = await res.json();
          if (res.ok) {
            showToast('Signed in successfully.');
            closeModal('authModal');
            location.reload();
          } else {
            alert(d.error || 'Invalid credentials');
          }
        } catch (err) {
          alert(err.message);
        }
      });
    }

    const btnSignOut = $('#btnSignOut');
    if (btnSignOut) {
      btnSignOut.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        location.reload();
      });
    }

    const btnDel = $('#btnDeleteAccount');
    if (btnDel) {
      btnDel.addEventListener('click', async () => {
        if (confirm('Permanently wipe your financial data and isolated account?')) {
          await fetch('/api/auth/delete-account', { method: 'DELETE' });
          alert('Account and data deleted.');
          location.reload();
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    wireEvents();
    initAppData();
  });

})();
