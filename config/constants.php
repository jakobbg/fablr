<?php
declare(strict_types=1);

const PODCAST_ROOT    = '/mnt/torrents/Podcasts';
const PODCASTS_SUBDIR = 'Podcasts';
const BOOKS_SUBDIR    = 'Books';
const MAX_ITEMS       = 200;
const FEED_LANGUAGE   = 'no';

// Only trust X-Forwarded-* headers when requests come from these proxy CIDRs.
// Keep this list strict; add your reverse proxy IP/CIDR when needed.
const TRUSTED_PROXY_CIDRS = ['127.0.0.1/32', '::1/128'];
