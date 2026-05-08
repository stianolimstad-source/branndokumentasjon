update public.contact_groups cg
set logo_url = p.logo_url
from public.profiles p
where cg.user_id = p.id
  and cg.logo_url is not null
  and cg.logo_url not like '%/logo-%'
  and p.logo_url is not null;