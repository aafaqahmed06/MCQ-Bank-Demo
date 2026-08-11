-- 012_leaderboard_privileges.sql
-- Restrict get_leaderboard to authenticated users only (it is rendered
-- behind the requite-profile guard). Matches the other exam RPCs.

revoke execute on function public.get_leaderboard(int) from public, anon;
grant execute on function public.get_leaderboard(int) to authenticated;