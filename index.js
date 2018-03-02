const fs = require('fs');
const got = require('got');
const agent = require('https-proxy-agent');
const storage = require('./lib/storage');

const proxy_server = process.env.PROXY_SERVER;
const access_token = process.env.VK_ACCESS_TOKEN;
const account_id = process.env.VK_ACCOUNT_ID;
const date_from = process.env.DATE_FROM;
const date_to = process.env.DATE_TO;
const site_medium = process.env.SITE_MEDIUM || '';
const site_source = process.env.SITE_SOURCE || '';
const site_domain = process.env.SITE_DOMAIN || '';

const vkUrlAPI = 'https://api.vk.com/method/ads';
const vkOpts = {json: true};

if (proxy_server) {
    vkOpts.agent = new agent(proxy_server)
}

got(`${vkUrlAPI}.getClients?v=5.71&access_token=${access_token}&account_id=${account_id}`, vkOpts)
    .then((response) => {
        if (response.body.error) {
            console.log('getClients', response.body.error);
            process.exit(1);
        }
        return response.body.response[0].id;
    }, (err) => {
        console.error('getClients', err);
        process.exit(1);
    })
    .then((client_id) => {
        return got(`${vkUrlAPI}.getCampaigns?v=5.71&access_token=${access_token}&account_id=${account_id}&client_id=${client_id}&include_deleted=0&campaign_ids=null`, vkOpts);
    })
    .then((response) => {
        if (response.body.error) {
            console.log('getCampaigns', response.body.error);
            process.exit(1);
        }
        return response.body.response;
    }, (err) => {
        console.error('getCampaigns', err);
        process.exit(1);
    })
    .then((campaigns) => {
        const ids = campaigns.map((item) => item.id).join(',')

        const campaignNames = {};
        for (let campaign of campaigns) {
            campaignNames[campaign.id] = {
                name: campaign.name,
                type: campaign.type
            };
        }

        return Promise.all([
            got(`${vkUrlAPI}.getStatistics?v=5.71&access_token=${access_token}&account_id=${account_id}&ids_type=campaign&ids=${ids}&period=day&date_from=${date_from}&date_to=${date_to}`, vkOpts),
            Promise.resolve(campaignNames)
        ]);
    })
    .then(([response, campaignNames]) => {
        let data = [];

        if (response.body.error) {
            console.log('getStatistics', response.body.error);
            process.exit(1);
        }

        for (let campaign of response.body.response) {
            for (let statistic of campaign.stats) {
                data.push({
                    dt_sys_partition: statistic.day,
                    campaign: 'vkontakte',
                    campaign_id: campaign.id,
                    campaign_name: campaignNames[campaign.id].name,
                    campaign_type: campaignNames[campaign.id].type,
                    medium: site_medium,
                    source: site_source,
                    domain: site_domain,
                    impressions: statistic.impressions,
                    clicks: statistic.clicks || 0,
                    cost: parseFloat(statistic.spent) || 0,
                    reach: statistic.reach
                });

            };
        };

        return Promise.resolve(data);
    }, (err) => {
        console.error('getStatistics', err);
        process.exit(1);
    })
    .then((data) => {
        storage.save(`vk-${date_to}.csv`, data, [
            'dt_sys_partition',
            'campaign',
            'campaign_id',
            'campaign_name',
            'campaign_type',
            'medium',
            'source',
            'domain',
            'impressions',
            'clicks',
            'cost',
            'reach'
        ]);
    });
