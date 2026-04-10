-- ThoughtFirst Demo — Telugu Desam Party Politicians
-- 8 real TDP politicians across AP regions
-- Demo password for all: Demo@1234
-- bcrypt hash = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'

-- ═══════════════════════════════════════════════
-- USERS
-- ═══════════════════════════════════════════════
INSERT IGNORE INTO users (email, password_hash, role, is_active) VALUES
('cbn@tdp.com',           '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('lokesh@tdp.com',        '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('balakrishna@tdp.com',   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('kinjarapu@tdp.com',     '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('ganta@tdp.com',         '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('pithani@tdp.com',       '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('vasantha@tdp.com',      '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('gorantla@tdp.com',      '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1);

-- ═══════════════════════════════════════════════
-- POLITICIAN 1: N. Chandrababu Naidu — Kuppam (Chittoor)
-- ═══════════════════════════════════════════════
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, twitter_handle, website, is_active, role)
VALUES (
  'N. Chandrababu Naidu', 'Chandrababu Naidu', 'Telugu Desam Party', 'Chief Minister', 'Kuppam', 'Andhra Pradesh',
  'Nara Chandrababu Naidu is the Chief Minister of Andhra Pradesh (2024-present). Previously CM from 1995-2004 and 2014-2019. Transformed Hyderabad into India''s IT capital. Pioneer of e-governance. National president of TDP. Holds MA Economics from Sri Venkateswara University and has represented Kuppam constituency in Chittoor district for over three decades.',
  'MA Economics, Sri Venkateswara University', 74, '["Telugu","English","Hindi"]',
  '["CM AP 2024-present","CM 1995-2004 and 2014-2019","Built Hyderabad HITEC City","e-Governance pioneer","World Bank AP governance award","NASSCOM IT Ambassador","AP Fiber Grid project"]',
  2024, 3, 32000, 98234, '@ncbn', 'telugudesam.org', 1, 'politician'
) ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ═══════════════════════════════════════════════
-- POLITICIAN 2: Nara Lokesh — Mangalagiri (Guntur/Palnadu)
-- ═══════════════════════════════════════════════
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, twitter_handle, website, is_active, role)
VALUES (
  'Nara Lokesh', 'Nara Lokesh', 'Telugu Desam Party', 'Member of Legislative Assembly', 'Mangalagiri', 'Andhra Pradesh',
  'Nara Lokesh is IT and HRD Minister of Andhra Pradesh (2024-present). Son of CM N. Chandrababu Naidu. Won 2024 elections from Mangalagiri with record margin. Previously IT Minister 2014-2019. Spearheaded Amaravati capital and AP Fiber Grid. Completed the 4000 km Yuva Galam padayatra across AP in 2022-23. Stanford MBA.',
  'MBA, Stanford Graduate School of Business', 41, '["Telugu","English","Hindi"]',
  '["IT and HRD Minister AP 2024-present","IT Minister 2014-2019","Amaravati capital city project","AP Fiber Net rural broadband","Yuva Galam 4000 km padayatra","Stanford MBA"]',
  2024, 1, 51000, 119000, '@naralokesh', 'naralokesh.in', 1, 'politician'
) ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ═══════════════════════════════════════════════
-- POLITICIAN 3: Nandamuri Balakrishna — Hindupur (Sri Sathya Sai/Chittoor)
-- ═══════════════════════════════════════════════
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, twitter_handle, website, is_active, role)
VALUES (
  'Nandamuri Balakrishna', 'Balakrishna', 'Telugu Desam Party', 'Member of Legislative Assembly', 'Hindupur', 'Andhra Pradesh',
  'Nandamuri Balakrishna (NBK) is a senior TDP leader and iconic Telugu film actor. Son of TDP founder N.T. Rama Rao. MLA from Hindupur for three consecutive terms. Known for strong constituency work in Rayalaseema and loyalty to TDP ideology. One of Telugu cinema biggest stars with over 100 films.',
  'Intermediate', 63, '["Telugu","English","Hindi"]',
  '["MLA Hindupur 2024 — 3rd consecutive term","Son of TDP founder NTR","100+ Telugu films","Nandamuri Trust free medical camps","Rayalaseema development advocate"]',
  2024, 2, 28000, 96000, '@BalkrishnaOffl', 'nandamuribalakrishna.com', 1, 'politician'
) ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ═══════════════════════════════════════════════
-- POLITICIAN 4: Kinjarapu Ram Mohan Naidu — Srikakulam (MP)
-- ═══════════════════════════════════════════════
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, twitter_handle, website, is_active, role)
VALUES (
  'Kinjarapu Ram Mohan Naidu', 'Ram Mohan Naidu', 'Telugu Desam Party', 'Member of Parliament', 'Srikakulam', 'Andhra Pradesh',
  'Kinjarapu Ram Mohan Naidu is the Union Civil Aviation Minister (2024-present) and TDP MP from Srikakulam. One of the youngest union ministers in India. Son of former TDP MP Kinjarapu Yerran Naidu. Known for bringing aviation infrastructure and development to North Andhra. Has been vocal about Srikakulam district infrastructure development, port connectivity, and youth employment.',
  'BA, Andhra University', 36, '["Telugu","English","Hindi"]',
  '["Union Civil Aviation Minister 2024-present","MP Srikakulam 3rd term","Youngest union minister in current cabinet","Champion of North Andhra infrastructure","Bheemunipatnam port development","Vizag-Chennai industrial corridor advocacy"]',
  2024, 2, 45000, 112000, '@RamMohanNaidu', 'rammohannaiduoffl.com', 1, 'politician'
) ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ═══════════════════════════════════════════════
-- POLITICIAN 5: Ganta Srinivasa Rao — Bheemunipatnam (Visakhapatnam)
-- ═══════════════════════════════════════════════
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, twitter_handle, website, is_active, role)
VALUES (
  'Ganta Srinivasa Rao', 'Ganta Srinivasa Rao', 'Telugu Desam Party', 'Member of Legislative Assembly', 'Bheemunipatnam', 'Andhra Pradesh',
  'Ganta Srinivasa Rao is a senior TDP leader and MLA from Bheemunipatnam constituency in Visakhapatnam district. Previously served as Minister for Human Resources Development and Technical Education under Chandrababu Naidu government (2014-2019). Known for education reforms and development of coastal Visakhapatnam region. Active in fishermen welfare and beach development projects.',
  'BTech, Andhra University College of Engineering', 65, '["Telugu","English","Hindi"]',
  '["MLA Bheemunipatnam 2024","HRD Minister AP 2014-2019","Education reforms champion","Visakhapatnam coastal development","Fishermen welfare schemes","Bheemunipatnam beach development"]',
  2024, 2, 18000, 78000, '@GantaSrinivasaR', 'gantasrinivasarao.com', 1, 'politician'
) ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ═══════════════════════════════════════════════
-- POLITICIAN 6: Pithani Satyanarayana — Rajanagaram (East Godavari)
-- ═══════════════════════════════════════════════
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, twitter_handle, website, is_active, role)
VALUES (
  'Pithani Satyanarayana', 'Pithani Satyanarayana', 'Telugu Desam Party', 'Member of Legislative Assembly', 'Rajanagaram', 'Andhra Pradesh',
  'Pithani Satyanarayana is TDP MLA from Rajanagaram constituency in East Godavari district. Active in agricultural issues of the Godavari delta region including irrigation, paddy procurement, and farmer welfare. Rajanagaram is a key constituency in the fertile Godavari delta and a TDP stronghold. Known for constituency-level groundwork and connecting farmers to government schemes.',
  'BA, Kakatiya University', 58, '["Telugu","English"]',
  '["MLA Rajanagaram 2024","East Godavari farmers advocate","Godavari irrigation committee member","Paddy procurement monitoring","Agricultural input subsidy drives","Village connectivity road projects"]',
  2024, 1, 14000, 72000, '@PithaniSatya', '', 1, 'politician'
) ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ═══════════════════════════════════════════════
-- POLITICIAN 7: Vasantha Krishna Prasad — Narasapuram (West Godavari / NTR)
-- ═══════════════════════════════════════════════
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, twitter_handle, website, is_active, role)
VALUES (
  'Vasantha Krishna Prasad Badeti', 'Vasantha Krishna Prasad', 'Telugu Desam Party', 'Member of Parliament', 'Narasapuram', 'Andhra Pradesh',
  'Vasantha Krishna Prasad Badeti is TDP MP from Narasapuram constituency covering parts of West Godavari and NTR district. A prominent TDP leader from the Godavari region representing the interests of fishermen, farmers, and coconut growers. Active in advocating for the Polavaram irrigation project completion which is crucial for West Godavari delta farmers.',
  'BCom', 55, '["Telugu","English"]',
  '["MP Narasapuram 2024","Polavaram project completion advocate","West Godavari fishermen welfare","Coconut farmers support schemes","Aquaculture development in delta region","Kakinada port expansion advocacy"]',
  2024, 1, 22000, 88000, '@VasanthaKrishna', '', 1, 'politician'
) ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ═══════════════════════════════════════════════
-- POLITICIAN 8: Gorantla Madhav — Hindupur (Sri Sathya Sai) — MP
-- Actually using: Srinivasa Varma — Amalapuram (Konaseema/East Godavari) — MP
-- ═══════════════════════════════════════════════
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, twitter_handle, website, is_active, role)
VALUES (
  'Gorantla Madhav', 'Gorantla Madhav', 'Telugu Desam Party', 'Member of Parliament', 'Vizianagaram', 'Andhra Pradesh',
  'Gorantla Madhav is TDP MP from Vizianagaram constituency. Active in tribal welfare, forest rights, and development of North Andhra backward regions. Vizianagaram district has significant tribal population and Gorantla has been vocal about scheduled tribe land rights, forest produce collection, and ITDA scheme implementation. Champions tribal education and healthcare.',
  'BA', 52, '["Telugu","English","Hindi"]',
  '["MP Vizianagaram 2024","Tribal welfare champion","Forest rights advocate","ITDA scheme monitoring","North Andhra backward region development","Scheduled tribe land rights"]',
  2024, 1, 19000, 82000, '@GorantlaMadhav', '', 1, 'politician'
) ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ═══════════════════════════════════════════════
-- LINK USERS TO PROFILES
-- ═══════════════════════════════════════════════
UPDATE users u JOIN politician_profiles p ON p.full_name = 'N. Chandrababu Naidu' SET u.politician_id = p.id WHERE u.email = 'cbn@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name = 'Nara Lokesh' SET u.politician_id = p.id WHERE u.email = 'lokesh@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name = 'Nandamuri Balakrishna' SET u.politician_id = p.id WHERE u.email = 'balakrishna@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name = 'Kinjarapu Ram Mohan Naidu' SET u.politician_id = p.id WHERE u.email = 'kinjarapu@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name = 'Ganta Srinivasa Rao' SET u.politician_id = p.id WHERE u.email = 'ganta@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name = 'Pithani Satyanarayana' SET u.politician_id = p.id WHERE u.email = 'pithani@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name = 'Vasantha Krishna Prasad Badeti' SET u.politician_id = p.id WHERE u.email = 'vasantha@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name = 'Gorantla Madhav' SET u.politician_id = p.id WHERE u.email = 'gorantla@tdp.com';

