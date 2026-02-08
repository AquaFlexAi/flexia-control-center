INSERT INTO
    organization_members (
        name,
        email,
        role,
        last_activity,
        joined_at
    )
VALUES (
        'Alice System',
        'alice@flexia.io',
        'system_admin',
        NOW(),
        NOW() - INTERVAL '5 days'
    ),
    (
        'Bob Manager',
        'bob@flexia.io',
        'manager',
        NOW() - INTERVAL '1 hour',
        NOW() - INTERVAL '10 days'
    ),
    (
        'Charlie Analyst',
        'charlie@flexia.io',
        'analyst',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '20 days'
    ),
    (
        'David Owner',
        'david@flexia.io',
        'owner',
        NOW(),
        NOW() - INTERVAL '30 days'
    ),
    (
        'Eve Viewer',
        'eve@flexia.io',
        'viewer',
        NOW() - INTERVAL '10 minutes',
        NOW() - INTERVAL '2 days'
    ) ON CONFLICT (email) DO
UPDATE
SET role = EXCLUDED.role;