insert into public.legends (id, name, set_name) values
  ('ahri', 'Ahri', 'Origins'),
  ('darius', 'Darius', 'Origins'),
  ('garen', 'Garen', 'Origins'),
  ('jinx', 'Jinx', 'Origins'),
  ('lux', 'Lux', 'Origins'),
  ('master-yi', 'Master Yi', 'Origins'),
  ('yasuo', 'Yasuo', 'Origins'),
  ('vi', 'Vi', 'Origins')
on conflict (id) do update set
  name = excluded.name,
  set_name = excluded.set_name;
