const key = "returns-rma-automation";
const meta = { id: key, name: "Returns", description: "A log of return requests checked against real Shopify orders." };
async function run() {
  return { ok: true, tool: key, message: "Open the Returns page to log and track return requests." };
}
module.exports = { key, run, meta };