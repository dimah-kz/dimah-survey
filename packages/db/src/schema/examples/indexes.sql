-- Secondary indexes. FumaDB generate does not emit these.

create index if not exists survey_status_updated_at_idx
  on survey (status, updated_at);

create index if not exists response_survey_id_updated_at_idx
  on response (survey_id, updated_at);

create index if not exists response_respondent_lookup_idx
  on response (survey_id, respondent_id, status);
