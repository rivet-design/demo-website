# Add a campaign ref

A campaign ref is a short name you put on a link you hand out. A newsletter or
an event can use one. PostHog then attributes the visit, and the later events
in that browser tab, to the campaign you defined.

`CAMPAIGN_REFS` in `src/lib/campaignRefs.ts` is the only list of refs.

## Add the ref to the table

Add one entry to `CAMPAIGN_REFS`.

```ts
// EXAMPLE ONLY. example-newsletter is not a real campaign.
'example-newsletter': {
  source: 'example-source',
  medium: 'email',
  campaign: 'example-campaign',
},
```

The key is the slug that goes in the link.

- Use lowercase letters, digits, and single hyphens.
- Keep the slug to 64 characters or fewer.
- Do not start or end with a hyphen, and do not repeat a hyphen.
- Do not use underscores. An install ref is `r_` plus eight characters, and a
  slug must not match that shape.

`source` and `campaign` each start with a letter or a digit. The rest may use
lowercase letters, digits, `.`, `_`, and `-`. Each value is at most 64
characters.

`medium` is one of `email`, `social`, `referral`, or `event`.

`npm test` rejects an entry that breaks these rules.

Do not put a person's name or an email address in a slug, a source, a medium,
or a campaign.

A new ref is on the site only after a deploy. A link that needs to go out
before then can carry `utm_source`, `utm_medium`, and `utm_campaign` itself.
PostHog attributes it the same way.

## Put the slug on a link

Add `?ref=` and the slug to any rivet.design page.

These two URLs are examples. They are not live campaigns.

```text
https://rivet.design/?ref=example-newsletter
https://rivet.design/download?ref=example-newsletter
```

The visitor's address bar changes before analytics run. `ref` is removed.
`utm_source`, `utm_medium`, `utm_campaign`, and `utm_content` are added.
`utm_content` is the slug. Other query parameters and the hash stay.

For the home page example above, the address bar becomes this example.

```text
https://rivet.design/?utm_source=example-source&utm_medium=email&utm_campaign=example-campaign&utm_content=example-newsletter
```

## Read the visit in PostHog

The site writes standard UTM parameters. PostHog records them with its usual
rules.

Every event in that browser tab carries the UTM values, including events after
the visitor opens another page on the site. A later link with different UTM
values replaces them in that tab. That is last touch for the tab.

The person stores the first values as `$initial_utm_source`,
`$initial_utm_medium`, `$initial_utm_campaign`, and `$initial_utm_content`.
That is first touch for the person. PostHog sends these with the visitor's
first person update, such as a download click, even when that happens on a
later page.

A return visit in a new tab or window carries no UTM values on its events.
PostHog counts that visit as Direct. The person keeps the first-touch values.

When a link already has a `utm_` parameter, the ref is not expanded. The link's
own UTM values win, and `ref` stays on the URL.

An unknown slug does nothing. The URL stays the same, and no UTM values are
added.

On `/auth-success`, `?ref=` is the install ref. That parameter stays on the
URL.

Filter or break down `$pageview`, `download_clicked`, `download_handoff`, and
`editor_sign_in_completed` by `utm_content` or `utm_campaign`.

On the person, read `$initial_utm_content`.

When `medium` is `email`, the visit lands in PostHog's Email channel. The
other mediums may land in other channels.