-- ═══════════════════════════════════════════════
-- GRIEVANCES — Kuppam / Chittoor (Chandrababu)
-- ═══════════════════════════════════════════════
INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Venkataramaiah', '9848012345', 'Road from Kuppam to Gudupalle broken for 2 months', 'Roads & Infrastructure', 'Kuppam Town', 'The main road connecting Kuppam to Gudupalle is completely damaged. Heavy trucks use this road daily for the granite industry. NHAI has not responded to 3 previous applications. 5000 residents affected.', 'High', 'Pending'
FROM politician_profiles WHERE full_name = 'N. Chandrababu Naidu' LIMIT 1;

INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Nagalakshmi', '9848012346', 'Municipal water supply stopped 15 days — Ward 4', 'Water Supply', 'Kuppam Ward 4', 'Municipal water supply to Ward 4 stopped for 15 days without notice. Residents buying water at Rs 50 per pot. 300 families affected.', 'Urgent', 'Pending'
FROM politician_profiles WHERE full_name = 'N. Chandrababu Naidu' LIMIT 1;

-- ═══════════════════════════════════════════════
-- GRIEVANCES — Mangalagiri (Nara Lokesh)
-- ═══════════════════════════════════════════════
INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Suresh Kumar', '9848023456', 'Drainage overflowing into homes since monsoon', 'Sanitation', 'Mangalagiri Ward 7', 'Main drainage canal overflowing into residential streets since monsoon. Sewage entering homes. Corporation informed 6 times. 400 families affected.', 'Urgent', 'Pending'
FROM politician_profiles WHERE full_name = 'Nara Lokesh' LIMIT 1;

INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Padmavathi', '9848023457', 'Electricity bill inflated Rs 8000 — normal is Rs 400', 'Electricity', 'Thullur Colony', 'Electricity bill wrongly inflated 20x. APEPDCL refused to rectify. Same issue in 12 houses in the colony.', 'Medium', 'Pending'
FROM politician_profiles WHERE full_name = 'Nara Lokesh' LIMIT 1;

-- ═══════════════════════════════════════════════
-- GRIEVANCES — Hindupur / Chittoor (Balakrishna)
-- ═══════════════════════════════════════════════
INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Ranga Reddy', '9848034567', 'Government school building has dangerous cracks', 'Education', 'Penukonda ZP School', 'ZP High School in Penukonda has visible cracks in walls and roof. DEO notified 8 months ago, no action. 600 students at risk.', 'Urgent', 'Pending'
FROM politician_profiles WHERE full_name = 'Nandamuri Balakrishna' LIMIT 1;

INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Chinna Obaiah', '9848034568', 'Farmer loan waiver not credited after 6 months', 'Agriculture', 'Hindupur Mandal', 'Loan waiver sanctioned 6 months back but not credited. 3 acre farmer dependent on this amount for kharif season inputs.', 'High', 'Pending'
FROM politician_profiles WHERE full_name = 'Nandamuri Balakrishna' LIMIT 1;

