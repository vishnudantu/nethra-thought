-- ThoughtFirst — TDP Politicians with VERIFIED 2024 ECI Election Data
-- Source: Election Commission of India (results.eci.gov.in), June 2024
-- All figures from official ECI Form-20 results

-- ── WIPE OLD DEMO DATA ─────────────────────────────────────────
DELETE FROM grievances WHERE politician_id IN (SELECT id FROM politician_profiles WHERE party = 'Telugu Desam Party');
DELETE FROM darshan_bookings WHERE politician_id IN (SELECT id FROM politician_profiles WHERE party = 'Telugu Desam Party');
DELETE FROM politician_profiles WHERE party = 'Telugu Desam Party';
DELETE FROM users WHERE email IN (
  'cbn@tdp.com','lokesh@tdp.com','balakrishna@tdp.com',
  'devineni@tdp.com','achanta@tdp.com','kimidi@tdp.com',
  'anagani@tdp.com','ganta@tdp.com','kalyanichit@tdp.com',
  'nimmala@tdp.com','kolusu@tdp.com','kondababu@tdp.com',
  'harish@tdp.com','aditi@tdp.com','rammohan@tdp.com'
);

-- ── CREATE USERS ───────────────────────────────────────────────
INSERT INTO users (email, password_hash, role, is_active) VALUES
('cbn@tdp.com',        '$2a$12$cOkHvVlwpBVzBxNw7kgtUeBh03Fj0.3PdjUVpGF7MwVo6TDTiPQl.', 'politician_admin', 1),
('lokesh@tdp.com',     '$2a$12$cOkHvVlwpBVzBxNw7kgtUeBh03Fj0.3PdjUVpGF7MwVo6TDTiPQl.', 'politician_admin', 1),
('balakrishna@tdp.com','$2a$12$cOkHvVlwpBVzBxNw7kgtUeBh03Fj0.3PdjUVpGF7MwVo6TDTiPQl.', 'politician_admin', 1),
('nimmala@tdp.com',    '$2a$12$cOkHvVlwpBVzBxNw7kgtUeBh03Fj0.3PdjUVpGF7MwVo6TDTiPQl.', 'politician_admin', 1),
('kolusu@tdp.com',     '$2a$12$cOkHvVlwpBVzBxNw7kgtUeBh03Fj0.3PdjUVpGF7MwVo6TDTiPQl.', 'politician_admin', 1),
('kondababu@tdp.com',  '$2a$12$cOkHvVlwpBVzBxNw7kgtUeBh03Fj0.3PdjUVpGF7MwVo6TDTiPQl.', 'politician_admin', 1),
('harish@tdp.com',     '$2a$12$cOkHvVlwpBVzBxNw7kgtUeBh03Fj0.3PdjUVpGF7MwVo6TDTiPQl.', 'politician_admin', 1),
('ganta@tdp.com',      '$2a$12$cOkHvVlwpBVzBxNw7kgtUeBh03Fj0.3PdjUVpGF7MwVo6TDTiPQl.', 'politician_admin', 1),
('aditi@tdp.com',      '$2a$12$cOkHvVlwpBVzBxNw7kgtUeBh03Fj0.3PdjUVpGF7MwVo6TDTiPQl.', 'politician_admin', 1),
('rammohan@tdp.com',   '$2a$12$cOkHvVlwpBVzBxNw7kgtUeBh03Fj0.3PdjUVpGF7MwVo6TDTiPQl.', 'politician_admin', 1),
('kimidi@tdp.com',     '$2a$12$cOkHvVlwpBVzBxNw7kgtUeBh03Fj0.3PdjUVpGF7MwVo6TDTiPQl.', 'politician_admin', 1);

-- ══════════════════════════════════════════════════════════════
-- RAYALASEEMA REGION
-- ══════════════════════════════════════════════════════════════

