-- ThoughtFirst Demo — Telugu Desam Party Politicians
-- 2 per region: Coastal Andhra, Rayalaseema, North Andhra (Uttarandhra)
-- Plus existing: Chandrababu (Kuppam/Rayalaseema), Lokesh (Mangalagiri/Coastal), Balakrishna (Hindupur/Rayalaseema)
-- All demo accounts: Demo@1234

-- ── USERS ─────────────────────────────────────────────────────
INSERT IGNORE INTO users (email, password_hash, role, is_active) VALUES
('cbn@tdp.com',           '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('lokesh@tdp.com',        '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('balakrishna@tdp.com',   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('devineni@tdp.com',      '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('achanta@tdp.com',       '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('kimidi@tdp.com',        '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('anagani@tdp.com',       '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('ganta@tdp.com',         '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('kalyanichit@tdp.com',   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1);

-- ══════════════════════════════════════════════════════════════
-- RAYALASEEMA REGION (Kurnool, Kadapa, Anantapur, Chittoor, Sri Sathya Sai, Nandyal)
-- ══════════════════════════════════════════════════════════════

-- 1. N. Chandrababu Naidu — Kuppam, Chittoor (CM)
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, twitter_handle, website, is_active, role)
VALUES ('N. Chandrababu Naidu','Chandrababu Naidu','Telugu Desam Party','Chief Minister','Kuppam','Andhra Pradesh',
'Nara Chandrababu Naidu is Chief Minister of Andhra Pradesh (2024-present) and national president of TDP. Served as CM 1995-2004 and 2014-2019. Transformed Hyderabad into India IT capital. Pioneer of e-governance, holds MA in Economics. Represents Kuppam in Chittoor district, held for 3 decades.','MA Economics, Sri Venkateswara University',74,'["Telugu","English","Hindi"]',
'["Chief Minister AP 2024-present","Chief Minister 1995-2004 and 2014-2019","Built Hyderabad HITEC City","e-Governance pioneer India","World Bank recognition AP governance","NASSCOM IT Ambassador"]',
2024,3,32000,98234,'@ncbn','telugudesam.org',1,'politician')
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- 2. Nandamuri Balakrishna — Hindupur, Sri Sathya Sai (MLA, 3rd term)
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, twitter_handle, website, is_active, role)
VALUES ('Nandamuri Balakrishna','Balakrishna','Telugu Desam Party','Member of Legislative Assembly','Hindupur','Andhra Pradesh',
'Nandamuri Balakrishna, known as Balayya or NBK, is MLA from Hindupur for 3 consecutive terms. Son of TDP founder N.T. Rama Rao. Iconic Telugu film actor with 100+ films. Known for strong constituency work and loyalty to TDP. Hosts popular TV show Unstoppable with NBK.','Intermediate',63,'["Telugu","English","Hindi"]',
'["MLA Hindupur 2024 - 3rd consecutive term","Son of TDP founder N.T. Rama Rao","Telugu actor 100+ films","Nandamuri Trust free medical camps","Rayalaseema development advocate"]',
2024,2,28000,96000,'@BalkrishnaOffl','nandamuribalakrishna.com',1,'politician')
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- ══════════════════════════════════════════════════════════════
-- COASTAL ANDHRA REGION (Krishna, NTR, Guntur, Bapatla, Palnadu, Eluru, West Godavari, East Godavari, Konaseema, Kakinada)
-- ══════════════════════════════════════════════════════════════

-- 3. Nara Lokesh — Mangalagiri, NTR District (IT Minister)
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, twitter_handle, website, is_active, role)
VALUES ('Nara Lokesh','Nara Lokesh','Telugu Desam Party','Member of Legislative Assembly','Mangalagiri','Andhra Pradesh',
'Nara Lokesh is IT and HRD Minister of AP (2024-present). Son of CM Chandrababu Naidu. Won 2024 from Mangalagiri with record margin. Previously IT Minister 2014-2019, led Amaravati capital project and AP Fiber Grid. Stanford MBA. Completed 4000 km Yuva Galam padayatra in 2022-23.','MBA, Stanford Graduate School of Business',41,'["Telugu","English","Hindi"]',
'["IT & HRD Minister AP 2024-present","IT Minister 2014-2019","Amaravati capital city lead","AP Fiber Net world largest rural broadband","Yuva Galam 4000 km padayatra","Stanford MBA"]',
2024,1,51000,119000,'@naralokesh','naralokesh.in',1,'politician')
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- 4. Devineni Uma — NTR District / Krishna region (Senior TDP Leader, Minister)
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, twitter_handle, website, is_active, role)
VALUES ('Devineni Uma Maheshwara Rao','Devineni Uma','Telugu Desam Party','Member of Legislative Assembly','Nuzvid','Andhra Pradesh',
'Devineni Uma Maheshwara Rao is a senior TDP leader and Water Resources Minister of Andhra Pradesh (2024-present). Former MLA from Nuzvid. Known for aggressive political advocacy, effective water management policy, and strong grassroots connect in the Krishna-Godavari delta region. Played key role in TDP campaign strategy for 2024 elections.','BA, Andhra University',62,'["Telugu","English","Hindi"]',
'["Water Resources Minister AP 2024-present","MLA Nuzvid multiple terms","Krishna-Godavari delta water management","Key TDP campaign strategist 2024","Effective opposition leader 2019-2024"]',
2024,3,18000,85000,'@DevineniUma','telugudesam.org',1,'politician')
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- 5. Achanta Rama Babu — Palakol, West Godavari (Senior TDP, Minister)
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, twitter_handle, website, is_active, role)
VALUES ('Achanta Rama Babu','Achanta Rama Babu','Telugu Desam Party','Member of Legislative Assembly','Palakol','Andhra Pradesh',
'Achanta Rama Babu is a senior TDP leader and MLA from Palakol, West Godavari. He has been a key party organiser in the West Godavari delta region for over two decades. Known for agricultural policy advocacy, aquaculture development work, and strong connect with fishing communities along the Godavari coast. Minister in current TDP government.','BA',65,'["Telugu","English"]',
'["Minister AP Government 2024-present","MLA Palakol multiple terms","West Godavari delta development","Aquaculture and fishing community advocate","Agricultural irrigation policy work"]',
2024,3,15000,80000,'@AchantaRamaBabu','telugudesam.org',1,'politician')
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- ══════════════════════════════════════════════════════════════
-- NORTH ANDHRA / UTTARANDHRA REGION (Vizianagaram, Srikakulam, Alluri Sitharama Raju, Parvathipuram Manyam, Anakapalli, Visakhapatnam)
-- ══════════════════════════════════════════════════════════════

