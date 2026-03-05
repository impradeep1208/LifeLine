-- Check emergency history records
SELECT 
    id,
    emergency_code,
    citizen_id,
    ambulance_id,
    hospital_id,
    address,
    response_time_seconds,
    total_time_seconds,
    points_given,
    completed_at,
    created_at
FROM emergency_history
ORDER BY completed_at DESC
LIMIT 10;

-- Count by citizen
SELECT 
    citizen_id,
    COUNT(*) as total_emergencies,
    AVG(response_time_seconds) as avg_response_time,
    SUM(points_given) as total_points
FROM emergency_history
GROUP BY citizen_id;

-- Check if 'guest' citizen has any records
SELECT COUNT(*) as guest_records
FROM emergency_history
WHERE citizen_id = 'guest';
