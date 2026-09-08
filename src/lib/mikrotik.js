import prisma from './db';

/**
 * Sends a request to Mikrotik RouterOS REST API.
 */
async function callRouterOS(settings, endpoint, method = 'GET', body = null) {
  const { mikrotikHost, mikrotikPort, mikrotikUsername, mikrotikPassword } = settings;
  
  if (!mikrotikHost || !mikrotikUsername) {
    return null;
  }

  // Clean host (remove http:// or https:// if user added it)
  const cleanHost = mikrotikHost.replace(/^(http:\/\/|https:\/\/)/, '');
  const url = `http://${cleanHost}:${mikrotikPort || 80}/rest${endpoint}`;
  
  const auth = Buffer.from(`${mikrotikUsername}:${mikrotikPassword}`).toString('base64');
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const options = {
      method,
      headers,
      signal: controller.signal
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    return response.status !== 204 ? await response.json() : true;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[Mikrotik-API] Error calling ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Synchronize customer status to Mikrotik (PPPoE Secret)
 * @param {Object} customer
 * @param {string} status - ACTIVE, SUSPENDED
 */
export async function syncCustomerToMikrotik(customer, status) {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings || !settings.mikrotikHost || !settings.mikrotikUsername) {
      // Mikrotik not configured, just log to DB
      await prisma.systemLog.create({
        data: {
          action: 'MIKROTIK_BYPASS',
          message: `Mikrotik tidak dikonfigurasi. Perubahan status ${customer.name} ke ${status} dilewati di router.`
        }
      });
      return false;
    }

    const username = customer.pppoeUsername;
    if (!username) {
      await prisma.systemLog.create({
        data: {
          action: 'MIKROTIK_SKIP',
          message: `Pelanggan ${customer.name} tidak memiliki username PPPoE. Lewati sinkronisasi Mikrotik.`
        }
      });
      return false;
    }

    // 1. Get Secret in Mikrotik to check if it exists
    console.log(`[Mikrotik] Syncing ${username} (Status: ${status})...`);
    let secrets = [];
    try {
      secrets = await callRouterOS(settings, `/ppp/secret?name=${username}`, 'GET');
    } catch (e) {
      await prisma.systemLog.create({
        data: {
          action: 'MIKROTIK_ERROR',
          message: `Gagal mencari secret PPPoE ${username} di Mikrotik: ${e.message}`
        }
      });
      return false;
    }

    if (!secrets || secrets.length === 0) {
      await prisma.systemLog.create({
        data: {
          action: 'MIKROTIK_NOT_FOUND',
          message: `Secret PPPoE ${username} tidak ditemukan di Mikrotik router.`
        }
      });
      return false;
    }

    const secretObj = secrets[0];
    const secretId = secretObj['.id'];

    // Determine target profile or disabled state based on status
    const isSuspended = status === 'SUSPENDED';
    
    try {
      // We toggle disabled: "yes" or "no"
      await callRouterOS(settings, `/ppp/secret/${secretId}`, 'PATCH', {
        disabled: isSuspended ? "yes" : "no"
      });

      // 2. If isolating (disabled), kick the active connection so they disconnect immediately
      if (isSuspended) {
        const activeConns = await callRouterOS(settings, `/ppp/active?name=${username}`, 'GET');
        if (activeConns && activeConns.length > 0) {
          for (const conn of activeConns) {
            await callRouterOS(settings, `/ppp/active/${conn['.id']}`, 'DELETE');
            console.log(`[Mikrotik] Kicked active PPPoE connection for ${username}`);
          }
        }
      }

      await prisma.systemLog.create({
        data: {
          action: 'MIKROTIK_SUCCESS',
          message: `Berhasil sinkronisasi status ${customer.name} (${username}) ke Mikrotik: ${isSuspended ? 'ISOLIR (Disabled)' : 'AKTIF (Enabled)'}`
        }
      });
      return true;
    } catch (err) {
      await prisma.systemLog.create({
        data: {
          action: 'MIKROTIK_ERROR',
          message: `Gagal memperbarui status secret PPPoE ${username} di Mikrotik: ${err.message}`
        }
      });
      return false;
    }
  } catch (error) {
    console.error('[Mikrotik] Sync error:', error);
    return false;
  }
}