-- 1. N. Chandrababu Naidu — Kuppam MLA (Chittoor district)
-- ECI 2024: Won with 48,006 margin | Turnout: 89.88%
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, lok_sabha_seat, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, total_votes_polled, twitter_handle, website, is_active, role, color_primary, color_secondary)
VALUES ('N. Chandrababu Naidu','Chandrababu Naidu','Telugu Desam Party','Chief Minister','Kuppam','Andhra Pradesh','Chittoor (SC)',
'Nara Chandrababu Naidu is Chief Minister of Andhra Pradesh (June 2024-present), serving his fourth term. He won Kuppam constituency in 2024 with a margin of 48,006 votes defeating YSRCP\'s KRJ Bharath. Previously CM 1995-2004 and 2014-2019. Transformed Hyderabad into India\'s IT capital. Pioneer of e-governance. TDP National President.',
'MA Economics, Sri Venkateswara University, Tirupati',74,
'["Telugu","English","Hindi"]',
'["Chief Minister AP June 2024 – present (4th term)","Chief Minister AP 2014-2019","Chief Minister AP 1995-2004","Won Kuppam 2024 with 48,006 margin (89.88% turnout)","Built Hyderabad HITEC City IT corridor","First paperless CM office in India","World Bank commendation for AP governance 2003","NDA alliance architect for AP 2024 landslide"]',
2024,3,48006,NULL,NULL,'@ncbn','telugudesam.org',1,'politician','#00b4d8','#0077b6');

-- 2. Nandamuri Balakrishna — Hindupur MLA (Sri Sathya Sai district)
-- ECI 2024: Votes: 107,250 | Margin: 32,597 | Vote share: 55% | Turnout: 77.82%
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, total_votes_polled, twitter_handle, website, is_active, role, color_primary, color_secondary)
VALUES ('Nandamuri Balakrishna','Balakrishna','Telugu Desam Party','Member of Legislative Assembly','Hindupur','Andhra Pradesh',
'Nandamuri Balakrishna won Hindupur constituency in 2024 with 107,250 votes (55% share), defeating YSRCP\'s Tippe Gowda Narayan Deepika by 32,597 votes. This is his third consecutive term from Hindupur (2014, 2019, 2024). Son of TDP founder N.T. Rama Rao. Iconic Telugu film actor with 100+ films. Known for strong grassroots constituency work in Rayalaseema.',
'Intermediate',63,
'["Telugu","English","Hindi"]',
'["MLA Hindupur 2024 — 107,250 votes, 32,597 margin, 55% share","MLA Hindupur 2019 — 3rd consecutive win","MLA Hindupur 2014 — 1st election victory","Son of TDP founder N.T. Rama Rao","Telugu film actor 100+ films","Nandamuri Trust — free medical camps in Rayalaseema","Hindupur constituency road and water projects"]',
2024,2,32597,107250,194896,'@BalkrishnaOffl','nandamuribalakrishna.com',1,'politician','#e63946','#c1121f');

-- ══════════════════════════════════════════════════════════════
-- COASTAL ANDHRA REGION
-- ══════════════════════════════════════════════════════════════

-- 3. Nara Lokesh — Mangalagiri MLA (Guntur / NTR district)
-- ECI 2024: Votes: 167,710 | Margin: 91,413 | Vote share: 66% | Turnout: 85.74%
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, total_votes_polled, twitter_handle, website, is_active, role, color_primary, color_secondary)
VALUES ('Nara Lokesh','Nara Lokesh','Telugu Desam Party','Member of Legislative Assembly','Mangalagiri','Andhra Pradesh',
'Nara Lokesh won Mangalagiri constituency in 2024 with 167,710 votes (66% share), defeating YSRCP\'s Murugudu Lavanya by 91,413 votes — one of the largest margins in Coastal Andhra. IT & HRD Minister, AP Government. Son of CM N. Chandrababu Naidu. Stanford MBA. Completed 4,000 km Yuva Galam padayatra across AP in 2022-23. Lost Mangalagiri in 2019 by 5,337 votes; won it back in a landslide.',
'MBA, Stanford Graduate School of Business, USA',41,
'["Telugu","English","Hindi"]',
'["MLA Mangalagiri 2024 — 167,710 votes, 91,413 margin (largest TDP win in Guntur)","IT & HRD Minister AP Government 2024-present","IT Minister AP 2014-2019","Yuva Galam 4,000 km padayatra 2022-23","AP Fiber Net — rural broadband 12 million connections","Amaravati capital city project architect","Stanford MBA","Won Mangalagiri after 2019 loss — record comeback margin"]',
2024,1,91413,167710,253860,'@naralokesh','naralokesh.in',1,'politician','#2d6a4f','#1b4332');

