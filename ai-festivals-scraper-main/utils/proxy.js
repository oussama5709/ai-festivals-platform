/**
 * إدارة البروكسي مع التدوير التلقائي
 * Proxy management with automatic rotation
 */

class ProxyManager {
    /**
     * @param {Object} proxyConfiguration - إعدادات البروكسي من Apify Input
     */
    constructor(proxyConfiguration = {}) {
        this.useApifyProxy = proxyConfiguration.useApifyProxy || false;
        this.apifyProxyGroups = proxyConfiguration.apifyProxyGroups || [];
        this.customProxies = proxyConfiguration.proxyUrls || [];
        this.currentIndex = 0;
        this.failedProxies = new Set();
    }

    /**
     * الحصول على بروكسي التالي
     * @returns {string|null} URL البروكسي أو null للاتصال المباشر
     */
    getNextProxy() {
        if (this.useApifyProxy) {
            return this._getApifyProxyUrl();
        }

        if (this.customProxies.length === 0) {
            return null; // اتصال مباشر
        }

        // تدوير البروكسيات المخصصة
        const availableProxies = this.customProxies.filter(p => !this.failedProxies.has(p));

        if (availableProxies.length === 0) {
            console.log('⚠️ جميع البروكسيات فشلت. إعادة التعيين والمحاولة مرة أخرى...');
            this.failedProxies.clear();
            return this.customProxies[0] || null;
        }

        const proxy = availableProxies[this.currentIndex % availableProxies.length];
        this.currentIndex++;
        return proxy;
    }

    /**
     * بناء رابط بروكسي Apify
     * @returns {string}
     */
    _getApifyProxyUrl() {
        const groups = this.apifyProxyGroups.length > 0
            ? `groups-${this.apifyProxyGroups.join('+')},`
            : '';
        const session = `session-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        return `http://${groups}${session}:@proxy.apify.com:8000`;
    }

    /**
     * تحديد بروكسي كفاشل
     * @param {string} proxyUrl - URL البروكسي الفاشل
     */
    markFailed(proxyUrl) {
        this.failedProxies.add(proxyUrl);
        console.log(`🔴 بروكسي فاشل: ${proxyUrl.substring(0, 30)}...`);
    }

    /**
     * الحصول على إعدادات axios مع البروكسي
     * @returns {Object} إعدادات البروكسي لـ axios
     */
    getAxiosConfig() {
        const proxyUrl = this.getNextProxy();

        if (!proxyUrl) {
            return {}; // اتصال مباشر
        }

        try {
            const url = new URL(proxyUrl);
            return {
                proxy: {
                    host: url.hostname,
                    port: parseInt(url.port) || 8000,
                    auth: url.username ? {
                        username: url.username,
                        password: url.password || ''
                    } : undefined,
                    protocol: url.protocol.replace(':', '')
                }
            };
        } catch (e) {
            console.log(`⚠️ خطأ في تحليل البروكسي: ${e.message}. استخدام اتصال مباشر.`);
            return {};
        }
    }

    /**
     * عدد البروكسيات المتاحة
     */
    get availableCount() {
        if (this.useApifyProxy) return Infinity;
        return this.customProxies.length - this.failedProxies.size;
    }
}

module.exports = { ProxyManager };
