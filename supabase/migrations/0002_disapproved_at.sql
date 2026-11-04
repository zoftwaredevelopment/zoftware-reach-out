-- zoftware-reach-out: soft-delete disapproved companies so re-ingestion doesn't resurrect them

alter table zoftware_companies
  add column if not exists disapproved_at timestamptz;

create index if not exists zoftware_companies_disapproved_at_idx
  on zoftware_companies (disapproved_at) where disapproved_at is not null;
