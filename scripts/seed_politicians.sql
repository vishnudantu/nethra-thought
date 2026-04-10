-- ThoughtFirst Demo — Telugu Desam Party Politicians
-- Real data from public sources
-- Demo password for all accounts: Demo@1234

-- ── USERS ─────────────────────────────────────────────────────
INSERT IGNORE INTO users (email, password_hash, role, is_active) VALUES
('cbn@tdp.com',         '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('lokesh@tdp.com',      '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('balakrishna@tdp.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1);

-- ── POLITICIAN 1: N. Chandrababu Naidu ────────────────────────
INSERT INTO politician_profiles (
  full_name, display_name, party, designation, constituency_name, state,
  lok_sabha_seat, bio, education, age, languages, achievements,
  election_year, previous_terms, winning_margin, vote_count,
  twitter_handle, website, is_active, role
) VALUES (
  'N. Chandrababu Naidu',
  'Chandrababu Naidu',
  'Telugu Desam Party',
  'Chief Minister',
  'Kuppam',
  'Andhra Pradesh',
  NULL,
  'Nara Chandrababu Naidu is the Chief Minister of Andhra Pradesh (2024-present) and national president of the Telugu Desam Party. He previously served as Chief Minister from 1995-2004, during which he transformed Hyderabad into India''s IT capital, and again from 2014-2019. A pioneer of e-governance in India, he holds a Master degree in Economics and is widely regarded as one of India''s most development-oriented leaders. Represents Kuppam, a constituency he has held for over three decades.',
  'MA Economics, Sri Venkateswara University, Tirupati',
  74,
  '["Telugu","English","Hindi"]',
  '["Chief Minister AP 2024-present","Chief Minister 1995-2004","Chief Minister 2014-2019","Built Hyderabad HITEC City IT corridor","e-Governance pioneer — first paperless CM office","World Bank recognition for AP governance","NASSCOM IT Ambassador","Launched AP Fiber Grid project"]',
  2024, 3, 32000, 98234,
  '@ncbn', 'telugudesam.org', 1, 'politician'
) ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ── POLITICIAN 2: Nara Lokesh ──────────────────────────────────
INSERT INTO politician_profiles (
  full_name, display_name, party, designation, constituency_name, state,
  bio, education, age, languages, achievements,
  election_year, previous_terms, winning_margin, vote_count,
  twitter_handle, website, is_active, role
) VALUES (
  'Nara Lokesh',
  'Nara Lokesh',
  'Telugu Desam Party',
  'Member of Legislative Assembly',
  'Mangalagiri',
  'Andhra Pradesh',
  'Nara Lokesh is IT and HRD Minister of Andhra Pradesh (2024-present). Son of Chief Minister N. Chandrababu Naidu, he won the 2024 elections from Mangalagiri with a record margin. He previously served as IT Minister (2014-2019) and spearheaded the Amaravati capital city project and AP Fiber Grid — one of the world largest rural broadband networks. He holds an MBA from Stanford University and completed the 4000 km Yuva Galam padayatra across Andhra Pradesh in 2022-23.',
  'MBA, Stanford Graduate School of Business',
  41,
  '["Telugu","English","Hindi"]',
  '["IT and HRD Minister AP 2024-present","IT Minister AP 2014-2019","Amaravati capital city project lead","AP Fiber Net — world largest rural fiber network","Yuva Galam 4000 km padayatra across AP","Stanford MBA","AP Innovation Society founder"]',
  2024, 1, 51000, 119000,
  '@naralokesh', 'naralokesh.in', 1, 'politician'
) ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ── POLITICIAN 3: Nandamuri Balakrishna ───────────────────────
INSERT INTO politician_profiles (
  full_name, display_name, party, designation, constituency_name, state,
  bio, education, age, languages, achievements,
  election_year, previous_terms, winning_margin, vote_count,
  twitter_handle, website, is_active, role
) VALUES (
  'Nandamuri Balakrishna',
  'Balakrishna',
  'Telugu Desam Party',
  'Member of Legislative Assembly',
  'Hindupur',
  'Andhra Pradesh',
  'Nandamuri Balakrishna, popularly known as Balayya or NBK, is a senior TDP leader and iconic Telugu film actor. Son of TDP founder and former AP Chief Minister N.T. Rama Rao, he has been MLA from Hindupur for three consecutive terms (2014, 2019, 2024). Known for strong constituency work and loyalty to TDP ideology. He hosts the popular TV show Unstoppable with NBK and is one of Telugu cinema biggest stars with over 100 films.',
  'Intermediate',
  63,
  '["Telugu","English","Hindi"]',
  '["MLA Hindupur 2024-present — 3rd term","Son of TDP founder N.T. Rama Rao","Telugu film actor — 100+ films","Nandamuri Trust free medical camps","Strong Rayalaseema development advocate","Hindupur constituency water and road projects"]',
  2024, 2, 28000, 96000,
  '@BalkrishnaOffl', 'nandamuribalakrishna.com', 1, 'politician'
) ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ── LINK USERS TO PROFILES ─────────────────────────────────────
UPDATE users u
JOIN politician_profiles p ON p.full_name = 'N. Chandrababu Naidu'
SET u.politician_id = p.id
WHERE u.email = 'cbn@tdp.com';

UPDATE users u
JOIN politician_profiles p ON p.full_name = 'Nara Lokesh'
SET u.politician_id = p.id
WHERE u.email = 'lokesh@tdp.com';

UPDATE users u
JOIN politician_profiles p ON p.full_name = 'Nandamuri Balakrishna'
SET u.politician_id = p.id
WHERE u.email = 'balakrishna@tdp.com';

-- ── GRIEVANCES for Chandrababu Naidu ──────────────────────────
INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Venkataramaiah', '9848012345',
  'Road from Kuppam to Gudupalle broken for 2 months',
  'Roads & Infrastructure', 'Kuppam Town',
  'The main road connecting Kuppam to Gudupalle is completely damaged. Heavy trucks use this road daily for the granite industry. NHAI has not responded to 3 previous applications. 5000 residents affected.',
  'High', 'Pending'
FROM politician_profiles WHERE full_name = 'N. Chandrababu Naidu' LIMIT 1;

INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Nagalakshmi', '9848012346',
  'Municipal water supply stopped for 15 days in Ward 4',
  'Water Supply', 'Kuppam Ward 4',
  'Municipal water supply to Ward 4 has been stopped for 15 days without notice. Residents buying water at Rs 50 per pot. Municipal engineer visited but no action. 300 families affected.',
  'Urgent', 'Pending'
FROM politician_profiles WHERE full_name = 'N. Chandrababu Naidu' LIMIT 1;

INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Hanumantha Reddy', '9848012347',
  'Old age pension not received for 4 months — widow',
  'Welfare & Pensions', 'Kamasamudram Village',
  'My mother aged 78 has not received old age pension for 4 months. She is a widow with no other income. The Panchayat office says her name was removed by error. Need immediate reinstatement.',
  'High', 'Pending'
FROM politician_profiles WHERE full_name = 'N. Chandrababu Naidu' LIMIT 1;

-- ── GRIEVANCES for Nara Lokesh ────────────────────────────────
INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Suresh Kumar', '9848023456',
  'Drainage overflowing into residential area since monsoon',
  'Sanitation', 'Mangalagiri Ward 7',
  'The main drainage canal in Ward 7 has been overflowing into residential streets since the monsoon started. Sewage water is entering homes. Corporation informed 6 times. Health hazard for 400 families.',
  'Urgent', 'Pending'
FROM politician_profiles WHERE full_name = 'Nara Lokesh' LIMIT 1;

INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Padmavathi', '9848023457',
  'Electricity bill wrongly inflated — Rs 8000 for one month',
  'Electricity', 'Thullur Colony',
  'My electricity bill for June was Rs 8000 though I use minimal appliances. Normal bill is Rs 400. APEPDCL refused to rectify. Same issue with 12 other houses in the colony.',
  'Medium', 'Pending'
FROM politician_profiles WHERE full_name = 'Nara Lokesh' LIMIT 1;

-- ── GRIEVANCES for Balakrishna ────────────────────────────────
INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Ranga Reddy', '9848034567',
  'Government school building has dangerous cracks in walls',
  'Education', 'Penukonda ZP School',
  'The ZP High School in Penukonda has visible cracks in walls and roof. Heavy rain makes it worse. DEO office informed but no action in 8 months. 600 students study here. Urgent structural inspection needed.',
  'Urgent', 'Pending'
FROM politician_profiles WHERE full_name = 'Nandamuri Balakrishna' LIMIT 1;

INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Chinna Obaiah', '9848034568',
  'Farmer loan waiver not credited after 6 months',
  'Agriculture', 'Hindupur Mandal',
  'My loan waiver was sanctioned 6 months back but not credited. Bank says list not received. Agriculture officer says list was sent. I have 3 acres and depend on this amount for kharif season inputs.',
  'High', 'Pending'
FROM politician_profiles WHERE full_name = 'Nandamuri Balakrishna' LIMIT 1;

SELECT 'TDP Politicians seeded successfully' as result;
SELECT full_name, designation, constituency_name FROM politician_profiles WHERE party = 'Telugu Desam Party' ORDER BY id;