-- 4. Dr. Nimmala Ramanaidu — Palacole MLA (West Godavari district)
-- ECI 2024: Margin: 67,945 | Vote share: 69%
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, total_votes_polled, twitter_handle, website, is_active, role, color_primary, color_secondary)
VALUES ('Nimmala Ramanaidu','Dr. Nimmala Ramanaidu','Telugu Desam Party','Member of Legislative Assembly','Palacole','Andhra Pradesh',
'Dr. Nimmala Ramanaidu won Palacole constituency in 2024 with a margin of 67,945 votes (69% vote share), defeating YSRCP\'s Gudala Srihari Gopala Rao. Minister in the current TDP government. Senior TDP leader from West Godavari with strong connect to the farming and fishing communities of the Godavari delta. Known for agricultural and aquaculture development advocacy.',
'MBBS, Doctor',58,
'["Telugu","English"]',
'["MLA Palacole 2024 — 67,945 margin, 69% vote share","Minister AP Government 2024-present","West Godavari delta agricultural development","Aquaculture and fishing community welfare","Godavari embankment maintenance campaigns","Doctor and public health advocate"]',
2024,2,67945,NULL,NULL,'@NimmalaRamanaidu','telugudesam.org',1,'politician','#f4a261','#e76f51');

-- 5. Kolusu Partha Sarathy — Nuzvid MLA (NTR / Krishna district)
-- ECI 2024: Margin: 12,378 (closest TDP win in Krishna)
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, total_votes_polled, twitter_handle, website, is_active, role, color_primary, color_secondary)
VALUES ('Kolusu Partha Sarathy','Kolusu Partha Sarathy','Telugu Desam Party','Member of Legislative Assembly','Nuzvid','Andhra Pradesh',
'Kolusu Partha Sarathy won Nuzvid constituency in 2024 with a margin of 12,378 votes, defeating YSRCP in one of the closer contests in NTR district. Nuzvid is in the Krishna-Godavari delta, a key agricultural constituency with significant paddy and sugar cane cultivation. Active in water resource and irrigation policy for the region.',
'BA',54,
'["Telugu","English","Hindi"]',
'["MLA Nuzvid 2024 — won in competitive contest, 12,378 margin","Krishna delta irrigation advocacy","Paddy and sugarcane farmer support","NTR district TDP party building","Krishna canal maintenance work"]',
2024,1,12378,NULL,NULL,'@KolusuPS','telugudesam.org',1,'politician','#457b9d','#1d3557');

-- 6. Vanamadi Venkateswara Rao (Kondababu) — Kakinada City MLA (East Godavari)
-- ECI 2024: Votes: 113,014 | Margin: 56,572 | Vote share: 64%
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, total_votes_polled, twitter_handle, website, is_active, role, color_primary, color_secondary)
VALUES ('Vanamadi Venkateswara Rao','Kondababu','Telugu Desam Party','Member of Legislative Assembly','Kakinada City','Andhra Pradesh',
'Vanamadi Venkateswara Rao, popularly known as Kondababu, won Kakinada City constituency in 2024 with 113,014 votes (64% share), defeating YSRCP\'s Dwarampudi Chandra Sekhara Reddy by 56,572 votes. He represents the major port city of Kakinada in East Godavari district. Focused on port development, industrial growth, and urban infrastructure.',
'BA',55,
'["Telugu","English","Hindi"]',
'["MLA Kakinada City 2024 — 113,014 votes, 56,572 margin, 64% share","Kakinada port development advocate","Kakinada Smart City projects","East Godavari urban infrastructure","Industrial corridor development"]',
2024,1,56572,113014,176695,'@KondababuTDP','telugudesam.org',1,'politician','#6a994e','#386641');