-- ═══════════════════════════════════════════════
-- GRIEVANCES — Srikakulam (Ram Mohan Naidu)
-- ═══════════════════════════════════════════════
INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Sarada Devi', '9848045678', 'No bus connectivity to Kotabommali from Srikakulam', 'Transport', 'Kotabommali Mandal', 'Kotabommali mandal has no direct APSRTC bus service. Tribals and students travel 18 km on foot or pay private vehicles. Multiple complaints to RTC office unanswered for 6 months.', 'High', 'Pending'
FROM politician_profiles WHERE full_name = 'Kinjarapu Ram Mohan Naidu' LIMIT 1;

INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Appala Naidu', '9848045679', 'Fishermen boats seized by authorities without notice', 'Fisheries', 'Srikakulam Harbour', 'Marine fishermen boats seized by harbour authority citing permit issues. 45 families depend on these boats. Permits were valid. Authorities not responding. Fish rotting due to delay.', 'Urgent', 'Pending'
FROM politician_profiles WHERE full_name = 'Kinjarapu Ram Mohan Naidu' LIMIT 1;

-- ═══════════════════════════════════════════════
-- GRIEVANCES — Bheemunipatnam / Visakhapatnam (Ganta)
-- ═══════════════════════════════════════════════
INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Rambabu', '9848056789', 'Sea erosion destroying fishing village — 50 homes at risk', 'Disaster & Relief', 'Bheemunipatnam Beach Village', 'Sea erosion advancing 10 metres per year. 50 homes at immediate risk. Fishermen families have nowhere to go. Coastal protection works sanctioned 2 years ago but not started.', 'Urgent', 'Pending'
FROM politician_profiles WHERE full_name = 'Ganta Srinivasa Rao' LIMIT 1;

INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Vijaya Lakshmi', '9848056790', 'PHC doctor absent for 3 weeks in Bheemunipatnam', 'Health', 'Bheemunipatnam PHC', 'The PHC doctor has been absent for 3 consecutive weeks. Patients travelling 25 km to Vizag for basic treatment. DMO office informed but no replacement posted.', 'High', 'Pending'
FROM politician_profiles WHERE full_name = 'Ganta Srinivasa Rao' LIMIT 1;

