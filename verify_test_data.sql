-- Verify test user account
SELECT 'User Account' as info;
SELECT id, email, DATE(created_at) as account_created FROM users WHERE id = 2;

-- Verify quran reading records
SELECT 'Quran Reading Records' as info;
SELECT date, `read` as is_read FROM quran_reads WHERE user_id = 2 ORDER BY date;

-- Week 0 summary
SELECT 'Week 0: June 13-19, 2026' as info;
SELECT 
    COUNT(*) as total_days,
    SUM(`read`) as days_read,
    COUNT(*) - SUM(`read`) as days_missed
FROM quran_reads 
WHERE user_id = 2 AND date BETWEEN '2026-06-13' AND '2026-06-19';

-- Week 1 summary
SELECT 'Week 1: June 20-26, 2026 (Current Week)' as info;
SELECT 
    COUNT(*) as total_days,
    SUM(`read`) as days_read,
    COUNT(*) - SUM(`read`) as days_missed
FROM quran_reads 
WHERE user_id = 2 AND date BETWEEN '2026-06-20' AND '2026-06-26';

-- Overall summary
SELECT 'Overall Summary' as info;
SELECT 
    COUNT(*) as total_records,
    SUM(`read`) as total_read,
    COUNT(*) - SUM(`read`) as total_missed
FROM quran_reads 
WHERE user_id = 2;
