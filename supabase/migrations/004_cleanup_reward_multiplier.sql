-- Reward multiplier from marker age + distance from city center.
-- Formula mirrored in features/cleanupSpots/cleanupReward.ts

create or replace function public.cleanup_reward_multiplier(
  p_created_at timestamptz,
  p_latitude double precision,
  p_longitude double precision
)
returns numeric
language plpgsql
stable
as $$
declare
  city_lat constant double precision := 52.52;
  city_lng constant double precision := 13.405;
  age_days double precision;
  dist_km double precision;
  lat1 double precision;
  lat2 double precision;
  dlat double precision;
  dlng double precision;
  a double precision;
  c double precision;
  raw numeric;
begin
  age_days := greatest(0, extract(epoch from (now() - p_created_at)) / 86400.0);

  lat1 := radians(p_latitude);
  lat2 := radians(city_lat);
  dlat := radians(city_lat - p_latitude);
  dlng := radians(city_lng - p_longitude);
  a := sin(dlat / 2) * sin(dlat / 2)
    + cos(lat1) * cos(lat2) * sin(dlng / 2) * sin(dlng / 2);
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  dist_km := 6371.0 * c;

  raw := 1.0
    + 0.1 * age_days
    + 0.05 * (dist_km / 5.0);

  return least(3.0, greatest(1.0, raw));
end;
$$;

create or replace function public.cleanup_reward_tier(p_multiplier numeric)
returns text
language sql
immutable
as $$
  select case
    when p_multiplier >= 2.5 then 'epic'
    when p_multiplier >= 1.5 then 'rare'
    else 'normal'
  end;
$$;

comment on function public.cleanup_reward_multiplier is
  'Older + farther cleanup spots yield higher dobri/xp multiplier (max 3).';