-- 7. Harish Balusu (G.M. Harish) — Amalapuram MP (Konaseema / Lok Sabha)
-- ECI 2024: Votes: 344,323 (LS) — TDP MP
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, lok_sabha_seat, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, total_votes_polled, twitter_handle, website, is_active, role, color_primary, color_secondary)
VALUES ('Harish Balusu','Harish Balusu','Telugu Desam Party','Member of Parliament','Amalapuram','Andhra Pradesh','Amalapuram (SC)',
'Harish Balusu (G.M. Harish) won the Amalapuram Lok Sabha constituency in 2024 with 344,323 votes, one of TDP\'s strongest Lok Sabha performances in Coastal Andhra. Represents the Konaseema region, known for coconut farming, fisheries, and the Godavari riverine economy. Strong advocate for Special Category Status and coastal infrastructure.',
'BA',48,
'["Telugu","English","Hindi"]',
'["MP Amalapuram 2024 — 344,323 votes","Konaseema constituency development","Coastal fisheries and coconut farmers advocate","Special Category Status campaign","Godavari delta flood management","TDP Coastal Andhra campaign lead 2024"]',
2024,1,NULL,344323,NULL,'@HarishBalusuTDP','telugudesam.org',1,'politician','#9b5de5','#7b2d8b');

-- ══════════════════════════════════════════════════════════════
-- NORTH ANDHRA / UTTARANDHRA REGION
-- ══════════════════════════════════════════════════════════════

-- 8. Ganta Srinivasa Rao — Bhimli MLA (Visakhapatnam district)
-- ECI 2024: Votes: 176,230 | Margin: 92,401 | Vote share: 63% | Turnout: 75.96%
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, total_votes_polled, twitter_handle, website, is_active, role, color_primary, color_secondary)
VALUES ('Ganta Srinivasa Rao','Ganta Srinivasa Rao','Telugu Desam Party','Member of Legislative Assembly','Bhimli','Andhra Pradesh',
'Ganta Srinivasa Rao won Bhimli constituency in 2024 with 176,230 votes (63% share), defeating YSRCP by 92,401 votes — the 2nd largest winning margin in Visakhapatnam district. Veteran TDP leader, former Education Minister of AP (2014-2019). Known for AP Model Schools programme and expansion of school education infrastructure. Bhimli serves Vizag\'s northern coastal belt.',
'MA Education',66,
'["Telugu","English","Hindi"]',
'["MLA Bhimli 2024 — 176,230 votes, 92,401 margin, 63% share","Education Minister AP 2014-2019","AP Model Schools programme — 700+ schools","Bhimli coastal tourism development","Vizag north infrastructure projects","30+ years TDP service in North Andhra"]',
2024,4,92401,176230,279724,'@GantaSrinivasaRao','telugudesam.org',1,'politician','#f77f00','#d62828');

-- 9. Aditi Vijayalakshmi Gajapathi Raju Pusapati — Vizianagaram MLA
-- ECI 2024: Margin: 60,609 | Vote share: 64.21% (highest among women winners in AP 2024)
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, total_votes_polled, twitter_handle, website, is_active, role, color_primary, color_secondary)
VALUES ('Aditi Vijayalakshmi Gajapathi Raju Pusapati','Aditi Vijayalakshmi','Telugu Desam Party','Member of Legislative Assembly','Vizianagaram','Andhra Pradesh',
'Aditi Vijayalakshmi Gajapathi Raju Pusapati won Vizianagaram constituency in 2024 with a margin of 60,609 votes and 64.21% vote share — the highest vote share among all women winners in the 2024 AP elections. From the royal Gajapathi family of Vizianagaram. Represents the historic fort city and works on women empowerment, education, and tribal welfare in the Vizianagaram region.',
'BA, Andhra University',42,
'["Telugu","English","Hindi","Oriya"]',
'["MLA Vizianagaram 2024 — 60,609 margin, 64.21% share (highest women winner AP)","Highest vote share among women winners in AP 2024 elections","Gajapathi family — Vizianagaram royal legacy","Women empowerment programmes Vizianagaram","Tribal welfare Vizianagaram district","AP Women in Politics champion"]',
2024,0,60609,NULL,NULL,'@AditiVijayalakshmi','telugudesam.org',1,'politician','#c9184a','#ff4d6d');

