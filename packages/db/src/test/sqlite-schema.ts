/** SQLite shape of schema v1, including the partial index FumaDB does not emit. */
export const sqliteSchemaSql = `
create table dimah_survey (
  id text primary key not null,
  slug text not null,
  status text not null,
  draft_json blob not null,
  published_version_id text,
  published_at integer,
  settings blob not null,
  created_at integer not null,
  updated_at integer not null,
  constraint dimah_survey_status_check check (status in ('draft', 'active', 'archived'))
);
create unique index dimah_survey_slug_unique on dimah_survey (slug);
create index dimah_survey_status_updated_at_idx on dimah_survey (status, updated_at);
create table dimah_survey_version (
  id text primary key not null,
  survey_id text not null,
  definition blob not null,
  content_hash text not null,
  created_at integer not null,
  constraint dimah_survey_version_survey_fk foreign key (survey_id) references dimah_survey (id),
  constraint dimah_survey_version_survey_hash unique (survey_id, content_hash)
);
create index dimah_survey_version_survey_id_created_at_idx
  on dimah_survey_version (survey_id, created_at);
create table dimah_response (
  id text primary key not null,
  survey_id text not null,
  respondent_id text,
  status text not null,
  version_id text not null,
  data blob not null,
  submitted_at integer,
  created_at integer not null,
  updated_at integer not null,
  constraint dimah_response_survey_fk foreign key (survey_id) references dimah_survey (id),
  constraint dimah_response_version_fk foreign key (version_id) references dimah_survey_version (id),
  constraint dimah_response_status_check check (status in ('draft', 'submitted', 'abandoned'))
);
create index dimah_response_survey_id_updated_at_idx on dimah_response (survey_id, updated_at);
create index dimah_response_respondent_lookup_idx on dimah_response (survey_id, respondent_id, status);
create unique index dimah_response_one_open_draft on dimah_response (survey_id, respondent_id)
  where status = 'draft' and respondent_id is not null;
create table private_dimah_survey_settings (
  id text primary key not null,
  version text not null default '1.0.0'
);
`;
