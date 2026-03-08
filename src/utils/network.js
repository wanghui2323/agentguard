"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNetworkConnections = getNetworkConnections;
exports.getListeningPorts = getListeningPorts;
exports.isPortInUse = isPortInUse;
exports.isPortPubliclyExposed = isPortPubliclyExposed;
exports.getPortBinding = getPortBinding;
exports.isLocalhost = isLocalhost;
exports.parseApiEndpoint = parseApiEndpoint;
/**
 * Network utilities
 */
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Get all network connections
 */
async function getNetworkConnections() {
    try {
        // Use lsof to get network connections (macOS/Linux)
        const { stdout } = await execAsync('lsof -i -P -n');
        const lines = stdout.split('\n').slice(1); // Skip header
        const connections = [];
        for (const line of lines) {
            if (!line.trim())
                continue;
            const parts = line.trim().split(/\s+/);
            if (parts.length < 9)
                continue;
            const type = parts[7]; // TCP or UDP
            const addresses = parts[8]; // local->remote or local
            if (type !== 'TCP' && type !== 'UDP')
                continue;
            const [local, remote] = addresses.split('->');
            const [localAddress, localPort] = local.split(':');
            const connection = {
                protocol: type,
                localAddress: localAddress || '0.0.0.0',
                localPort: parseInt(localPort) || 0,
                state: parts[9] || 'UNKNOWN'
            };
            if (remote) {
                const [remoteAddress, remotePort] = remote.split(':');
                connection.remoteAddress = remoteAddress;
                connection.remotePort = parseInt(remotePort) || 0;
            }
            connections.push(connection);
        }
        return connections;
    }
    catch (error) {
        console.error('Failed to get network connections:', error);
        return [];
    }
}
/**
 * Get listening ports
 */
async function getListeningPorts() {
    const connections = await getNetworkConnections();
    return connections.filter(conn => conn.state === 'LISTEN');
}
/**
 * Check if port is in use
 */
async function isPortInUse(port) {
    const listening = await getListeningPorts();
    return listening.some(conn => conn.localPort === port);
}
/**
 * Check if port is exposed to public
 */
function isPortPubliclyExposed(connection) {
    const publicBindings = ['0.0.0.0', '*', '::'];
    return publicBindings.includes(connection.localAddress);
}
/**
 * Get port binding info
 */
async function getPortBinding(port) {
    const listening = await getListeningPorts();
    return listening.find(conn => conn.localPort === port) || null;
}
/**
 * Check if address is localhost
 */
function isLocalhost(address) {
    const localhostAddresses = ['127.0.0.1', 'localhost', '::1', '::ffff:127.0.0.1'];
    return localhostAddresses.includes(address);
}
/**
 * Parse API endpoint from URL
 */
function parseApiEndpoint(url) {
    try {
        const parsed = new URL(url);
        return {
            host: parsed.hostname,
            port: parsed.port ? parseInt(parsed.port) : undefined
        };
    }
    catch {
        return null;
    }
}