-- ═══════════════════════════════════════════════
-- GRIEVANCES — Rajanagaram / East Godavari (Pithani)
-- ═══════════════════════════════════════════════
INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Srinivasa Rao', '9848067890', 'Paddy procurement centre not operating — farmers losing money', 'Agriculture', 'Rajanagaram IKP Centre', 'Government paddy procurement centre at Rajanagaram not operating for 3 weeks during harvest season. Farmers forced to sell to private traders at Rs 500 below MSP. 800 acres of paddy affected.', 'Urgent', 'Pending'
FROM politician_profiles WHERE full_name = 'Pithani Satyanarayana' LIMIT 1;

INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Kamala Devi', '9848067891', 'Godavari canal breach flooding 4 villages', 'Irrigation & Floods', 'Rajam Anicut Canal', 'The secondary irrigation canal has breached near Rajanagaram causing flooding in 4 villages. 200 acres of standing paddy crop destroyed. Irrigation department not responding.', 'Urgent', 'Pending'
FROM politician_profiles WHERE full_name = 'Pithani Satyanarayana' LIMIT 1;

-- ═══════════════════════════════════════════════
-- GRIEVANCES — Narasapuram / West Godavari (Vasantha)
-- ═══════════════════════════════════════════════
INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Venkata Rao', '9848078901', 'Polavaram project displacement — compensation not paid', 'Revenue & Land', 'Kovvur Mandal', '185 families displaced for Polavaram project from our village in 2021. Compensation of Rs 12 lakh each promised but only Rs 3 lakh paid so far. No alternative housing provided. Families living in temporary shelters.', 'Urgent', 'Pending'
FROM politician_profiles WHERE full_name = 'Vasantha Krishna Prasad Badeti' LIMIT 1;

INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Fish Merchant Raju', '9848078902', 'Fish market modernization works stalled for 8 months', 'Infrastructure', 'Narasapuram Fish Market', 'Government sanctioned Rs 45 lakh for Narasapuram fish market modernization. Work started in January but contractor abandoned site in March. Market in unusable condition affecting 300 fishermen families.', 'High', 'Pending'
FROM politician_profiles WHERE full_name = 'Vasantha Krishna Prasad Badeti' LIMIT 1;

-- ═══════════════════════════════════════════════
-- GRIEVANCES — Vizianagaram (Gorantla)
-- ═══════════════════════════════════════════════
INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Tribal Leader Raju', '9848089012', 'Forest rights certificates not issued to 200 tribal families', 'Tribal Welfare', 'Parvathipuram Agency', '200 tribal families in Parvathipuram mandal have been cultivating forest land for 30+ years. Their Forest Rights Act applications were rejected without reason 6 months ago. Families at risk of eviction.', 'Urgent', 'Pending'
FROM politician_profiles WHERE full_name = 'Gorantla Madhav' LIMIT 1;

INSERT INTO grievances (politician_id, petitioner_name, contact, subject, category, location, description, priority, status)
SELECT id, 'Janaki Devi', '9848089013', 'ITDA hostel students not receiving scholarship for 2 years', 'Education', 'Vizianagaram ITDA Hostel', 'Students in ITDA residential school have not received their post-matric scholarship for 2 consecutive years. 340 tribal students affected. School management says funds not released from state government.', 'High', 'Pending'
FROM politician_profiles WHERE full_name = 'Gorantla Madhav' LIMIT 1;

-- ═══════════════════════════════════════════════
-- VERIFY
-- ═══════════════════════════════════════════════
SELECT 'Politicians seeded:' as info;
SELECT full_name, designation, constituency_name FROM politician_profiles WHERE party = 'Telugu Desam Party' ORDER BY id;
SELECT 'Grievances seeded:' as info;
SELECT p.full_name, COUNT(g.id) as grievances FROM politician_profiles p LEFT JOIN grievances g ON g.politician_id = p.id WHERE p.party = 'Telugu Desam Party' GROUP BY p.id ORDER BY p.id;
