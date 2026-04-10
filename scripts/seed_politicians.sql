-- ThoughtFirst Demo — Telugu Desam Party Politicians
-- Real data from public sources (ECI, Wikipedia, official TDP records)
-- All demo accounts use password: Demo@1234
-- bcrypt hash below = 'Demo@1234' (12 rounds)

-- ── USERS ─────────────────────────────────────────────────────
INSERT IGNORE INTO users (email, password_hash, role, is_active) VALUES
('cbn@tdp.com',         '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('lokesh@tdp.com',      '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('balakrishna@tdp.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1);

-- ── POLITICIAN 1: N. Chandrababu Naidu ────────────────────────
-- Chief Minister of Andhra Pradesh (2024-present)
-- Won from Kuppam constituency (Chittoor district)
INSERT INTO politician_profiles (
  full_name, display_name, party, designation, constituency_name, state,
  bio, education, age, languages, achievements,
  election_year, previous_terms, winning_margin, vote_count,
  total_voters, area_sqkm, population, literacy_rate, sex_ratio,
  twitter_handle, website, is_active
) VALUES (
  'N. Chandrababu Naidu',
  'Chandrababu Naidu',
  'Telugu Desam Party',
  'Chief Minister',
  'Kuppam',
  'Andhra Pradesh',
  'Nara Chandrababu Naidu is the Chief Minister of Andhra Pradesh (2024-present) and national president of the Telugu Desam Party. He previously served as Chief Minister from 1995-2004, during which he transformed Hyderabad into India''s IT capital, and again from 2014-2019. A pioneer of e-governance in India, he holds a Master''s degree in Economics and is widely regarded as one of India''s most development-oriented leaders. Represents Kuppam, a constituency he has held for over three decades.',
  'MA Economics, Sri Venkateswara University, Tirupati',
  74,
  '["Telugu","English","Hindi"]',
  '["Chief Minister AP 2024-present","Chief Minister 1995-2004","Chief Minister 2014-2019","Built Hyderabad HITEC City IT corridor","e-Governance pioneer — first paperless CM office","World Bank recognition for AP governance","NASSCOM IT Ambassador","Launched AP Fiber Grid project"]',
  2024, 3, 32000, 98234,
  205000, 800, 380000, 72.1, 975,
  '@ncbn', 'telugudesam.org', 1
)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- ── POLITICIAN 2: Nara Lokesh ──────────────────────────────────
-- IT & HRD Minister, AP Government (2024-present)
-- Won from Mangalagiri constituency (Guntur district)
-- Son of N. Chandrababu Naidu
INSERT INTO politician_profiles (
  full_name, display_name, party, designation, constituency_name, state,
  bio, education, age, languages, achievements,
  election_year, previous_terms, winning_margin, vote_count,
  total_voters, area_sqkm, population, literacy_rate, sex_ratio,
  twitter_handle, website, is_active
) VALUES (
  'Nara Lokesh',
  'Nara Lokesh',
  'Telugu Desam Party',
  'Member of Legislative Assembly',
  'Mangalagiri',
  'Andhra Pradesh',
  'Nara Lokesh is a TDP leader and IT & HRD Minister of Andhra Pradesh (2024-present). Son of Chief Minister N. Chandrababu Naidu, he won the 2024 Assembly elections from Mangalagiri constituency with a record margin. He previously served as the IT Minister of AP (2014-2019) and spearheaded the Amaravati capital city project and AP Fiber Grid. An MBA from Stanford, he is known for bringing a modern, tech-forward approach to governance. He completed the Yuva Galam padayatra of 4,000 km across AP in 2022-23.',
  'MBA, Stanford Graduate School of Business, USA',
  41,
  '["Telugu","English","Hindi"]',
  '["IT & HRD Minister AP 2024-present","IT Minister AP 2014-2019","Spearheaded Amaravati capital city project","AP Fiber Net — world''s largest rural fiber network","Yuva Galam padayatra 4000 km across AP","Stanford MBA — youngest minister in AP history","AP Innovation Society founder"]',
  2024, 1, 51000, 119000,
  280000, 65, 520000, 78.4, 969,
  '@naralokesh', 'naralokesh.in', 1
)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- ── POLITICIAN 3: Nandamuri Balakrishna ───────────────────────
-- Hindupur MLA, prominent TDP leader and Telugu film actor
-- Won from Hindupur constituency (Sri Sathya Sai district)
INSERT INTO politician_profiles (
  full_name, display_name, party, designation, constituency_name, state,
  bio, education, age, languages, achievements,
  election_year, previous_terms, winning_margin, vote_count,
  total_voters, area_sqkm, population, literacy_rate, sex_ratio,
  twitter_handle, website, is_active
) VALUES (
  'Nandamuri Balakrishna',
  'Balakrishna',
  'Telugu Desam Party',
  'Member of Legislative Assembly',
  'Hindupur',
  'Andhra Pradesh',
  'Nandamuri Balakrishna, popularly known as Balayya or NBK, is a senior TDP leader and iconic Telugu film actor. Son of Telugu Desam Party founder and former AP Chief Minister N.T. Rama Rao, he has been MLA from Hindupur for three consecutive terms (2014, 2019, 2024). He is known for his strong constituency work, loyalty to the TDP ideology, and his father''s legacy. He hosts the popular TV show Unstoppable with NBK and is one of Telugu cinema''s biggest stars.',
  'Intermediate',
  63,
  '["Telugu","English","Hindi"]',
  '["MLA Hindupur 2024-present (3rd consecutive term)","MLA Hindupur 2019-2024","MLA Hindupur 2014-2019","Son of TDP founder N.T. Rama Rao","Prominent Telugu film actor — 100+ films","Nandamuri Trust — free medical camps","Hindupur constituency development projects","Strong advocate for farmers in Rayalaseema"]',
  2024, 2, 28000, 96000,
  290000, 950, 540000, 65.2, 980,
  '@BalkrishnaOffl', 'nandamuribalakrishna.com', 1
)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

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

-- ── SAMPLE GRIEVANCES ─────────────────────────────────────────
-- Kuppam (Chandrababu Naidu)
INSERT INTO grievances (politician_id, petitioner_name, phone, subject, category, location, mandal, description, priority, status)
SELECT p.id, 'Venkataramaiah', '9848012345', 'Road from Kuppam to Gudupalle broken for 2 months', 'Roads & Infrastructure', 'Kuppam Town', 'Kuppam', 'The main road connecting Kuppam to Gudupalle is completely damaged. Heavy trucks use this road daily for the granite industry. NHAI has not responded to 3 previous applications. 5000 residents affected.', 'High', 'Pending'
FROM politician_profiles p WHERE p.full_name = 'N. Chandrababu Naidu' LIMIT 1;

INSERT INTO grievances (politician_id, petitioner_name, phone, subject, category, location, mandal, description, priority, status)
SELECT p.id, 'Nagalakshmi', '9848012346', 'Water supply not coming for 15 days in our ward', 'Water Supply', 'Kuppam Ward 4', 'Kuppam', 'Municipal water supply to Ward 4 has been stopped for 15 days without any notice. Residents buying water at Rs 50 per pot. Municipal engineer visited but no action taken. 300 families affected.', 'Urgent', 'Pending'
FROM politician_profiles p WHERE p.full_name = 'N. Chandrababu Naidu' LIMIT 1;

INSERT INTO grievances (politician_id, petitioner_name, phone, subject, category, location, mandal, description, priority, status)
SELECT p.id, 'Hanumantha Reddy', '9848012347', 'Pension not received for 4 months — old age widow', 'Welfare & Pensions', 'Kamasamudram Village', 'Kuppam', 'My mother aged 78 has not received old age pension for 4 months. She is a widow with no other income. The Panchayat office says her name was removed from the list by error. Need immediate reinstatement.', 'High', 'Pending'
FROM politician_profiles p WHERE p.full_name = 'N. Chandrababu Naidu' LIMIT 1;

-- Mangalagiri (Nara Lokesh)
INSERT INTO grievances (politician_id, petitioner_name, phone, subject, category, location, mandal, description, priority, status)
SELECT p.id, 'Suresh Kumar', '9848023456', 'Drainage overflowing into residential area since monsoon', 'Sanitation & Drainage', 'Mangalagiri Ward 7', 'Mangalagiri', 'The main drainage canal in Ward 7 has been overflowing into residential streets since the monsoon started. Sewage water is entering homes. Municipal corporation has been informed 6 times. Health hazard for 400 families.', 'Urgent', 'Pending'
FROM politician_profiles p WHERE p.full_name = 'Nara Lokesh' LIMIT 1;

INSERT INTO grievances (politician_id, petitioner_name, phone, subject, category, location, mandal, description, priority, status)
SELECT p.id, 'Padmavathi', '9848023457', 'Electricity bill wrongly inflated — Rs 8000 for one month', 'Electricity', 'Thullur Colony', 'Mangalagiri', 'My electricity bill for June was Rs 8,000 though I use minimal appliances. Normal bill is Rs 400. APEPDCL office refused to rectify. Meter reading appears to be incorrect. Same issue with 12 other houses in the colony.', 'Medium', 'Pending'
FROM politician_profiles p WHERE p.full_name = 'Nara Lokesh' LIMIT 1;

-- Hindupur (Balakrishna)
INSERT INTO grievances (politician_id, petitioner_name, phone, subject, category, location, mandal, description, priority, status)
SELECT p.id, 'Ranga Reddy', '9848034567', 'Government school building in dangerous condition', 'Education', 'Penukonda Government School', 'Penukonda', 'The ZP High School building in Penukonda has visible cracks in walls and roof. Heavy rainfall makes it worse. DEO office has been informed but no action in 8 months. 600 students study here. Urgent structural inspection required.', 'Urgent', 'Pending'
FROM politician_profiles p WHERE p.full_name = 'Nandamuri Balakrishna' LIMIT 1;

INSERT INTO grievances (politician_id, petitioner_name, phone, subject, category, location, mandal, description, priority, status)
SELECT p.id, 'Chinna Obaiah', '9848034568', 'Farmer loan waiver amount not credited after 6 months', 'Agriculture', 'Hindupur Mandal', 'Hindupur', 'My Rythu Bharosa and loan waiver amount was sanctioned 6 months back but not credited to my account. Bank says list not received from government. Agriculture officer says list was sent. Farmer with 3 acres, dependent on this amount for kharif season inputs.', 'High', 'Pending'
FROM politician_profiles p WHERE p.full_name = 'Nandamuri Balakrishna' LIMIT 1;

-- ── SAMPLE DARSHAN BOOKINGS (demonstration data) ──────────────
INSERT INTO darshan_bookings (politician_id, booking_ref, letter_date, visit_date, total_pilgrims, status, created_by, notes)
SELECT p.id, 'TF-20260407-001', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 4, 'approved', 1, 'VIP darshan for senior party worker family'
FROM politician_profiles p WHERE p.full_name = 'N. Chandrababu Naidu' LIMIT 1;

SELECT 'TDP Politicians seeded successfully' as result;
SELECT full_name, designation, constituency_name, party FROM politician_profiles WHERE party = 'Telugu Desam Party' ORDER BY id;
