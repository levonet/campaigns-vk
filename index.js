const fs = require('fs');
const got = require('got');
const storage = require('./lib/storage');

const access_token = process.env.VK_ACCESS_TOKEN;
const account_id = process.env.VK_ACCOUNT_ID;
const date_from = process.env.DATE_FROM;
const date_to = process.env.DATE_TO;
const site_medium = process.env.SITE_MEDIUM || '';
const site_source = process.env.SITE_SOURCE || '';
const site_domain = process.env.SITE_DOMAIN || '';

const vkUrlAPI = 'https://api.vk.com/method/ads';

got(`${vkUrlAPI}.getClients?access_token=${access_token}&account_id=${account_id}`, {json: true})
    .then((response) => {
        return response.body.response[0].id;
    }, (err) => console.error('getClients', err))
    .then((client_id) => {
        return got(`${vkUrlAPI}.getCampaigns?access_token=${access_token}&account_id=${account_id}&client_id=${client_id}&include_deleted=0&campaign_ids=null`, {json: true});
    })
    .then((response) => {
        return response.body.response;
    }, (err) => console.error('getCampaigns', err))
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
            got(`${vkUrlAPI}.getStatistics?access_token=${access_token}&account_id=${account_id}&ids_type=campaign&ids=${ids}&period=day&date_from=${date_from}&date_to=${date_to}`, {json: true}),
            Promise.resolve(campaignNames)
        ]);
    })
    .then(([response, campaignNames]) => {
        let data = [];

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
    }, (err) => console.error('getStatistics', err))
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
