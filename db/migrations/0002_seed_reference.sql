-- Reference data only (categories and vehicle makes from the business brief). No products, prices or stock.
INSERT INTO categories(name, slug, description, display_order) VALUES
  ('Engine Parts', 'engine-parts', 'Components for the engine block, head, timing and fuel-air systems.', 1),
  ('Suspension Parts', 'suspension-parts', 'Lower arms, bushes, shock absorbers, ball joints and links.', 2),
  ('Brake Systems', 'brake-systems', 'Brake pads, discs, calipers, hoses and related parts.', 3),
  ('Filters & Lubricants', 'filters-lubricants', 'Oil, air, fuel and cabin filters, plus engine oils and fluids.', 4),
  ('Electrical Parts', 'electrical-parts', 'Alternators, starters, sensors, switches and wiring components.', 5),
  ('Bearings', 'bearings', 'Wheel, gearbox and engine bearings.', 6),
  ('Cooling Systems', 'cooling-systems', 'Radiators, water pumps, thermostats, hoses and fans.', 7),
  ('Transmission Parts', 'transmission-parts', 'Clutch, gearbox and drivetrain components.', 8),
  ('Lighting Systems', 'lighting-systems', 'Headlamps, tail lamps, indicators and bulbs.', 9),
  ('Body Parts', 'body-parts', 'Bumpers, grilles, mirrors, panels and trim.', 10),
  ('Steering Components', 'steering-components', 'Tie rod ends, racks, pumps and steering joints.', 11),
  ('Fuel System Components', 'fuel-system-components', 'Fuel pumps, injectors, lines and filters.', 12),
  ('Wheel Hubs and Bearings', 'wheel-hubs-and-bearings', 'Hub assemblies, wheel bearings and studs.', 13),
  ('Other Spare Parts', 'other-spare-parts', 'Other automotive spare parts. Ask us if you cannot find yours.', 14)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO vehicle_makes(name) VALUES ('Toyota'), ('Nissan'), ('Ford'), ('Mitsubishi'), ('Foton'), ('GWM'), ('Isuzu')
ON CONFLICT (name) DO NOTHING;
