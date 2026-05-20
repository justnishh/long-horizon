---
id: "{TYPE}-{YYYYMMDD}-{SHORT_HASH}"
type: "{decision|lesson|pattern|task|milestone|context}"
created: "{YYYY-MM-DDTHH:mm:ss}"
updated: "{YYYY-MM-DDTHH:mm:ss}"
status: "{active|archived|superseded}"
edges:
  - target: "{node-id}"
    relation: "{caused_by|leads_to|related|supersedes|blocks|implements|learned_from}"
  - target: "{node-id}"
    relation: "{relation}"
tags: ["{tag1}", "{tag2}"]
weight: {0.0-1.0}
---

# {Title}

## Content

{The actual knowledge content}

## Context

{Why this node exists, what triggered its creation}

## Backlinks

<!-- Auto-populated: nodes that link TO this node -->
- [{source-node-id}] → {relation}
