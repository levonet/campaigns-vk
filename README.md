# campaigns-vk

Get campaign statistics from VK

```sh
# install dependencies
npm install

# get statistcs
VK_ACCESS_TOKEN="token" \
    VK_ACCOUNT_ID="0000000000" \
    DATE_FROM=`date -v-1m +%F` \
    DATE_TO=`date +%F` \
    SITE_MEDIUM="somemedium" \
    SITE_SOURCE="somesource" \
    SITE_DOMAIN="somedomain" \
    node index.js

# Result in file vk-YYYY-DD-MM.csv, where YYYY-DD-MM is ${DATE_TO}
```
