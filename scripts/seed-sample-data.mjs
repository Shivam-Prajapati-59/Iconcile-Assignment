/**
 * Seeds the Expense Manager backend with ~100 realistic sample expenses
 * (spread over the last three months) plus a set of vendor categorization
 * rules, by posting to the running REST API.
 *
 * Usage: node scripts/seed-sample-data.mjs [API_BASE]
 *   API_BASE defaults to http://localhost:8080
 */
const API_BASE = process.argv[2] ?? "http://localhost:8080";

function seedRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const rules = [
  ["swiggy", "Food"],
  ["zomato", "Food"],
  ["starbucks", "Food"],
  ["bigbasket", "Groceries"],
  ["dmart", "Groceries"],
  ["amazon", "Shopping"],
  ["flipkart", "Shopping"],
  ["reliance digital", "Shopping"],
  ["uber", "Transport"],
  ["ola", "Transport"],
  ["irctc", "Travel"],
  ["apollo pharmacy", "Health"],
  ["netflix", "Entertainment"],
  ["bookmyshow", "Entertainment"],
  ["jio", "Utilities"],
  ["acme corp", "Salary"],
];

const EXPENSES = [
  { vendor: "Swiggy", amount: [180, 260, 340], desc: "Food delivery" },
  { vendor: "Zomato", amount: [220, 290], desc: "Restaurant order" },
  { vendor: "Starbucks", amount: [240, 310, 380], desc: "Coffee" },
  { vendor: "BigBasket", amount: [950, 1200, 1600], desc: "Groceries" },
  { vendor: "DMart", amount: [700, 900], desc: "Weekly groceries" },
  { vendor: "Amazon", amount: [450, 650, 899], desc: "Online shopping" },
  { vendor: "Flipkart", amount: [520, 780], desc: "Online shopping" },
  { vendor: "Reliance Digital", amount: [3200, 4500], desc: "Electronics" },
  { vendor: "Uber", amount: [150, 220, 280], desc: "Cab ride" },
  { vendor: "Ola", amount: [130, 190], desc: "Cab ride" },
  { vendor: "IRCTC", amount: [1200, 1650], desc: "Train ticket" },
  { vendor: "Apollo Pharmacy", amount: [300, 450], desc: "Medicines" },
  { vendor: "Netflix", amount: [649], desc: "Subscription" },
  { vendor: "BookMyShow", amount: [400, 600], desc: "Movie tickets" },
  { vendor: "Jio", amount: [399, 599], desc: "Recharge" },
  { vendor: "Acme Corp", amount: [85000, 85000], desc: "Salary credit", type: "INCOME" },
];

const OUTLIERS = [
  { vendor: "Swiggy", amount: 12500, desc: "Bulk catering order" },
  { vendor: "Amazon", amount: 24000, desc: "Electronics purchase" },
  { vendor: "Uber", amount: 4800, desc: "Outstation cab" },
];

const MONTHS = ["2026-06", "2026-07", "2026-08"];

function makeExpense(rnd, month, vendor, amount, desc, type) {
  const day = 1 + Math.floor(rnd() * 28);
  return {
    occurredAt: `${month}-${String(day).padStart(2, "0")}T12:00:00`,
    amount,
    currency: "INR",
    transactionType: type ?? "EXPENSE",
    accountName: type === "INCOME" ? "HDFC Bank" : "HDFC Bank",
    vendorName: vendor,
    description: desc,
  };
}

async function request(path, init) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      message = body?.message ?? message;
    } catch {}
    throw new Error(`${path}: ${message}`);
  }
  return res.status === 204 ? null : res.json();
}

async function main() {
  console.log(`Seeding against ${API_BASE}`);

  const existingRules = await request("/api/vendor-rules");
  const existingVendors = new Set(existingRules.map((r) => r.normalizedVendorName.toLowerCase()));
  let created = 0;
  for (const [vendor, category] of rules) {
    if (existingVendors.has(vendor.toLowerCase())) continue;
    try {
      await request("/api/vendor-rules", {
        method: "POST",
        body: JSON.stringify({ vendorName: vendor, category }),
      });
      created++;
    } catch (err) {
      console.warn(`rule ${vendor} skipped: ${err.message}`);
    }
  }
  console.log(`Rules ensured: ${created}`);

  const rnd = seedRandom(42);
  let expenses = 0;
  for (const month of MONTHS) {
    const monthExpenses = [];
    for (const spec of EXPENSES) {
      const pick = spec.amount[Math.floor(rnd() * spec.amount.length)];
      monthExpenses.push(makeExpense(rnd, month, spec.vendor, pick, spec.desc, spec.type));
      if (month !== "2026-08") {
        monthExpenses.push(
          makeExpense(rnd, month, spec.vendor, spec.amount[Math.floor(rnd() * spec.amount.length)], spec.desc, spec.type),
        );
      }
    }
    for (const out of OUTLIERS) {
      if (month === "2026-08") {
        monthExpenses.push(makeExpense(rnd, month, out.vendor, out.amount, out.desc));
      }
    }
    for (const e of monthExpenses) {
      await request("/api/expenses", { method: "POST", body: JSON.stringify(e) });
      expenses++;
    }
  }
  console.log(`Expenses created: ${expenses}`);

  const summary = await request("/api/dashboard/summary?month=2026-08");
  console.log("August summary:", JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
