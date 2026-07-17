insert into public.legends (id, name, set_name) values
  ('akali-rogue-assassin', 'Akali, Rogue Assassin', 'Vendetta'),
  ('ambessa-matriarch-of-war', 'Ambessa, Matriarch of War', 'Vendetta'),
  ('jayce-defender-of-tomorrow', 'Jayce, Defender of Tomorrow', 'Vendetta'),
  ('kennen-heart-of-the-tempest', 'Kennen, Heart of the Tempest', 'Vendetta'),
  ('mel-souls-reflection', 'Mel, Soul''s Reflection', 'Vendetta'),
  ('nasus-curator-of-the-sands', 'Nasus, Curator of the Sands', 'Vendetta'),
  ('renekton-butcher-of-the-sands', 'Renekton, Butcher of the Sands', 'Vendetta'),
  ('shen-eye-of-twilight', 'Shen, Eye of Twilight', 'Vendetta'),
  ('zed-master-of-shadows', 'Zed, Master of Shadows', 'Vendetta')
on conflict (id) do update set
  name = excluded.name,
  set_name = excluded.set_name;