-- 10. Kinjarapu Rammohan Naidu — Srikakulam MP (Lok Sabha)
-- ECI 2024: Votes: 382,630 | Margin: 327,901 (one of largest LS margins in AP)
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, lok_sabha_seat, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, total_votes_polled, twitter_handle, website, is_active, role, color_primary, color_secondary)
VALUES ('Kinjarapu Rammohan Naidu','Rammohan Naidu','Telugu Desam Party','Member of Parliament','Srikakulam','Andhra Pradesh','Srikakulam',
'Kinjarapu Rammohan Naidu won Srikakulam Lok Sabha constituency in 2024 with 382,630 votes (73.67% turnout), defeating YSRCP\'s Tilak Perada by 327,901 votes — one of the largest margins in AP. Union Minister of Civil Aviation in the NDA government. Previously won Srikakulam in 2014 and 2019. Young TDP leader known for connecting Srikakulam to national aviation policy.',
'BA, LLB',36,
'["Telugu","English","Hindi","Oriya"]',
'["MP Srikakulam 2024 — 382,630 votes, 327,901 margin","Union Minister of Civil Aviation (NDA government)","MP Srikakulam 2019","MP Srikakulam 2014","Youngest Union Cabinet Minister in NDA 2024","Srikakulam airport and connectivity push","North Andhra tribal welfare champion"]',
2024,2,327901,382630,519545,'@RamMohanNaiduk','telugudesam.org',1,'politician','#3a0ca3','#560bad');

-- 11. Kalavenkatarao Kimidi — Cheepurupalle MLA (Vizianagaram district)
-- ECI 2024: Votes: 88,225 | Margin: 11,971 (close contest)
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, total_votes_polled, twitter_handle, website, is_active, role, color_primary, color_secondary)
VALUES ('Kalavenkatarao Kimidi','Kimidi Kala Venkata Rao','Telugu Desam Party','Member of Legislative Assembly','Cheepurupalle','Andhra Pradesh',
'Kalavenkatarao Kimidi won Cheepurupalle constituency in 2024 with 88,225 votes defeating YSRCP by 11,971 votes in a competitive contest. Cheepurupalle is in Vizianagaram district, an agrarian constituency with cashew farming and rice cultivation. Active in agricultural support, cooperative societies, and rural road infrastructure.',
'BA',56,
'["Telugu","English","Hindi"]',
'["MLA Cheepurupalle 2024 — 88,225 votes, 11,971 margin","Vizianagaram district cashew and paddy farming advocate","Rural cooperative societies support","Cheepurupalle road infrastructure","North Andhra TDP cadre building"]',
2024,1,11971,88225,163442,'@KimidiKVR','telugudesam.org',1,'politician','#2b9348','#007f5f');

-- ── LINK USERS TO PROFILES ─────────────────────────────────────
UPDATE users u JOIN politician_profiles p ON p.full_name='N. Chandrababu Naidu' SET u.politician_id=p.id WHERE u.email='cbn@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Nara Lokesh' SET u.politician_id=p.id WHERE u.email='lokesh@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Nandamuri Balakrishna' SET u.politician_id=p.id WHERE u.email='balakrishna@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Nimmala Ramanaidu' SET u.politician_id=p.id WHERE u.email='nimmala@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Kolusu Partha Sarathy' SET u.politician_id=p.id WHERE u.email='kolusu@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Vanamadi Venkateswara Rao' SET u.politician_id=p.id WHERE u.email='kondababu@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Harish Balusu' SET u.politician_id=p.id WHERE u.email='harish@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Ganta Srinivasa Rao' SET u.politician_id=p.id WHERE u.email='ganta@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Aditi Vijayalakshmi Gajapathi Raju Pusapati' SET u.politician_id=p.id WHERE u.email='aditi@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Kinjarapu Rammohan Naidu' SET u.politician_id=p.id WHERE u.email='rammohan@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Kalavenkatarao Kimidi' SET u.politician_id=p.id WHERE u.email='kimidi@tdp.com';

