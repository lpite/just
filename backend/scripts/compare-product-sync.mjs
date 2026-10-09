import fs from "node:fs";
import path from "node:path";

const USAGE = `
Compare two product sync JSON files.

Usage:
  node scripts/compare-product-sync.mjs [options]

Options:
  -a, --file-a <path>   First file  (default: test-data/product-sync.json)
  -b, --file-b <path>   Second file (default: test-data/product-sync2.json)
  -k, --key <field>     Field used to match products (default: searchCode)
  -o, --out <path>      Write full JSON report to this file
      --json            Print the full JSON report to stdout instead of a table
  -l, --limit <n>       Max rows per section in console output, 0 = all (default: 50)
      --nulls <mode>    How to treat null values: "zero" (default, null = 0) | "ignore" (skip) | "diff"
  -h, --help            Show this help
`;

function parseArgs(argv) {
  const opts = {
    fileA: "test-data/product-sync.json",
    fileB: "test-data/product-sync2.json",
    key: "searchCode",
    out: null,
    json: false,
    nulls: "zero",
    limit: 50,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const value = argv[++i];
      if (value === undefined) {
        console.error(`Missing value for ${arg}`);
        process.exit(1);
      }
      return value;
    };

    switch (arg) {
      case "-a":
      case "--file-a":
        opts.fileA = next();
        break;
      case "-b":
      case "--file-b":
        opts.fileB = next();
        break;
      case "-k":
      case "--key":
        opts.key = next();
        break;
      case "-o":
      case "--out":
        opts.out = next();
        break;
      case "--json":
        opts.json = true;
        break;
      case "--nulls":
        opts.nulls = next();
        break;
      case "-l":
      case "--limit":
        opts.limit = Number(next());
        break;
      case "-h":
      case "--help":
        console.log(USAGE);
        process.exit(0);
      default:
        console.error(`Unknown option: ${arg}`);
        console.log(USAGE);
        process.exit(1);
    }
  }

  if (!["zero", "ignore", "diff"].includes(opts.nulls)) {
    console.error(`--nulls must be one of: zero, ignore, diff`);
    process.exit(1);
  }

  return opts;
}

function loadJson(filePath) {
  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    console.error("File not found:", resolved);
    process.exit(1);
  }
  const raw = fs.readFileSync(resolved, "utf8").replace(/^\uFEFF/, "");
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error("expected a JSON array");
    return { data, resolved };
  } catch (err) {
    console.error(`Failed to parse ${resolved}:`, err.message);
    process.exit(1);
  }
}

function normalizeKey(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);
  return String(value).trim();
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(num) ? num : null;
}

function toComparableNumber(value) {
  const num = toNumber(value);
  return num === null ? 0 : num;
}

function sameNumber(a, b) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return Math.abs(a - b) < 1e-9;
}

function indexBy(products, key) {
  const map = new Map();
  for (const product of products) {
    const id = normalizeKey(product?.[key]);
    if (map.has(id)) {
      map.get(id).duplicates.push(product);
      continue;
    }
    map.set(id, { product, duplicates: [] });
  }
  return map;
}

function describe(product, key) {
  if (!product) return { key: null, name: null, code: null };
  return {
    key: normalizeKey(product?.[key]),
    name: product.name ?? null,
    code: product.code ?? null,
  };
}

function buildReport(opts) {
  const left = loadJson(opts.fileA);
  const right = loadJson(opts.fileB);
  const aName = path.basename(left.resolved);
  const bName = path.basename(right.resolved);

  const mapA = indexBy(left.data, opts.key);
  const mapB = indexBy(right.data, opts.key);

  const onlyInA = [];
  const onlyInB = [];
  const priceDiff = [];
  const quantityDiff = [];
  const bothDiff = [];
  const inBoth = [];

  const nullMode = opts.nulls;
  const treatNullAsZero = nullMode === "zero";

  const resolve = (rawValue, fileName) => {
    if (rawValue === null) {
      return { value: treatNullAsZero ? 0 : null, nullIn: fileName };
    }
    return { value: rawValue, nullIn: null };
  };

  const fieldDiffers = (a, b) => {
    if (nullMode === "ignore" && (a.value === null || b.value === null)) return false;
    return !sameNumber(a.value, b.value);
  };

  for (const [id, entry] of mapA) {
    if (!mapB.has(id)) {
      onlyInA.push(describe(entry.product, opts.key));
      continue;
    }

    const other = mapB.get(id);
    const a = entry.product;
    const b = other.product;
    const priceA = resolve(toNumber(a.price), aName);
    const priceB = resolve(toNumber(b.price), bName);
    const quantityA = resolve(toNumber(a.quantity), aName);
    const quantityB = resolve(toNumber(b.quantity), bName);

    const priceChanged = fieldDiffers(priceA, priceB);
    const quantityChanged = fieldDiffers(quantityA, quantityB);

    const base = {
      ...describe(a, opts.key),
      name: a.name ?? b.name ?? null,
      code: a.code ?? b.code ?? null,
    };

    if (!priceChanged && !quantityChanged) {
      inBoth.push(base);
      continue;
    }

    const record = {
      ...base,
      [aName]: { price: priceA.value, quantity: quantityA.value },
      [bName]: { price: priceB.value, quantity: quantityB.value },
      fields: [],
    };
    if (priceChanged) record.fields.push("price");
    if (quantityChanged) record.fields.push("quantity");

    if (priceChanged) {
      priceDiff.push({
        ...base,
        from: priceA.value,
        to: priceB.value,
        delta: Number((priceB.value - priceA.value).toFixed(6)),
        nullIn: [priceA.nullIn, priceB.nullIn].filter(Boolean),
      });
    }
    if (quantityChanged) {
      quantityDiff.push({
        ...base,
        from: quantityA.value,
        to: quantityB.value,
        delta: Number((quantityB.value - quantityA.value).toFixed(6)),
        nullIn: [quantityA.nullIn, quantityB.nullIn].filter(Boolean),
      });
    }
    if (priceChanged && quantityChanged) bothDiff.push(record);
  }

  for (const [id, entry] of mapB) {
    if (!mapA.has(id)) onlyInB.push(describe(entry.product, opts.key));
  }

  onlyInA.sort((x, y) => String(x.key).localeCompare(String(y.key), undefined, { numeric: true }));
  onlyInB.sort((x, y) => String(x.key).localeCompare(String(y.key), undefined, { numeric: true }));

  const duplicatesA = [...mapA.entries()]
    .filter(([, v]) => v.duplicates.length)
    .map(([id, v]) => ({ key: id, count: v.duplicates.length }));
  const duplicatesB = [...mapB.entries()]
    .filter(([, v]) => v.duplicates.length)
    .map(([id, v]) => ({ key: id, count: v.duplicates.length }));

  return {
    files: { a: aName, b: bName, key: opts.key, nulls: nullMode },
    summary: {
      totalA: left.data.length,
      totalB: right.data.length,
      inBoth: inBoth.length,
      onlyInA: onlyInA.length,
      onlyInB: onlyInB.length,
      priceDiffs: priceDiff.length,
      quantityDiffs: quantityDiff.length,
      changedBoth: bothDiff.length,
      identical: inBoth.length,
      duplicatesA: duplicatesA.length,
      duplicatesB: duplicatesB.length,
    },
    onlyInA,
    onlyInB,
    priceDiff,
    quantityDiff,
    changedBoth: bothDiff,
    duplicatesA,
    duplicatesB,
  };
}

