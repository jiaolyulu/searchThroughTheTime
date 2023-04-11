module.exports = {
    apps: [
        {
            name: 'google-betty-search',
            script: 'out/search-through-the-timeline-win32-x64/search-through-the-timeline.exe',
            watch: false,
            restart_delay: 5000,
            log_date_format: "YYYY-MM-DD HH:mm Z",
            env: {
                windowsHide: false
            }
        }
    ]
};
