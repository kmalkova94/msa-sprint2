#!/bin/bash

set -e

echo "▶️ Проверка Feature Flag (X-Feature-Enabled: true)..."

# Отправляем запрос с заголовком, чтобы маршрутизировать трафик на `v2`
kubectl run feature-test --image=curlimages/curl --restart=Never --quiet --rm -it -- \
    curl -H "X-Feature-Enabled: true" -s http://booking-service/api/ping