function fmt(value) {
  return value === null || value === undefined ? "null" : String(value);
}

function printTable(report, limit) {
  const { files, summary } = report;
  const show = (list) => {
    const slice = limit > 0 ? list.slice(0, limit) : list;
    if (slice.length === 0) console.log("    (none)");
    for (const item of slice) {
      const name = item.name ? ` ${item.name}` : "";
      const code = item.code ? ` [${item.code}]` : "";
      console.log(`    ${fmt(item.key)}${code}${name}`);
    }
    if (limit > 0 && list.length > slice.length) {
      console.log(`    ... and ${list.length - slice.length} more`);
    }
  };

  console.log(`\nComparing ${files.a} <-> ${files.b} by "${files.key}" (nulls: ${files.nulls})\n`);
  console.log("Summary");
  console.log(`  ${files.a}: ${summary.totalA} products`);
  console.log(`  ${files.b}: ${summary.totalB} products`);
  console.log(`  identical            : ${summary.identical}`);
  console.log(`  only in ${files.a.padEnd(18)}: ${summary.onlyInA}`);
  console.log(`  only in ${files.b.padEnd(18)}: ${summary.onlyInB}`);
  console.log(`  price differences    : ${summary.priceDiffs}`);
  console.log(`  quantity differences : ${summary.quantityDiffs}`);
  console.log(`  price+quantity diffs : ${summary.changedBoth}`);

  if (summary.duplicatesA || summary.duplicatesB) {
    console.log(`  duplicate keys       : ${summary.duplicatesA} in ${files.a}, ${summary.duplicatesB} in ${files.b}`);
  }

  console.log(`\nOnly in ${files.a} (${report.onlyInA.length})`);
  show(report.onlyInA);

  console.log(`\nOnly in ${files.b} (${report.onlyInB.length})`);
  show(report.onlyInB);

  console.log(`\nPrice differences (${report.priceDiff.length})`);
  for (const item of limit > 0 ? report.priceDiff.slice(0, limit) : report.priceDiff) {
    const name = item.name ? ` ${item.name}` : "";
    const missing = item.nullIn?.length ? ` [null in ${item.nullIn.join(", ")}]` : "";
    const delta = item.delta === null ? "" : ` (${item.delta > 0 ? "+" : ""}${item.delta})`;
    console.log(`    ${fmt(item.key)} ${fmt(item.from)} -> ${fmt(item.to)}${delta}${missing}${name}`);
  }
  if (limit > 0 && report.priceDiff.length > limit) {
    console.log(`    ... and ${report.priceDiff.length - limit} more`);
  }

  console.log(`\nQuantity differences (${report.quantityDiff.length})`);
  for (const item of limit > 0 ? report.quantityDiff.slice(0, limit) : report.quantityDiff) {
    const name = item.name ? ` ${item.name}` : "";
    const missing = item.nullIn?.length ? ` [null in ${item.nullIn.join(", ")}]` : "";
    const delta = item.delta === null ? "" : ` (${item.delta > 0 ? "+" : ""}${item.delta})`;
    console.log(`    ${fmt(item.key)} ${fmt(item.from)} -> ${fmt(item.to)}${delta}${missing}${name}`);
  }
  if (limit > 0 && report.quantityDiff.length > limit) {
    console.log(`    ... and ${report.quantityDiff.length - limit} more`);
  }
  console.log("");
}

const opts = parseArgs(process.argv.slice(2));
const report = buildReport(opts);

if (opts.out) {
  const outPath = path.resolve(process.cwd(), opts.out);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log("JSON report written to", outPath);
}

if (opts.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printTable(report, opts.limit);
}
