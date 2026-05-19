-- Add seed lifecycle tracking to inventory table
alter table inventory
  add column if not exists status text not null default 'in_inventory'
    check (status in ('in_inventory', 'in_process', 'planted')),
  add column if not exists process_type text
    check (process_type is null or process_type in ('starting_indoors', 'direct_sow')),
  add column if not exists action_date date;
