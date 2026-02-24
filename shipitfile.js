module.exports = shipit => {
    require('shipit-deploy')(shipit);
    require('shipit-shared')(shipit);

    const APP_NAME = 'zen-url-shortener';
    const GIT_REPOSITORY = 'git@bitbucket.org:rtcrm/zen-url-shortener.git';
    const REMOTE_DIRECTORY = '/usr/local/smartserv/zen-url-shortener';
    const DEPLOYER_USER = 'deployer';
    const SERVER_CONFIG_PATH = './config/servers.json';
    /**
     * Sample config object
     * {
     *      [environment]: {
     *          "branch": "", // git branch name
     *          "servers": [] // hostname | clientserverIP
     *      }
     *  }
     */

    let SERVER_CONFIGS = {};
    try {
        const config = require(SERVER_CONFIG_PATH);
        for (const env in config) {
            const { branch = '', servers = [] } = config[env];
            if (!branch || !servers.length) {
                continue;
            }
            SERVER_CONFIGS[env] = {
                "branch": branch,
                "servers": servers.map((server) => {
                    return { "user": DEPLOYER_USER, "host": server }
                })
            }
        }
    } catch (err) {
        shipit.log(`Server configurations missing --> ${SERVER_CONFIG_PATH} ${err.message}`);
        process.exit(0);
    }

    /** Check for additional arguments like clean-install/run-migration */
    const args = getAdditionalArguments();

    const deploymentStageNameMap = {
        'DEPLOYING': 'Deploying :construction:',
        'DEPLOYED': 'Deployed :rocket:',
        'ROLL_BACK': 'Rolling back started',
        'ROLLED_BACK': 'Rolled back completed',
        'RESTART': 'Restarting :arrows_counterclockwise:',
        'RESTARTED': 'Restarted :white_check_mark:',
        'FAILED': 'Failed :fire_engine: :ahhhhhhhhh:'
    };

    const postMessage = async (deploymentStage = '') => {
        if (!deploymentStageNameMap[deploymentStage]) {
            shipit.log(`Deployment stage not defined`);
            return Promise.resolve(false);
        }
        const developerName = await getDeployerName();
        const {
            branch = '',
            servers = []
        } = shipit.config || {};
        let message = `<!channel>,\nDeployer: *${developerName}* \nStatus: ${deploymentStageNameMap[deploymentStage]} \n`
            + `Repo: ${APP_NAME} \nClean-Install: ${args.cleanInstall || "False"}`
        if (shipit.environment) {
            message += '\nEnvironment: `' + shipit.environment + '`'
        };
        if (branch) {
            message += `\nBranch: ${branch}`;
        }
        if (servers && servers.length) {
            message += `\nServer${servers.length > 1 ? 's' : ''}: ${servers.map(server => server.host).join(', ')}`;
        }
        const https = require('https');
        const messageData = JSON.stringify({ "text": message });
        const slackWebhookConfig = {
            hostname: 'hooks.slack.com',
            port: 443,
            path: '/services/T05R94FM9BM/B06CF24DFFF/deMF4auGI838CQrf4kcWHZF0',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': messageData.length
            },
        };
        return new Promise((resolve) => {
            const req = https.request(slackWebhookConfig, (res) => {
                res.setEncoding('utf8');
                let responseBody = '';
                res.on('data', (chunk) => {
                    responseBody += chunk;
                });
                res.on('end', () => {
                    shipit.log('Message sent: %O', responseBody);
                    resolve(true);
                });
            });
            req.on('error', (err) => {
                shipit.log('Message sent failed: %O', err);
                resolve(false);
            });
            req.write(messageData);
            req.end();
        });
    }

    shipit.initConfig({
        default: {
            deployTo: REMOTE_DIRECTORY,
            repositoryUrl: GIT_REPOSITORY,
            ignores: ['.git', 'node_modules'],
            keepReleases: 3,
            deleteOnRollback: false,
            shared: {
                overwrite: true,
                dirs: []
            },
            key: '~/.ssh/id_rsa'
        },
        ...SERVER_CONFIGS
    });

    // Our listeners and tasks will go here
    shipit.task('pwd', function () {
        return shipit.remote('pwd');
    });

    shipit.on('deploy', async function () {
        await postMessage('DEPLOYING');
    });

    shipit.on('deployed', function () {
        shipit.start('restartServer');
    });

    shipit.task('restartServer', async function functionName() {
        try {
            if (args.cleanInstall) {
                console.log("Doing clean install >>>>>>>>>>>>>>>>>>>>");
                await shipit.remote(`cd ${REMOTE_DIRECTORY}/current && source ~/.nvm/nvm.sh && nvm use lts/gallium && export NODE_OPTIONS="--max-old-space-size=4096" && npm run clean-install`);
            }
            await shipit.remote(`cd ${REMOTE_DIRECTORY}/current && source ~/.nvm/nvm.sh && nvm use lts/gallium && npm run build`);
            await shipit.remote(`sh ${REMOTE_DIRECTORY}/current/scripts/startup/restart-server.sh`)
            shipit.log('Restart:Finished');
            await postMessage('DEPLOYED');
        } catch (err) {
            console.error("Failed to restart: ", err);
            await postMessage("FAILED");
        }
    });

    shipit.task('restart', async function functionName() {
        try {
            shipit.log('Restarting:Finished');
            await postMessage('RESTART');
            await shipit.remote(`sh ${REMOTE_DIRECTORY}/current/scripts/startup/restart-server.sh`);
            shipit.log('Restart:Finished');
            await postMessage('RESTARTED');
        } catch (err) {
            console.error("Failed to restart: ", err);
            await postMessage("FAILED");
        }
    });

    shipit.on('rollback', async function () {
        await postMessage('ROLL_BACK');
    });

    shipit.on('rollbacked', async function () {
        // rolled back to previous release
        // now restart the pm2 process to reflect the changes
        await shipit.remote(`sh ${REMOTE_DIRECTORY}/current/scripts/startup/restart-server.sh`);
        await postMessage('ROLLED_BACK');
    });
};

const getDeployerName = () => {
    const { exec } = require('child_process');
    const defaultName = 'Deployer';
    return new Promise((resolve) => {
        exec("if [ $SUDO_USER ]; then echo $SUDO_USER; else echo `whoami`; fi", (error, stdout, stderr) => {
            if (error || stderr) {
                shipit.log(error || stderr);
                resolve(defaultName);
            }
            resolve(stdout.toString().replace(/\n/g, ''));
        });
    });
}

const getAdditionalArguments = () => {
    let additonalArg = {};
    if (process && process.argv) {
        const args = process.argv.splice(2);
        if (args.length > 0 && args.includes('--clean-install')) {
            additonalArg['cleanInstall'] = true;
        }
    }
    return additonalArg;
}
