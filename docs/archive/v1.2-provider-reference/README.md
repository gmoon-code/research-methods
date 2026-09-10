# Optional Secure AI Backend

GitHub Pages can host the student interface, but a real model call needs a server-side component.

## Required architecture

Browser (GitHub Pages)
→ HTTPS POST `/api/coach`
→ server-side provider adapter
→ model
→ JSON-schema validation
→ browser

## Do not

- place a provider API key in `assets/*.js`
- ask students to paste a personal provider key into a public/shared school computer
- return raw model output without schema validation
- allow the model to invent source citations

## Provider-agnostic interface

The reference handler expects one function:

`callModel({system, input, schema})`

Implement that function on the server for the model/provider you choose.

## Source retrieval

If source-grounded claims are enabled, retrieval should happen server-side or through an approved school service. The model should receive the retrieved source records and should cite only those records.
