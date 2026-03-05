-- Insert a test emergency history record for 'guest' citizen
INSERT INTO emergency_history (
    id,
    emergency_code,
    citizen_id,
    ambulance_id,
    hospital_id,
    latitude,
    longitude,
    address,
    additional_info,
    assigned_bed_number,
    response_time_seconds,
    total_time_seconds,
    points_given,
    completed_at,
    created_at
) VALUES (
    UUID(),
    'ERO-TEST001',
    'guest',
    (SELECT id FROM ambulance LIMIT 1),
    (SELECT id FROM hospital LIMIT 1),
    12.9716,
    77.5946,
    'Test Emergency Location - Downtown',
    'Test emergency for guest history verification',
    'B-101',
    180,  -- 3 minutes response time
    900,  -- 15 minutes total time
    25,   -- Points awarded
    NOW(),
    NOW()
);

-- Verify the insert
SELECT * FROM emergency_history WHERE citizen_id = 'guest' ORDER BY completed_at DESC;