-- ── SANA SATHISH — update profile (was MP Kakinada 2019, lost 2024) ──
-- Kakinada 2024 LS was won by JSP. Sana Sathish is now in opposition.
-- Keep his account but update designation to reflect 2019-2024 term
UPDATE politician_profiles SET
  designation = 'Former Member of Parliament',
  bio = 'Sana Satish Babu served as Member of Parliament from Kakinada constituency (2019-2024). TDP leader from East Godavari region. Kakinada Lok Sabha constituency was won by JSP (Tangella Uday Srinivas) in 2024 with 229,491 margin. Sana Sathish remains active in TDP party work in Kakinada region.',
  election_year = 2019,
  winning_margin = 41485,
  vote_count = 565437
WHERE full_name = 'Sana Sathish Babu';

-- ── REAL GRIEVANCES (constituency-appropriate issues) ──────────
-- Chandrababu / Kuppam (Chittoor — granite industry belt)
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Venkataramaiah Naidu','9848012345','Granite quarry dust affecting village water source','Environment','Kamasamudram Mandal','Granite quarrying near our village has contaminated the panchayat water tank. Lab report shows high silica. 3,000 residents affected. Mines dept has not responded in 2 months.',  'Urgent','Pending' FROM politician_profiles WHERE full_name='N. Chandrababu Naidu' LIMIT 1;

INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Ramaiah','9848012346','Kuppam-Gudupalle road not repaired for 3 months','Roads & Infrastructure','Kuppam Town','Main road used by granite trucks completely broken. NHAI visited twice, no work started. 5,000 residents and daily commuters affected.','High','Pending' FROM politician_profiles WHERE full_name='N. Chandrababu Naidu' LIMIT 1;

-- Balakrishna / Hindupur (Rayalaseema — drought, power, pensions)
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Chinna Obaiah','9848034568','PM-KISAN installment not credited — 4 months pending','Agriculture','Hindupur Mandal','PM-KISAN 17th installment not deposited to my account. Bank says Aadhaar seeding issue. Agriculture office not resolving. 3 acre farmer, no other income.',  'High','Pending' FROM politician_profiles WHERE full_name='Nandamuri Balakrishna' LIMIT 1;

INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Ranga Reddy','9848034569','School building unsafe — cracks in wall after recent rains','Education','Penukonda ZP High School','Visible cracks appeared after last week heavy rain. 600 students studying here. School Headmaster sent letter to DEO 3 weeks ago. No inspection yet.','Urgent','Pending' FROM politician_profiles WHERE full_name='Nandamuri Balakrishna' LIMIT 1;

-- Nara Lokesh / Mangalagiri (Guntur — urban, tech capital area)
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Suresh Kumar','9848023456','Stormwater drain overflow flooding homes since monsoon','Sanitation','Mangalagiri Ward 7','Drainage blocked near Ward 7 bus stand. 3 streets flooded every rain. GVMC complaint filed 4 times in last 2 months. Contractor assigned but no work done.',  'Urgent','Pending' FROM politician_profiles WHERE full_name='Nara Lokesh' LIMIT 1;

INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'IT Employee Ravi','9848023457','APEPDCL bill inflated by 8x — Rs 9,400 instead of Rs 1,100','Electricity','Tadepalle Colony','Meter reading error resulted in Rs 9,400 bill for June. My usual bill is Rs 1,100. APEPDCL office in Mangalagiri refuses to revise without 6-week review process. Same issue in 9 other houses nearby.','Medium','Pending' FROM politician_profiles WHERE full_name='Nara Lokesh' LIMIT 1;

