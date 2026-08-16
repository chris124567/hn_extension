"use strict";
(() => {
  // src/rules.ts
  var RULES = [
    {
      id: 1,
      name: "Be civil and address the argument",
      text: "Be civil and address the argument. Flag snark, personal swipes, hostile cross-examination, name-calling, fulmination, or sneering at a person, group, or the community. Disagreement itself is allowed, including forceful disagreement that focuses on the claim rather than the person."
    },
    {
      id: 2,
      name: "Make criticism substantive",
      text: "Make criticism substantive. Flag shallow dismissals and put-downs of someone's work that offer no useful reason or specific observation. Do not report this rule if the comment gives any specific reason, example, or counter-instance, however brief or harshly phrased: a good critical comment teaches the reader something, and blunt delivery does not cancel that."
    },
    {
      id: 3,
      name: "Eschew flamebait",
      text: "Eschew flamebait. Flag an inflammatory framing or provocation that invites hostility instead of discussion. A relevant argument is not flamebait merely because the topic is contentious, and a comment that is merely lazy, stale, or canned is rule 10 rather than this one."
    },
    {
      id: 4,
      name: "No political or ideological battle",
      text: "Do not use Hacker News for political or ideological battle. Political subject matter, facts, analysis, firsthand experience, and technical explanation are allowed. Flag comments that campaign for a side, attack an opposing camp, or turn the thread into partisan or ideological combat."
    },
    {
      id: 5,
      name: "Don't question whether someone read the article",
      text: "Do not tell another commenter they did not read the linked article, or ask whether they did. State the relevant fact or passage instead. This rule is only about whether someone read the article or submission: a question to another commenter on any other subject\u2014their project, setup, tools, sources, or experience\u2014is not this rule, however blunt or brief. Comments that simply point out what the article says are also allowed."
    },
    {
      id: 6,
      name: "No manipulation insinuations",
      text: "Do not accuse discussion participants of astroturfing, shilling, brigading, acting as foreign agents, or similar coordinated manipulation. Claims about companies, lobby groups, governments, or politicians are allowed unless they accuse a discussion participant."
    },
    {
      id: 7,
      name: "Flag inappropriate submissions",
      text: "Do not complain that a submission is spam, off-topic, a duplicate, or otherwise inappropriate; use the flag mechanism instead. This rule also covers replies that merely scold an egregious comment and comments that announce a flag."
    },
    {
      id: 8,
      name: "No tangential annoyances",
      text: "Do not make a common tangential annoyance the substance of a comment\u2014for example, article or website formatting, name collisions, scroll behavior, or a broken back button. Criticism of the submitted work's actual subject is allowed."
    },
    {
      id: 9,
      name: "Don't discuss comment voting",
      text: "Do not discuss comment votes or scores, including asking why a comment was downvoted or alleging voting behavior. Respond to the substance of the discussion instead."
    },
    {
      id: 10,
      name: "Avoid generic tangents and internet tropes",
      text: "Avoid generic tangents and internet tropes. Flag a canned reaction that could be pasted into many unrelated threads: a stock rhetorical format, a well-worn aphorism or quotation standing in for an argument, a meme reply, or the claim that the site is turning into Reddit. A specific observation about this thread's subject is not a generic tangent, however short."
    }
  ];
  function ruleName(id) {
    const rule = RULES.find((r) => r.id === id);
    return rule === void 0 ? `Rule ${id}` : `Rule ${id} \u2014 ${rule.name}`;
  }

  // src/settings.ts
  var MIN_THRESHOLD = 0.2;
  var MAX_THRESHOLD = 1;
  var DEFAULT_THRESHOLD = 0.5;
  function scoreMeetsThreshold(score, threshold) {
    return threshold < MAX_THRESHOLD && score >= threshold;
  }
  function defaultThresholds() {
    return Object.fromEntries(RULES.map((rule) => [rule.id, DEFAULT_THRESHOLD]));
  }
  function isRecord(value) {
    return typeof value === "object" && value !== null;
  }
  function normalizeSettings(value) {
    const stored = isRecord(value) ? value : void 0;
    const storedThresholds = isRecord(stored?.["thresholds"]) ? stored["thresholds"] : void 0;
    const thresholds = defaultThresholds();
    for (const rule of RULES) {
      const threshold = storedThresholds?.[String(rule.id)];
      if (typeof threshold === "number" && Number.isFinite(threshold) && threshold >= MIN_THRESHOLD && threshold <= MAX_THRESHOLD) {
        thresholds[rule.id] = threshold;
      }
    }
    const storedEnabled = stored?.["enabled"];
    return {
      // Work immediately after installation. Preserve a valid stored preference;
      // corrupt values fail closed instead of silently re-enabling a prior opt-out.
      enabled: storedEnabled === void 0 ? true : storedEnabled === true,
      thresholds
    };
  }
  async function loadSettings() {
    const stored = await chrome.storage.local.get("settings");
    return normalizeSettings(stored["settings"]);
  }

  // src/content.ts
  async function fetchViolations(itemId) {
    const request = { type: "fetch-violations", itemId };
    const result = await chrome.runtime.sendMessage(
      request
    );
    if (!result.ok) {
      throw new Error(result.error);
    }
    return result.violations;
  }
  function exceededRules(violation, settings) {
    return violation.rules.filter((rule) => {
      const threshold = settings.thresholds[rule.rule] ?? MAX_THRESHOLD;
      return scoreMeetsThreshold(rule.score, threshold);
    });
  }
  function describeRules(rules) {
    return rules.map((r) => `${ruleName(r.rule)}: ${r.score.toFixed(2)}`).join("\n");
  }
  function indentOf(row) {
    return Number(row.querySelector("td.ind")?.getAttribute("indent"));
  }
  function nextCommentRow(row) {
    for (let el = row.nextElementSibling; el !== null; el = el.nextElementSibling) {
      if (el.classList.contains("comtr")) {
        return el;
      }
    }
    return null;
  }
  function collapseComment(violation, exceeded) {
    const row = document.querySelector(`tr.comtr[id="${violation.id}"]`);
    const toggle = row?.querySelector("a.togg");
    if (row == null || toggle == null) {
      return;
    }
    toggle.title = `Guideline violations:
${describeRules(exceeded)}`;
    if (row.classList.contains("coll")) {
      return;
    }
    toggle.style.fontWeight = "bold";
    row.classList.add("coll");
    row.querySelector(".votelinks")?.classList.add("nosee");
    row.querySelector(".comment")?.classList.add("noshow");
    toggle.textContent = `[${toggle.getAttribute("n") ?? 1} more]`;
    const indent = indentOf(row);
    for (let next = nextCommentRow(row); next !== null && indentOf(next) > indent; next = nextCommentRow(next)) {
      next.classList.add("noshow");
    }
  }
  async function main() {
    const rawItemId = new URLSearchParams(window.location.search).get("id");
    if (rawItemId === null || !/^[1-9]\d*$/.test(rawItemId)) {
      return;
    }
    const itemId = Number(rawItemId);
    if (!Number.isSafeInteger(itemId)) {
      return;
    }
    const settings = await loadSettings();
    if (!settings.enabled) {
      return;
    }
    const violations = await fetchViolations(itemId);
    for (const violation of violations) {
      const exceeded = exceededRules(violation, settings);
      if (exceeded.length > 0) {
        collapseComment(violation, exceeded);
      }
    }
  }
  main().catch((error) => {
    console.warn("HN Guideline Collapser:", error);
  });
})();
