module.exports = {
    apps: [
      {
        name: 'master',
        script: './master.js',
        exec_mode: 'fork',
        instances: 1,
        autorestart: true,
        watch: false,
      },
      {
        name: 'bmap_listener',
        script: './bmap_listener.js',
        exec_mode: 'fork',
        instances: 1,
        wait_ready: true,
        autorestart: true,
        watch: false,
        dependencies: ['master']
      },
      {
        name: 'lockup_listener',
        script: './lockup_listener.js',
        exec_mode: 'fork',
        instances: 1,
        wait_ready: true,
        autorestart: true,
        watch: false,
        dependencies: ['master']
      },
    ],
};