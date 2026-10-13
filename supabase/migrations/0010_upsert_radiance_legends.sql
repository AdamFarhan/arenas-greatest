insert into public.legends (id, name, set_name) values
  ('ekko-boy-who-shattered-time', 'Ekko, Boy Who Shattered Time', 'Radiance'),
  ('evelynn-agonys-embrace', 'Evelynn, Agony''s Embrace', 'Radiance'),
  ('jarvan-iv-exemplar-of-demacia', 'Jarvan IV, Exemplar of Demacia', 'Radiance'),
  ('ksante-pride-of-nazumah', 'K''Sante, Pride of Nazumah', 'Radiance'),
  ('mordekaiser-iron-revenant', 'Mordekaiser, Iron Revenant', 'Radiance'),
  ('orianna-lady-of-clockwork', 'Orianna, Lady of Clockwork', 'Radiance'),
  ('riven-the-exile', 'Riven, The Exile', 'Radiance'),
  ('seraphine-starry-eyed-songstress', 'Seraphine, Starry-Eyed Songstress', 'Radiance'),
  ('ziggs-hexplosives-expert', 'Ziggs, Hexplosives Expert', 'Radiance')
on conflict (id) do update set
  name = excluded.name,
  set_name = excluded.set_name;
