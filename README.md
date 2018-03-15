# campaigns-vk

Get campaign statistics from VK

```sh
# install dependencies
npm install

# get statistcs
PROXY_SERVER="http://proxy:8080" \
    VK_ACCESS_TOKEN="token" \
    VK_ACCOUNT_ID="0000000000" \
    DATE_FROM=`date -v-1m +%F` \
    DATE_TO=`date +%F` \
    SITE_MEDIUM="somemedium" \
    SITE_SOURCE="somesource" \
    SITE_DOMAIN="somedomain" \
    TABLE_NAME="db.table" \
    node index.js

# Result in file vk-YYYY-DD-MM.sql, where YYYY-DD-MM is ${DATE_TO}
```
