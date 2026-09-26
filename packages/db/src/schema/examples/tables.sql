-- PostgreSQL shape of @dimah-survey/db schema v1.
-- response.definition is insert-only: it is the published survey copied at start.

create table survey (
  id varchar(255) primary key,
  slug varchar(255) not null,
  status text not null,
  draft_json jsonb not null,
  published_json jsonb,
  published_at timestamptz,
  settings jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint survey_slug_unique unique (slug),
  constraint survey_status_check check (status in ('draft', 'active', 'archived'))
);

create table response (
  id varchar(255) primary key,
  survey_id varchar(255) not null,
  respondent_id varchar(255),
  status text not null,
  definition jsonb not null,
  data jsonb not null,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint response_survey_fk
    foreign key (survey_id) references survey (id)
    on update restrict on delete restrict,
  constraint response_status_check check (status in ('draft', 'submitted', 'abandoned'))
);

comment on column response.definition is
  'Copy of survey.published_json at start. Do not update after insert.';

comment on column survey.settings is
  'Collection rules. Not copied into response.definition.';
