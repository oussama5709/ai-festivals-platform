/**
 * محدد معدل الطلبات لكل مصدر
 * Per-source rate limiter
 */

class RateLimiter {
    /**
     * @param {Object} options
     * @param {number} options.maxRequests - الحد الأقصى للطلبات في الفترة الزمنية
     * @param {number} options.windowMs - الفترة الزمنية بالمللي ثانية (افتراضي: 60000 = دقيقة)
     * @param {string} options.name - اسم المصدر
     */
    constructor(options = {}) {
        this.maxRequests = options.maxRequests || 60;
        this.windowMs = options.windowMs || 60000;
        this.name = options.name || 'default';
        this.timestamps = [];
    }

    /**
     * انتظار حتى يُسمح بالطلب التالي
     * @returns {Promise<void>}
     */
    async waitForSlot() {
        const now = Date.now();

        // إزالة الطلبات القديمة خارج النافذة الزمنية
        this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);

        if (this.timestamps.length >= this.maxRequests) {
            const oldestInWindow = this.timestamps[0];
            const waitTime = this.windowMs - (now - oldestInWindow) + 100; // +100ms buffer

            if (waitTime > 0) {
                console.log(`🚦 [${this.name}] تم الوصول للحد الأقصى (${this.maxRequests}/${this.windowMs}ms). انتظار ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        this.timestamps.push(Date.now());
    }

    /**
     * تنفيذ دالة مع تحديد المعدل
     * @param {Function} fn - الدالة المراد تنفيذها
     * @returns {Promise} نتيجة الدالة
     */
    async execute(fn) {
        await this.waitForSlot();
        return fn();
    }

    /**
     * إعادة تعيين العداد
     */
    reset() {
        this.timestamps = [];
    }

    /**
     * الطلبات المتبقية في النافذة الحالية
     */
    get remaining() {
        const now = Date.now();
        const activeCount = this.timestamps.filter(t => now - t < this.windowMs).length;
        return Math.max(0, this.maxRequests - activeCount);
    }
}

// محددات معدل مُسبقة التهيئة لكل مصدر
const SOURCE_LIMITERS = {
    eventbrite: new RateLimiter({ maxRequests: 30, name: 'Eventbrite' }),
    meetup: new RateLimiter({ maxRequests: 20, name: 'Meetup' }),
    linkedin: new RateLimiter({ maxRequests: 10, name: 'LinkedIn' }),
    official: new RateLimiter({ maxRequests: 60, name: 'Official Sites' }),
    aggregator: new RateLimiter({ maxRequests: 30, name: 'Aggregators' })
};

module.exports = { RateLimiter, SOURCE_LIMITERS };
