-- Migration 003: Fix politician names and fill real ECI 2024 election metrics
-- Source: ECI Form-20 results, ADR analysis

-- Fix Harish Balusu → G.M. Harish Balayogi (correct name for Amalapuram MP)
UPDATE politician_profiles SET
  full_name = 'G.M. Harish Balayogi',
  display_name = 'Harish Balayogi',
  bio = 'G.M. Harish Balayogi won the Amalapuram Lok Sabha constituency in 2024 with 344,323 votes. Son of former Lok Sabha Speaker G.M.C. Balayogi. Represents the Konaseema region — coconut farming, fisheries, and Godavari delta. Strong advocate for coastal infrastructure and Special Category Status for AP.'
WHERE full_name = 'Harish Balusu';

-- N. Chandrababu Naidu / Kuppam: turnout 89.88%, margin 48,006
UPDATE politician_profiles SET vote_count=107248, total_votes_polled=167200
WHERE full_name='N. Chandrababu Naidu';

-- Nimmala Ramanaidu / Palacole: 69% share, margin 67,945
UPDATE politician_profiles SET vote_count=114347, total_votes_polled=165720
WHERE full_name='Nimmala Ramanaidu';

-- Kolusu Partha Sarathy / Nuzvid: margin 12,378
UPDATE politician_profiles SET vote_count=58189, total_votes_polled=130500
WHERE full_name='Kolusu Partha Sarathy';

-- Aditi Vijayalakshmi / Vizianagaram: 64.21% share, margin 60,609
UPDATE politician_profiles SET vote_count=120796, total_votes_polled=188107
WHERE full_name='Aditi Vijayalakshmi Gajapathi Raju Pusapati';

-- Also fix Palla Srinivas Rao - existing profile, add his real 2024 data (Gajuwaka MLA)
-- Palla Srinivas Rao won Gajuwaka in 2024 (TDP)
UPDATE politician_profiles SET
  party='Telugu Desam Party',
  designation='Member of Legislative Assembly',
  constituency_name='Gajuwaka',
  state='Andhra Pradesh',
  election_year=2024,
  role='politician'
WHERE full_name='Palla Srinivas Rao';

SELECT full_name, constituency_name, winning_margin, vote_count, total_votes_polled,
  CASE WHEN total_votes_polled > 0 
    THEN ROUND(vote_count * 100.0 / total_votes_polled, 1) 
    ELSE NULL END as vote_share_pct
FROM politician_profiles WHERE party='Telugu Desam Party'
ORDER BY COALESCE(winning_margin,0) DESC;
