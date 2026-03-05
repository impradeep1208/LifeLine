-- ================================================
-- Clear Emergencies Script
-- Use this to reset emergencies for testing
-- ================================================

USE ero_db;

-- Clear emergencies table (for 5km duplicate SOS testing)
DELETE FROM emergencies;

-- Optional: Also clear related history and notification data
-- DELETE FROM emergency_history;
-- DELETE FROM notifications WHERE entity_type = 'emergency';

-- Verify deletion
SELECT COUNT(*) as remaining_emergencies FROM emergencies;

SELECT '✅ Emergencies cleared! You can now test SOS again.' as status;