-- 6. Kimidi Mrunalini — Palasa, Srikakulam (TDP MP, First woman MP from region)
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, twitter_handle, website, is_active, role)
VALUES ('Kimidi Mrunalini','Kimidi Mrunalini','Telugu Desam Party','Member of Parliament','Srikakulam','Andhra Pradesh',
'Kimidi Mrunalini is TDP MP from Srikakulam constituency elected in 2024. One of the prominent women leaders from North Andhra. She is known for her work on tribal welfare, coastal fishermen rights, and development of the Srikakulam district which is one of the least developed in AP. Active in issues affecting the Manyam tribal belt.','MA',48,'["Telugu","English","Hindi","Oriya"]',
'["MP Srikakulam 2024-present","Women empowerment advocacy North Andhra","Tribal welfare Manyam belt","Coastal fishing community rights","Srikakulam infrastructure development"]',
2024,1,22000,95000,'@KimidiMrunalini','telugudesam.org',1,'politician')
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- 7. Anagani Satya Prasad — Vizianagaram (Senior TDP, Minister)
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, twitter_handle, website, is_active, role)
VALUES ('Anagani Satya Prasad','Anagani Satya Prasad','Telugu Desam Party','Member of Legislative Assembly','Vizianagaram','Andhra Pradesh',
'Anagani Satya Prasad is a senior TDP leader and Minister in the 2024 AP government. Long-serving party worker from Vizianagaram, the historically important temple city. Known for constituency development work, education sector advocacy, and building TDP cadre in the North Andhra region which was traditionally dominated by opposition parties.','MBA',58,'["Telugu","English","Hindi"]',
'["Minister AP Government 2024-present","MLA Vizianagaram multiple terms","North Andhra TDP cadre building","Vizianagaram education infrastructure","Temple city heritage development"]',
2024,2,20000,88000,'@AnaganiSP','telugudesam.org',1,'politician')
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- 8. Ganta Srinivasa Rao — Bheemunipatnam, Visakhapatnam (Senior TDP Leader, former MP)
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, twitter_handle, website, is_active, role)
VALUES ('Ganta Srinivasa Rao','Ganta Srinivasa Rao','Telugu Desam Party','Member of Legislative Assembly','Bheemunipatnam','Andhra Pradesh',
'Ganta Srinivasa Rao is a veteran TDP leader and MLA from Bheemunipatnam, Visakhapatnam. Former Education Minister of AP (2014-2019). Known for his education reforms, setting up model schools, and development of Visakhapatnam coastal areas. Serves Vizag North coastal belt with focus on fishing communities and beach tourism development.','MA Education',66,'["Telugu","English","Hindi"]',
'["MLA Bheemunipatnam 2024-present","Education Minister AP 2014-2019","Model Schools programme AP","Vizag coastal development","Bheemunipatnam beach tourism","30+ years TDP service"]',
2024,4,16000,82000,'@GantaSrinivasaRao','telugudesam.org',1,'politician')
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- 9. Kalyani Chit Tirupati Rao — Visakhapatnam East (TDP MLA, Vizag city)
INSERT INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, twitter_handle, website, is_active, role)
VALUES ('Velagapudi Ramakrishna Babu','VRK Babu','Telugu Desam Party','Member of Legislative Assembly','Visakhapatnam East','Andhra Pradesh',
'Velagapudi Ramakrishna Babu, known as VRK Babu, is TDP MLA from Visakhapatnam East constituency. He represents the steel city urban constituency and focuses on port development, industrial growth, and urban infrastructure in Vizag. Strong advocate for the Steel Plant privatization opposition and Vizag Special Status. Active in addressing urban constituency challenges including drainage, roads, and unemployment.','B.Tech, JNTU Kakinada',52,'["Telugu","English","Hindi"]',
'["MLA Visakhapatnam East 2024-present","Vizag Steel Plant revival campaign","Port and industrial development advocate","Vizag urban infrastructure projects","Special Category Status for AP campaign"]',
2024,1,12000,78000,'@VRKBabuVizag','telugudesam.org',1,'politician')
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- ══════════════════════════════════════════════════════════════
-- LINK ALL USERS TO PROFILES
-- ══════════════════════════════════════════════════════════════
UPDATE users u JOIN politician_profiles p ON p.full_name='N. Chandrababu Naidu' SET u.politician_id=p.id WHERE u.email='cbn@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Nara Lokesh' SET u.politician_id=p.id WHERE u.email='lokesh@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Nandamuri Balakrishna' SET u.politician_id=p.id WHERE u.email='balakrishna@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Devineni Uma Maheshwara Rao' SET u.politician_id=p.id WHERE u.email='devineni@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Achanta Rama Babu' SET u.politician_id=p.id WHERE u.email='achanta@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Kimidi Mrunalini' SET u.politician_id=p.id WHERE u.email='kimidi@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Anagani Satya Prasad' SET u.politician_id=p.id WHERE u.email='anagani@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Ganta Srinivasa Rao' SET u.politician_id=p.id WHERE u.email='ganta@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Velagapudi Ramakrishna Babu' SET u.politician_id=p.id WHERE u.email='kalyanichit@tdp.com';

