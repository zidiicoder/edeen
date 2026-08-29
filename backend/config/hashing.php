<?php

return [

    'driver' => 'bcrypt',

    'bcrypt' => [
        'rounds' => 12,
        // PHP's password_get_info() only recognises the '$2y$' bcrypt prefix,
        // not '$2a$'/'$2b$' (older/other bcrypt implementations) — even though
        // password_verify() itself handles all of them correctly. Laravel's
        // default 'verify' => true rejects those with a RuntimeException
        // instead of checking the password. Some imported/legacy accounts use
        // '$2a$' hashes, so this stays off to allow them to log in normally.
        'verify' => false,
        'limit' => null,
    ],

];
