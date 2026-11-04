-- zoftware-reach-out: allow removing triage companies without cascade-deleting their leads
-- Change leads.company_id FK from on delete cascade to on delete set null
-- so approved/disapproved companies can be purged from triage while keeping the lead record

alter table zoftware_leads
  drop constraint if exists zoftware_leads_company_id_fkey;

alter table zoftware_leads
  add constraint zoftware_leads_company_id_fkey
    foreign key (company_id) references zoftware_companies (id)
    on delete set null;
