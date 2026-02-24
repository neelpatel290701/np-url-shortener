#!/bin/bash
pm2 start /usr/local/smartserv/zen-url-shortener/current/dist/server.js --node-args "--max-old-space-size=$MAX_NODE_HEAP" --exp-backoff-restart-delay=100 -i 2 --name "ZT-URL-Shortener"