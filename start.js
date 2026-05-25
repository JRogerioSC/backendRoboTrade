const { spawn } = require('child_process');

function startProcess(name, file) {

    const proc = spawn('node', [file], {
        stdio: 'inherit',
        shell: true
    });

    proc.on('close', (code) => {
        console.log(`${name} finalizado com código:`, code);
    });
}

startProcess('SERVER', 'server.js');