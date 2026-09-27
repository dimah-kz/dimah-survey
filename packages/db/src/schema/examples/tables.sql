-- Reference copy. Paste into the app. Do not treat this file as a runtime import.
-- PostgreSQL shape of @dimah-survey/db schema v1.
-- dimah_response.definition is insert-only: it is the published survey copied at start.

create table dimah_survey (
  id varchar(255) primary key,
  slug varchar(255) not null,
  status text not null,
  draft_json jsonb not null,
  published_json jsonb,
  published_at timestamptz,
  settings jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dimah_survey_slug_unique unique (slug),
  constraint dimah_survey_status_check check (status in ('draft', 'active', 'archived'))
);

create table dimah_response (
  id varchar(255) primary key,
  survey_id varchar(255) not null,
  respondent_id varchar(255),
  status text not null,
  definition jsonb not null,
  data jsonb not null,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dimah_response_survey_fk
    foreign key (survey_id) references dimah_survey (id)
    on update restrict on delete restrict,
  constraint dimah_response_status_check check (status in ('draft', 'submitted', 'abandoned'))
);

comment on column dimah_response.definition is
  'Copy of dimah_survey.published_json at start. Do not update after insert.';

comment on column dimah_survey.settings is
  'Collection rules. Not copied into dimah_response.definition.';
