/**
 * Network utilities
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import type { NetworkConnection } from '../types';

const execAsync = promisify(exec);

/**
 * Get all network connections
 */
export async function getNetworkConnections(): Promise<NetworkConnection[]> {
  try {
    // Use lsof to get network connections (macOS/Linux)
    const { stdout } = await execAsync('lsof -i -P -n');
    const lines = stdout.split('\n').slice(1); // Skip header

    const connections: NetworkConnection[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.trim().split(/\s+/);
      if (parts.length < 9) continue;

      const type = parts[7]; // TCP or UDP
      const addresses = parts[8]; // local->remote or local

      if (type !== 'TCP' && type !== 'UDP') continue;

      const [local, remote] = addresses.split('->');
      const [localAddress, localPort] = local.split(':');

      const connection: NetworkConnection = {
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
  } catch (error) {
    console.error('Failed to get network connections:', error);
    return [];
  }
}

/**
 * Get listening ports
 */
export async function getListeningPorts(): Promise<NetworkConnection[]> {
  const connections = await getNetworkConnections();
  return connections.filter(conn => conn.state === 'LISTEN');
}

/**
 * Check if port is in use
 */
export async function isPortInUse(port: number): Promise<boolean> {
  const listening = await getListeningPorts();
  return listening.some(conn => conn.localPort === port);
}

/**
 * Check if port is exposed to public
 */
export function isPortPubliclyExposed(connection: NetworkConnection): boolean {
  const publicBindings = ['0.0.0.0', '*', '::'];
  return publicBindings.includes(connection.localAddress);
}

/**
 * Get port binding info
 */
export async function getPortBinding(port: number): Promise<NetworkConnection | null> {
  const listening = await getListeningPorts();
  return listening.find(conn => conn.localPort === port) || null;
}

/**
 * Check if address is localhost
 */
export function isLocalhost(address: string): boolean {
  const localhostAddresses = ['127.0.0.1', 'localhost', '::1', '::ffff:127.0.0.1'];
  return localhostAddresses.includes(address);
}

/**
 * Parse API endpoint from URL
 */
export function parseApiEndpoint(url: string): { host: string; port?: number } | null {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port) : undefined
    };
  } catch {
    return null;
  }
}
