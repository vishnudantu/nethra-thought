-- Real AP Politician Profiles for ThoughtFirst Demo
-- Password for all demo accounts: Demo@1234
-- Hash below is bcrypt of 'Demo@1234'

INSERT IGNORE INTO users (email, password_hash, role, is_active) VALUES
('jagan@ysrcp.com',    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('cbn@tdp.com',        '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1),
('pawankalyan@js.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'politician_admin', 1);

INSERT IGNORE INTO politician_profiles (full_name, display_name, party, designation, constituency_name, state, lok_sabha_seat, bio, education, age, languages, achievements, election_year, previous_terms, winning_margin, vote_count, total_voters, area_sqkm, population, literacy_rate, sex_ratio, twitter_handle, website, is_active)
VALUES
('Y. S. Jagan Mohan Reddy','Jagan Mohan Reddy','YSR Congress Party','Member of Parliament','Pulivendla','Andhra Pradesh','Pulivendla','Y.S. Jagan Mohan Reddy served as the 18th Chief Minister of Andhra Pradesh from 2019 to 2024. He is president of YSRCP which he founded in 2011 after resigning from Congress. Son of former CM Y.S. Rajasekhara Reddy. Known for massive welfare schemes including Navaratnalu.','Bachelor of Commerce, Loyola Academy, Secunderabad',51,'["Telugu","English","Hindi"]','["Chief Minister of AP 2019-2024","Founder YSRCP","Navaratnalu 9 welfare schemes","YSR Rythu Bharosa","Jagananna Vidya Deevena"]',2024,2,45486,116803,215000,1545,420000,67.4,971,'@ysjagan','ysrcp.com',1),

('N. Chandrababu Naidu','Chandrababu Naidu','Telugu Desam Party','Chief Minister','Kuppam','Andhra Pradesh',NULL,'Nara Chandrababu Naidu is current Chief Minister of Andhra Pradesh (2024). Previously CM 1995-2004 and 2014-2019. Transformed Hyderabad into IT hub. National president of TDP. Known for e-governance and development-focused administration.','MA Economics, Sri Venkateswara University',74,'["Telugu","English","Hindi"]','["CM AP 2024-present","CM 1995-2004 and 2014-2019","Built Hyderabad IT corridor","e-Governance pioneer","World Bank recognition"]',2024,3,32000,98000,205000,800,380000,72.1,975,'@ncbn','telugudesam.org',1),

('Konidela Pawan Kalyan','Pawan Kalyan','Jana Sena Party','Deputy Chief Minister','Pithapuram','Andhra Pradesh',NULL,'Konidela Pawan Kalyan is Deputy Chief Minister of Andhra Pradesh (2024). Founded Jana Sena Party in 2014. Prominent Telugu film actor. Won from Pithapuram in 2024 as part of NDA alliance with TDP. Known for social activism and champion of the poor.','Intermediate, Sri Chaitanya College',52,'["Telugu","English","Hindi"]','["Deputy CM AP 2024-present","Founder Jana Sena Party 2014","Prominent Telugu actor","Hudhud Cyclone relief leader","Champion of farmers"]',2024,0,34752,108534,220000,700,400000,70.5,988,'@PawanKalyan','janasenaparty.org',1);

UPDATE users u JOIN politician_profiles p ON p.full_name='Y. S. Jagan Mohan Reddy' SET u.politician_id=p.id WHERE u.email='jagan@ysrcp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='N. Chandrababu Naidu' SET u.politician_id=p.id WHERE u.email='cbn@tdp.com';
UPDATE users u JOIN politician_profiles p ON p.full_name='Konidela Pawan Kalyan' SET u.politician_id=p.id WHERE u.email='pawankalyan@js.com';

SELECT 'Politicians seeded' as result;
