-- Check if user exists
SELECT id, email, name, created_at FROM users WHERE email = 'forcann66@gmail.com';

-- Update user's created_at to June 13, 2026 (13 days ago from today June 22)
UPDATE users 
SET created_at = '2026-06-13 00:00:00',
    updated_at = '2026-06-13 00:00:00'
WHERE email = 'forcann66@gmail.com';

-- Delete existing quran_reads for this user to start fresh
DELETE FROM quran_reads WHERE user_id = 2;

-- Insert Quran reading records
-- Week 0: June 13-19 (Days 0-6) - 4 days read
INSERT INTO quran_reads (user_id, date, `read`, created_at, updated_at) VALUES
(2, '2026-06-13', 1, '2026-06-13 10:00:00', '2026-06-13 10:00:00'), -- Day 0 - Read
(2, '2026-06-14', 1, '2026-06-14 09:30:00', '2026-06-14 09:30:00'), -- Day 1 - Read
(2, '2026-06-15', 0, '2026-06-15 08:00:00', '2026-06-15 08:00:00'), -- Day 2 - Not Read
(2, '2026-06-16', 1, '2026-06-16 11:00:00', '2026-06-16 11:00:00'), -- Day 3 - Read
(2, '2026-06-17', 0, '2026-06-17 07:00:00', '2026-06-17 07:00:00'), -- Day 4 - Not Read
(2, '2026-06-18', 1, '2026-06-18 10:30:00', '2026-06-18 10:30:00'), -- Day 5 - Read
(2, '2026-06-19', 0, '2026-06-19 09:00:00', '2026-06-19 09:00:00'); -- Day 6 - Not Read

-- Week 1: June 20-26 (Days 7-13) - Current week, 2 days read so far
INSERT INTO quran_reads (user_id, date, `read`, created_at, updated_at) VALUES
(2, '2026-06-20', 1, '2026-06-20 08:30:00', '2026-06-20 08:30:00'), -- Day 7 - Read
(2, '2026-06-21', 0, '2026-06-21 07:45:00', '2026-06-21 07:45:00'), -- Day 8 - Not Read
(2, '2026-06-22', 1, '2026-06-22 10:00:00', '2026-06-22 10:00:00'); -- Day 9 (TODAY) - Read

-- Verify the data
SELECT 'Week 0 (June 13-19) - First week after account creation' as info;
SELECT date, `read`, created_at FROM quran_reads WHERE user_id = 2 AND date BETWEEN '2026-06-13' AND '2026-06-19' ORDER BY date;

SELECT 'Week 1 (June 20-26) - Current week' as info;
SELECT date, `read`, created_at FROM quran_reads WHERE user_id = 2 AND date BETWEEN '2026-06-20' AND '2026-06-26' ORDER BY date;

SELECT 'Summary' as info;
SELECT 
    COUNT(*) as total_records,
    SUM(`read`) as days_read,
    COUNT(*) - SUM(`read`) as days_not_read
FROM quran_reads WHERE user_id = 2;
