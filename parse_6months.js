const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfPath = 'C:\\Users\\madha\\.gemini\\antigravity\\brain\\76c23730-188f-43a3-bb35-c3460b19e76e\\.user_uploaded\\media_1792772104783_7e222033.pdf';

const AREA_MAP = {
  'kothrud': { area: 'Kothrud', city: 'Pune', lat: 18.5074, lng: 73.8077 },
  'karve': { area: 'Karve Road', city: 'Pune', lat: 18.5018, lng: 73.8182 },
  'deccan': { area: 'Deccan Gymkhana', city: 'Pune', lat: 18.5167, lng: 73.8417 },
  'kharadi': { area: 'Kharadi', city: 'Pune', lat: 18.5514, lng: 73.9348 },
  'bavdhan': { area: 'Bavdhan', city: 'Pune', lat: 18.5158, lng: 73.7707 },
  'aundh': { area: 'Aundh', city: 'Pune', lat: 18.5602, lng: 73.8031 },
  'baner': { area: 'Baner', city: 'Pune', lat: 18.5590, lng: 73.7868 },
  'noida': { area: 'Noida Sector 18', city: 'Delhi NCR', lat: 28.5708, lng: 77.3271 },
  'nehru place': { area: 'Nehru Place', city: 'Delhi NCR', lat: 28.5494, lng: 77.2536 },
  'lajpat nagar': { area: 'Lajpat Nagar', city: 'Delhi NCR', lat: 28.5677, lng: 77.2433 },
  'airport': { area: 'Indira Gandhi Airport', city: 'Delhi NCR', lat: 28.5562, lng: 77.1000 },
  'epicuria': { area: 'Nehru Place Epicuria', city: 'Delhi NCR', lat: 28.5510, lng: 77.2510 }
};

function categorize(merchant, desc) {
  const text = (merchant + ' ' + desc).toLowerCase();
  if (text.includes('instamart') || text.includes('zepto') || text.includes('blinkit') || text.includes('bigbasket') || text.includes('grocery') || text.includes('vegetables') || text.includes('fruits') || text.includes('market') || text.includes('super market') || text.includes('dmart') || text.includes('mini mar') || text.includes('milk distributor')) {
    return 'Groceries';
  }
  if (text.includes('swiggy') || text.includes('zomato') || text.includes('eatclub') || text.includes('bundl technologies')) {
    return 'Food Delivery';
  }
  if (text.includes('kfc') || text.includes('cafe') || text.includes('coffee') || text.includes('dhaba') || text.includes('restaurant') || text.includes('dosa') || text.includes('bhel') || text.includes('panipuri') || text.includes('grill') || text.includes('snacks') || text.includes('hotel') || text.includes('keventers') || text.includes('mithaas') || text.includes('tea stall') || text.includes('7th heaven') || text.includes('vadapav')) {
    return 'Dining/Café';
  }
  if (text.includes('cleartrip') || text.includes('rikshaw') || text.includes('uber') || text.includes('ola') || text.includes('travel') || text.includes('flight') || text.includes('metro') || text.includes('ncmc')) {
    return 'Travel';
  }
  if (text.includes('pharmacy') || text.includes('clinic') || text.includes('hospital') || text.includes('apollo') || text.includes('medical') || text.includes('diagnostic') || text.includes('mcaffeine') || text.includes('chemist')) {
    return 'Health';
  }
  if (text.includes('zudio') || text.includes('myntra') || text.includes('mmyra') || text.includes('tata cliq') || text.includes('amazon') || text.includes('flipkart') || text.includes('meesho') || text.includes('mr diy') || text.includes('savana')) {
    return 'Shopping';
  }
  if (text.includes('jio') || text.includes('mahavitaran') || text.includes('electricity') || text.includes('prepaid') || text.includes('postpaid') || text.includes('recharge')) {
    return 'Bills/Utilities';
  }
  if (text.includes('city pride') || text.includes('movie') || text.includes('cinema') || text.includes('game') || text.includes('play')) {
    return 'Fun';
  }
  if (text.includes('rent') || text.includes('chitre') || text.includes('charvad') || text.includes('sharda') || text.includes('bhavarlal')) {
    return 'Rent/Transfers';
  }
  return 'Transfers/Other';
}

function geocode(merchant, desc) {
  const text = (merchant + ' ' + desc).toLowerCase();
  for (const [key, loc] of Object.entries(AREA_MAP)) {
    if (text.includes(key)) return loc;
  }
  return { area: 'Kothrud', city: 'Pune', lat: 18.5074, lng: 73.8077 };
}

