-- Reference copy. Paste into the app. Do not treat this file as a runtime import.
-- PostgreSQL shape of @dimah-survey/db schema v1.
-- dimah_survey_version.definition is insert-only.
-- dimah_response.version_id is insert-only.
-- dimah_survey.published_version_id has no foreign key: a version also points
-- back at the survey. The store keeps the pointer on a version of that survey.

create table dimah_survey (
  id varchar(255) primary key,
  slug varchar(255) not null,
  status text not null,
  draft_json jsonb not null,
  published_version_id varchar(255),
  published_at timestamptz,
  settings jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dimah_survey_slug_unique unique (slug),
  constraint dimah_survey_status_check check (status in ('draft', 'active', 'archived'))
);

create table dimah_survey_version (
  id varchar(255) primary key,
  survey_id varchar(255) not null,
  definition jsonb not null,
  content_hash varchar(64) not null,
  created_at timestamptz not null default now(),
  constraint dimah_survey_version_survey_fk
    foreign key (survey_id) references dimah_survey (id)
    on update restrict on delete restrict,
  constraint dimah_survey_version_survey_hash
    unique (survey_id, content_hash)
);

create table dimah_response (
  id varchar(255) primary key,
  survey_id varchar(255) not null,
  respondent_id varchar(255),
  status text not null,
  version_id varchar(255) not null,
  data jsonb not null,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dimah_response_survey_fk
    foreign key (survey_id) references dimah_survey (id)
    on update restrict on delete restrict,
  constraint dimah_response_version_fk
    foreign key (version_id) references dimah_survey_version (id)
    on update restrict on delete restrict,
  constraint dimah_response_status_check check (status in ('draft', 'submitted', 'abandoned'))
);

comment on column dimah_survey.published_version_id is
  'Current published version. New responses store this id.';

comment on column dimah_survey_version.definition is
  'SurveyJS document frozen at publish. Do not update after insert.';

comment on column dimah_survey.settings is
  'Collection rules. Not copied onto dimah_survey_version.';

comment on column dimah_response.version_id is
  'Version this response started on. Do not update after insert.';
