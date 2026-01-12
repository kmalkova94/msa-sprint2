#!/bin/bash

set -e

kubectl delete pods -l app=booking-service,version=v1 --grace-period=0 --wait=false

sleep 5

echo "▶️ Testing fallback route..."
kubectl run fallback-test --image=curlimages/curl --restart=Never --quiet --rm -it -- \
    curl -s http://booking-service/api/ping