async function run() {
  const dataBuffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: dataBuffer });
  await parser.load();
  const textData = await parser.getText();
  const text = textData.text;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const txs = [];

  let i = 0;
  while (i < lines.length) {
    const dateMatch = lines[i].match(/^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec),\s+(\d{4})$/i);
    if (dateMatch && i + 1 < lines.length && lines[i + 1].match(/^\d{1,2}:\d{2}\s+(AM|PM)$/i)) {
      const day = parseInt(dateMatch[1], 10);
      const monthStr = dateMatch[2];
      const year = parseInt(dateMatch[3], 10);
      const timeStr = lines[i + 1];

      const monthMap = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };
      const month = monthMap[monthStr] || 4;

      let j = i + 2;
      let desc = '';
      let upi = '';
      let bank = '';
      let amt = 0;

      while (j < lines.length && j < i + 14) {
        const line = lines[j];
        if (line.match(/^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec),\s+(\d{4})$/i)) {
          break;
        }
        if (line.startsWith('Paid to ') || line.startsWith('Received from ') || line.startsWith('Self transfer to ')) {
          desc = line;
        } else if (line.startsWith('UPI Transaction ID:')) {
          upi = line.replace('UPI Transaction ID:', '').trim();
        } else if (line.startsWith('Paid by ') || line.startsWith('Paid to ')) {
          bank = line;
        } else if (line.startsWith('₹')) {
          const cleanAmt = line.replace(/[₹,\s]/g, '');
          if (!isNaN(cleanAmt) && cleanAmt.length > 0 && parseFloat(cleanAmt) > 0) {
            amt = parseFloat(cleanAmt);
          }
        }
        j++;
      }

      // Fallback: If amount line did not start with ₹, check lines for pure amount
      if (amt === 0) {
        for (let k = i + 2; k < j; k++) {
          const l = lines[k].trim();
          if (l.match(/^[\d,]+(\.\d{1,2})?$/) && l !== '6207980452' && l.length < 9) {
            const val = parseFloat(l.replace(/,/g, ''));
            if (val > 0 && val < 100000) {
              amt = val;
              break;
            }
          }
        }
      }

      if (desc && amt > 0 && amt !== 6207980452) {
        const isDebit = desc.startsWith('Paid to ') || desc.startsWith('Self transfer to ');
        const merchant = desc.replace(/^(Paid to|Received from|Self transfer to)\s+/i, '').trim();

        const [timePart, meridiem] = timeStr.split(' ');
        let [h, m] = timePart.split(':').map(Number);
        if (meridiem && meridiem.toUpperCase() === 'PM' && h < 12) h += 12;
        if (meridiem && meridiem.toUpperCase() === 'AM' && h === 12) h = 0;

        const ymd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(Date.UTC(year, month - 1, day, h, m));
        const dow = (dateObj.getUTCDay() + 6) % 7; // 0=Mon, 6=Sun
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        const loc = geocode(merchant, desc);
        const cat = categorize(merchant, desc);

        txs.push({
          id: txs.length + 1,
          date: dateObj.toISOString(),
          rawDate: `${String(day).padStart(2, '0')} ${monthStr}, ${year} ${timeStr}`,
          ymd,
          day,
          month,
          year,
          hour: h,
          minute: m,
          dow,
          dayName: dayNames[dow],
          type: isDebit ? 'debit' : 'credit',
          desc,
          merchant,
          cat,
          amt,
          upi,
          bank,
          city: loc.city,
          area: loc.area,
          lat: loc.lat,
          lng: loc.lng
        });
      }
      i = j - 1;
    }
    i++;
  }

  // Exact statement figures from page 1:
  // Sent: ₹3,42,250.98
  // Received: ₹3,16,415.00
  const result = {
    account: {
      name: "Madhabi Chowdhury",
      email: "madhabichowdhury215@gmail.com",
      phone: "6207980452",
      period: "01 April 2026 - 30 September 2026",
      totalSent: 342250.98,
      totalReceived: 316415.00,
      primaryCities: ["Pune", "Delhi NCR"]
    },
    transactions: txs
  };

  fs.writeFileSync('c:\\Users\\madha\\Downloads\\Fin\\public\\data\\madhabi_upi.json', JSON.stringify(result, null, 2));
  console.log(`Successfully parsed ${txs.length} transactions across 6 months!`);

  const demoPath = 'c:\\Users\\madha\\Downloads\\Fin\\data\\users\\demo-user-madhabi.json';
  if (fs.existsSync(demoPath)) {
    const demo = JSON.parse(fs.readFileSync(demoPath, 'utf8'));
    demo.transactions = txs;
    fs.writeFileSync(demoPath, JSON.stringify(demo, null, 2));
    console.log('Updated demo-user-madhabi.json with clean 6-month records');
  }
}

run().catch(console.error);
