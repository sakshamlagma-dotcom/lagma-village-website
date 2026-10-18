import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../notice-board.js", import.meta.url), "utf8");
const sandbox = { URL, URLSearchParams, Date, Map, Object, Array, String, document: { readyState: "loading", addEventListener() {} }, location: { href: "https://lagma.online/notification.html", origin: "https://lagma.online", search: "", pathname: "/notification.html", hash: "" } };
vm.runInNewContext(source, { window: sandbox, globalThis: sandbox, document: sandbox.document, URL, URLSearchParams, Date, Map, Object, Array, String });
const tools = sandbox.LagmaNoticeTools;

test("notice URLs allow web URLs and safe same-site relative paths only", () => {
  assert.equal(tools.safeUrl("https://example.org/notice.pdf"), "https://example.org/notice.pdf");
  assert.equal(tools.safeUrl("/files/notice.pdf"), "/files/notice.pdf");
  assert.equal(tools.safeUrl("javascript:alert(1)"), "");
  assert.equal(tools.safeUrl("data:text/html,unsafe"), "");
});

test("notice status uses validated dates and deliberate archives", () => {
  const today = "2026-10-18";
  assert.equal(tools.stateOf(tools.normalize({ startDate: "2026-10-19" }), today), "upcoming");
  assert.equal(tools.stateOf(tools.normalize({ expiryDate: "2026-10-17" }), today), "expired");
  assert.equal(tools.stateOf(tools.normalize({ status: "archived" }), today), "archived");
  assert.equal(tools.stateOf(tools.normalize({ publishDate: "not-a-date" }), today), "undated");
});

test("search, category, status, and date range filters combine", () => {
  const item = tools.normalize({ id: "x", title: "Road meeting", summary: "Drainage plan", category: "panchayat", publishDate: "2026-05-10", startDate: "2026-05-01" });
  assert.equal(tools.matches(item, { query: " DRAINAGE ", category: "panchayat", status: "active", from: "2026-05-01", to: "2026-05-31" }, "2026-05-20"), true);
  assert.equal(tools.matches(item, { query: "school", category: "panchayat", status: "all", from: "", to: "" }, "2026-05-20"), false);
  assert.equal(tools.matches(item, { query: "road", category: "education", status: "all", from: "", to: "" }, "2026-05-20"), false);
});

test("sort options order dated notices and static entries preserve existing text", async () => {
  const newer = tools.normalize({ id: "b", title: "B", publishDate: "2026-06-01" });
  const older = tools.normalize({ id: "a", title: "A", publishDate: "2026-05-01" });
  assert.equal(Array.from(tools.sortItems([older, newer], "newest").map((item) => item.id)).join(","), "b,a");
  const data = await readFile(new URL("../notice-data.js", import.meta.url), "utf8");
  assert.match(data, /Residents can use this website to learn about village history, services, gallery updates, and contact information\./);
  assert.match(data, /Discussion planned around roads, drainage, education, and village cleanliness\./);
  assert.match(data, /Community cleaning and decoration activities were completed with local participation\./);
});
