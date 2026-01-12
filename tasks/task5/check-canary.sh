#!/bin/bash
set -e

echo "▶️ Checking canary release (90% v1, 10% v2)..."

# Run test and capture ALL output
kubectl run canary-test --image=curlimages/curl --restart=Never --rm -it -- \
    sh -c '
        for i in $(seq 1 100); do
            echo "Request $i: $(curl -s http://booking-service/api/ping)"
            sleep 1.4  # Small delay to ensure output is captured
        done
    ' 2>&1 | tee check-canary-log.txt

# Count occurrences
echo
echo "Summary:"
cat check-canary-log.txt | grep -o "pong from v[12]" | sort | uniq -c