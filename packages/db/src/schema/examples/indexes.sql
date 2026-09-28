-- Reference copy. Paste into the app. FumaDB generate does not emit these.

create index if not exists dimah_survey_status_updated_at_idx
  on dimah_survey (status, updated_at);

create index if not exists dimah_response_survey_id_updated_at_idx
  on dimah_response (survey_id, updated_at);

create index if not exists dimah_response_respondent_lookup_idx
  on dimah_response (survey_id, respondent_id, status);

-- One open draft per survey and identified respondent.
-- Anonymous rows (respondent_id is null) are not covered.
create unique index if not exists dimah_response_one_open_draft
  on dimah_response (survey_id, respondent_id)
  where status = 'draft' and respondent_id is not null;

create index if not exists dimah_survey_version_survey_id_created_at_idx
  on dimah_survey_version (survey_id, created_at);