-- ══════════════════════════════════════════════════════════════
-- GRIEVANCES per politician (real constituency issues)
-- ══════════════════════════════════════════════════════════════

-- Chandrababu / Kuppam
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Venkataramaiah','9848012345','Road from Kuppam to Gudupalle broken for 2 months','Roads & Infrastructure','Kuppam Town','Main road connecting Kuppam to Gudupalle completely damaged. Trucks use this for granite industry. 5000 residents affected. NHAI not responding.','High','Pending' FROM politician_profiles WHERE full_name='N. Chandrababu Naidu' LIMIT 1;

INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Nagalakshmi','9848012346','Water supply stopped 15 days — Ward 4','Water Supply','Kuppam Ward 4','Water supply stopped without notice. 300 families buying water at Rs 50 per pot. Municipal engineer visited, no action.','Urgent','Pending' FROM politician_profiles WHERE full_name='N. Chandrababu Naidu' LIMIT 1;

-- Balakrishna / Hindupur
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Ranga Reddy','9848034567','Government school building has dangerous cracks','Education','Penukonda ZP School','Visible cracks in walls and roof. 600 students at risk. DEO office informed 8 months ago, no action. Urgent structural inspection needed.','Urgent','Pending' FROM politician_profiles WHERE full_name='Nandamuri Balakrishna' LIMIT 1;

INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Chinna Obaiah','9848034568','Farmer loan waiver not credited after 6 months','Agriculture','Hindupur Mandal','Loan waiver sanctioned 6 months ago not credited. 3 acre farmer dependent on this for kharif season inputs. Bank and Agriculture department blaming each other.','High','Pending' FROM politician_profiles WHERE full_name='Nandamuri Balakrishna' LIMIT 1;

