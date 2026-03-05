-- Link YOUR ambulance user to an ambulance vehicle
-- Replace 'YOUR_USER_ID' with your actual user ID from the users table

-- Step 1: Find your user ID
SELECT id, username, role, full_name 
FROM users 
WHERE role = 'AMBULANCE' 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 2: After you see your user ID, run this query (replace YOUR_USER_ID_HERE)
-- Example: INSERT INTO ambulances...VALUES ('my-ambulance', 'AP-31-EMR-9999', 'YOUR_ACTUAL_USER_ID', ...)

-- Template for linking your ambulance:
-- INSERT INTO ambulances (id, vehicle_number, operator_user_id, current_latitude, current_longitude, status, equipment, last_updated)
-- VALUES (
--   'amb-your-unique-id',           -- Unique ambulance ID
--   'AP-31-EMR-9999',                -- Vehicle number
--   'YOUR_USER_ID_HERE',             -- Replace with your user ID from Step 1
--   17.7200,                         -- Current latitude (Visakhapatnam)
--   83.2950,                         -- Current longitude
--   'AVAILABLE',                     -- Status
--   '["defibrillator", "oxygen"]',   -- Equipment (JSON format)
--   CURRENT_TIMESTAMP                -- Last updated
-- );
