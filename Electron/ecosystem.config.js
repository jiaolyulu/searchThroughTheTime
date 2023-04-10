

module.exports = {
    apps : [{
        name: 'google-betty-search',
        script: 'out/search-through-the-timeline-win32-x64/search-through-the-timeline.exe',
        watch: true,
        instances: 1,
        cron_restart: '0 14 35,40 * *',
        env: {
            windowsHide: false
        },
    }]
}