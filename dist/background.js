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

  // src/settings.ts
  var MIN_THRESHOLD = 0.2;
  var DEFAULT_THRESHOLD = 0.5;
  var DEFAULT_API_BASE_URL = "https://classify.stylometry.net";
  function defaultThresholds() {
    return Object.fromEntries(RULES.map((rule) => [rule.id, DEFAULT_THRESHOLD]));
  }
  async function loadSettings() {
    const stored = (await chrome.storage.sync.get("settings"))["settings"];
    return {
      apiBaseUrl: stored?.apiBaseUrl ?? DEFAULT_API_BASE_URL,
      // Merge over the defaults so rules added after settings were last saved
      // still get a threshold.
      thresholds: { ...defaultThresholds(), ...stored?.thresholds }
    };
  }

  // src/background.ts
  async function fetchViolations(itemId) {
    const settings = await loadSettings();
    const base = settings.apiBaseUrl.endsWith("/") ? settings.apiBaseUrl : `${settings.apiBaseUrl}/`;
    const url = new URL(`violations/${itemId}`, base);
    url.searchParams.set("threshold", String(MIN_THRESHOLD));
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }
    const body = await response.json();
    return body.violations;
  }
  chrome.runtime.onMessage.addListener(
    (message, _sender, sendResponse) => {
      if (message.type !== "fetch-violations") {
        return false;
      }
      fetchViolations(message.itemId).then((violations) => sendResponse({ ok: true, violations })).catch(
        (error) => sendResponse({ ok: false, error: String(error) })
      );
      return true;
    }
  );
})();
