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
const table_name = process.env.TABLE_NAME || '';

const vkUrlAPI = 'https://api.vk.com/method/ads';
const vkVerAPI = '5.71';
const vkOpts = {json: true};

if (proxy_server) {
    vkOpts.agent = new agent(proxy_server)
}

got(`${vkUrlAPI}.getClients?v=${vkVerAPI}&access_token=${access_token}&account_id=${account_id}`, vkOpts)
    .then((response) => {
        if (response.body.error) {
            log.error(new Error(response.body.error), 'getClients');
            process.exit(1);
        }
        return response.body.response[0].id;
    }, (err) => {
        log.error(new Error(err), 'getClients');
        process.exit(1);
    })
    .then((client_id) => {
        return got(`${vkUrlAPI}.getCampaigns?v=${vkVerAPI}&access_token=${access_token}&account_id=${account_id}&client_id=${client_id}&include_deleted=0&campaign_ids=null`, vkOpts);
    })
    .then((response) => {
        if (response.body.error) {
            log.error(new Error(response.body.error), 'getCampaigns');
            process.exit(1);
        }
        return response.body.response;
    }, (err) => {
        log.error(new Error(err), 'getCampaigns');
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
            got(`${vkUrlAPI}.getStatistics?v=${vkVerAPI}&access_token=${access_token}&account_id=${account_id}&ids_type=campaign&ids=${ids}&period=day&date_from=${date_from}&date_to=${date_to}`, vkOpts),
            Promise.resolve(campaignNames)
        ]);
    })
    .then(([response, campaignNames]) => {
        let data = [];

        if (response.body.error) {
            log.error(new Error(response.body.error), 'getStatistics');
            process.exit(1);
        }

        for (let campaign of response.body.response) {
            for (let statistic of campaign.stats) {
                data.push([
                    '\'' + statistic.day + '\'',
                    '\'' + 'vkontakte' + '\'',
                    campaign.id,
                    '\'' + campaignNames[campaign.id].name + '\'',
                    '\'' + campaignNames[campaign.id].type + '\'',
                    '\'' + site_medium + '\'',
                    '\'' + site_source + '\'',
                    '\'' + site_domain + '\'',
                    statistic.impressions,
                    statistic.clicks || 0,
                    parseFloat(statistic.spent) || 0,
                    statistic.reach
                ]);
            };
        };

        return Promise.resolve(data);
    }, (err) => {
        log.error(new Error(err), 'getStatistics');
        process.exit(1);
    })
    .then((data) => {
        storage.save(`vk-${date_to}.sql`, table_name, data, [
            'dt_sys_partition',
            'campaign',
            'campaign_id',
            'campaign_name',
            'campaign_type',
            'medium',
            '"source"',
            '"domain"',
            'impressions',
            'clicks',
            'cost',
            'reach'
        ]);
    });