-- Nara Lokesh / Mangalagiri
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Suresh Kumar','9848023456','Drainage overflowing into residential area','Sanitation','Mangalagiri Ward 7','Main drainage canal overflowing since monsoon. Sewage entering homes. 400 families affected. Corporation informed 6 times, no action.','Urgent','Pending' FROM politician_profiles WHERE full_name='Nara Lokesh' LIMIT 1;

-- Devineni Uma / Nuzvid
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Krishna Rao','9848045678','Canal breach flooding agricultural fields','Agriculture','Nuzvid Mandal','Krishna canal embankment breached in 3 places. 200 acres of paddy crops flooded. Irrigation department visited but repair pending for 2 weeks.','Urgent','Pending' FROM politician_profiles WHERE full_name='Devineni Uma Maheshwara Rao' LIMIT 1;

INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Sarada Devi','9848045679','Old age pension stopped without reason','Welfare & Pensions','Nuzvid Town','Pension stopped from last 3 months. 74 year old widow, sole income. Panchayat secretary says name removed by error. Needs immediate reinstatement.','High','Pending' FROM politician_profiles WHERE full_name='Devineni Uma Maheshwara Rao' LIMIT 1;

-- Achanta Rama Babu / Palakol
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Fisherman Raju','9848056789','Fishing boats not allowed during no-fishing period — compensation pending','Agriculture','Palakol Fishing Harbour','Annual no-fishing period compensation of Rs 4000 not distributed to 340 fishing families. Fisheries department says funds not released by state. 60 days pending.','High','Pending' FROM politician_profiles WHERE full_name='Achanta Rama Babu' LIMIT 1;

-- Kimidi Mrunalini / Srikakulam
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Adivasi Laxmi','9848067890','Tribal girl scholarship not received for 2 years','Education','Tekkali Mandal','SC/ST scholarship for degree course not received for 2 years. College says the amount was not disbursed by Welfare Department. Student considering dropping out.','Urgent','Pending' FROM politician_profiles WHERE full_name='Kimidi Mrunalini' LIMIT 1;

INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Dharma Rao','9848067891','Road to tribal village not repaired for 5 years','Roads & Infrastructure','Narasannapeta Mandal','Road to 3 tribal hamlets completely broken. Ambulance cannot access in emergencies. ITDA submitted estimate 5 years ago, work never started. 600 tribal residents affected.','High','Pending' FROM politician_profiles WHERE full_name='Kimidi Mrunalini' LIMIT 1;

-- Anagani Satya Prasad / Vizianagaram
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Sita Ramaiah','9848078901','Municipal school teachers post vacant for 1 year','Education','Vizianagaram Municipality','Three teacher posts in municipal school vacant for 1 year. 180 students with no proper instruction. DSE office says appointments on hold due to court case.','High','Pending' FROM politician_profiles WHERE full_name='Anagani Satya Prasad' LIMIT 1;

-- Ganta Srinivasa Rao / Bheemunipatnam
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'Beach Vendor Prasad','9848089012','Beach road erosion damaging livelihoods','Roads & Infrastructure','Bheemunipatnam Beach Road','Coastal erosion destroyed 400 metres of beach road. 50 vendors and tourism businesses affected. CRDA acknowledged but no work started in 6 months.','High','Pending' FROM politician_profiles WHERE full_name='Ganta Srinivasa Rao' LIMIT 1;

-- VRK Babu / Visakhapatnam East
INSERT INTO grievances (politician_id,petitioner_name,contact,subject,category,location,description,priority,status)
SELECT id,'IT Employee Mahesh','9848090123','Stormwater drain blocked causing flooding every rain','Sanitation','MVP Colony Vizag','Stormwater drain in MVP Colony blocked. Every monsoon rain floods 3 streets. GVMC complained 4 times. Work order issued but contractor not started.','Medium','Pending' FROM politician_profiles WHERE full_name='Velagapudi Ramakrishna Babu' LIMIT 1;

-- ══════════════════════════════════════════════════════════════
SELECT 'TDP Regional Politicians seeded' as result;
SELECT full_name, designation, constituency_name,
  CASE
    WHEN constituency_name IN ('Kuppam','Hindupur','Kadapa','Nandyal','Anantapur','Tirupati') THEN 'Rayalaseema'
    WHEN constituency_name IN ('Mangalagiri','Nuzvid','Palakol','Guntur','Vijayawada','Kakinada') THEN 'Coastal Andhra'
    WHEN constituency_name IN ('Srikakulam','Vizianagaram','Bheemunipatnam','Visakhapatnam East') THEN 'North Andhra'
    ELSE 'Coastal Andhra'
  END as region
FROM politician_profiles WHERE party='Telugu Desam Party' ORDER BY id;
