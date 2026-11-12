# Catalogue data and attribution

The code is licensed separately under AGPL-3.0-or-later (LICENSE).

`src/lib/catalog/directory.json` combines public factual records from:

- Wikidata: https://www.wikidata.org/ (CC0). The directory uses production-company,
  distributor (film studios only) and original-broadcaster statements. Series
  episodes, seasons, boxing matches, news programmes, podcasts and radio dramas are excluded; records only classified as generic television
  programmes are also excluded. The snapshot has an explicit update date and is
  not represented as an exhaustive or real-time catalogue.
- TVmaze: https://www.tvmaze.com/api (CC BY-SA 4.0,
  https://creativecommons.org/licenses/by-sa/4.0/). Limited title and poster-image
  metadata is joined to the matching catalogue. TVmaze lookup is also used to fill
  missing TV posters, using an exact IMDb identifier match.
- Public film metadata from Douban: https://movie.douban.com/. Only factual
  film fields are retained. User profiles, comments and reviews are discarded.

The combined factual catalogue snapshot is made available under CC BY-SA 4.0,
with the above attribution and change notice. This does not grant rights to any
underlying posters, logos or video content. Posters remain remote images and are
not included as downloaded media in this repository or its installers.

Changes: metadata normalization, multilingual labels, filtering of record types,
joining identifiers and catalogue membership, deduplication, and local pagination.

Logo provenance is listed in public/brands/sources.json. No affiliation with any
listed film studio or streaming service is implied.