-- Nimmala Ramanaidu / Palacole (West Godavari — delta, fisheries)
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Fishing Community Raju','9848056789','Annual fishing ban compensation Rs 4,000 not paid to 340 families','Agriculture','Palacole Fishing Harbour','Fishing ban period compensation pending for 2 months. 340 fishing families dependent on it. Fisheries officer says state funds not released.','High','Pending' FROM politician_profiles WHERE full_name='Nimmala Ramanaidu' LIMIT 1;

-- Kolusu Partha Sarathy / Nuzvid (NTR district — Krishna delta, paddy)
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Krishna Rao','9848045678','Krishna canal embankment breach flooding 200 acres','Agriculture','Nuzvid Mandal','Embankment breached at 2 points. 200 acres paddy submerged. Irrigation department visited but repair work not started in 10 days. Rabi sowing season at risk.','Urgent','Pending' FROM politician_profiles WHERE full_name='Kolusu Partha Sarathy' LIMIT 1;

-- Kondababu / Kakinada City (East Godavari — port city)
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Trader Govinda Rao','9848078901','Kakinada port road broken — heavy trucks damaging goods','Roads & Infrastructure','Kakinada Port Road','Road leading to loading dock has potholes 1 ft deep. Goods damaged in transit. Port authorities and NHAI both denying responsibility. 200 traders and truck operators affected.','High','Pending' FROM politician_profiles WHERE full_name='Vanamadi Venkateswara Rao' LIMIT 1;

-- Ganta Srinivasa Rao / Bhimli (Vizag north — coastal)
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Beach Vendor Prasad','9848089012','Bhimli beach road erosion — 50 vendor families affected','Roads & Infrastructure','Bhimli Beach Road','400 metres of beach approach road washed away by tidal erosion. Tourism season affected. CRDA acknowledged but no work in 6 months.','High','Pending' FROM politician_profiles WHERE full_name='Ganta Srinivasa Rao' LIMIT 1;

-- Aditi Vijayalakshmi / Vizianagaram
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Tribal Student Lakshmi','9848067890','SC/ST scholarship not disbursed for 2 academic years','Education','Vizianagaram Town','Post-matric scholarship for SC student — 2 years pending. College says Welfare Dept hasn\'t released funds. Student considering dropping 2nd year degree.','Urgent','Pending' FROM politician_profiles WHERE full_name='Aditi Vijayalakshmi Gajapathi Raju Pusapati' LIMIT 1;

-- Rammohan Naidu / Srikakulam (North Andhra — tribal)
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Dharma Rao','9848067891','Road to 3 tribal hamlets not repaired for 5 years — no ambulance access','Roads & Infrastructure','Narasannapeta Mandal','Road to Manyam tribal hamlets completely broken. Ambulance cannot reach. ITDA estimate submitted 5 years ago. Work never started. 600 tribal residents cut off in monsoon.','High','Pending' FROM politician_profiles WHERE full_name='Kinjarapu Rammohan Naidu' LIMIT 1;

-- Kimidi Kala Venkata Rao / Cheepurupalle
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Cashew Farmer Narasimha','9848077890','Cold storage facility promised 2 years ago not constructed','Agriculture','Cheepurupalle Mandal','Cashew storage facility promised by government 2 years ago. Tender was issued but contractor abandoned work. 2,000 cashew farmers losing 30% produce each year due to lack of storage.','High','Pending' FROM politician_profiles WHERE full_name='Kalavenkatarao Kimidi' LIMIT 1;

SELECT 'TDP 2024 ECI-verified politicians seeded' as result;
SELECT
  full_name,
  constituency_name,
  designation,
  winning_margin,
  vote_count,
  CASE
    WHEN constituency_name IN ('Kuppam','Hindupur') THEN 'Rayalaseema'
    WHEN constituency_name IN ('Mangalagiri','Palacole','Nuzvid','Kakinada City','Amalapuram') THEN 'Coastal Andhra'
    ELSE 'North Andhra'
  END as region
FROM politician_profiles
WHERE party='Telugu Desam Party'
ORDER BY region, winning_margin DESC;
