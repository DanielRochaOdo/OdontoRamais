update public.ramais
set setor = ltrim(setor, '* ')
where setor like '*%';
