/**
 * أداة إعادة المحاولة مع التأخير التصاعدي
 * Retry with exponential backoff utility
 */

/**
 * @param {Function} fn - الدالة المراد تنفيذها (يجب أن تُرجع Promise)
 * @param {Object} options - خيارات إعادة المحاولة
 * @param {number} options.maxRetries - الحد الأقصى لعدد المحاولات (افتراضي: 3)
 * @param {number} options.baseDelay - التأخير الأساسي بالمللي ثانية (افتراضي: 1000)
 * @param {number} options.maxDelay - الحد الأقصى للتأخير بالمللي ثانية (افتراضي: 30000)
 * @param {string} options.label - تسمية للتسجيل في السجلات
 * @returns {Promise} نتيجة الدالة
 */
async function retryWithBackoff(fn, options = {}) {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 30000,
        label = 'request'
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (attempt > maxRetries) {
                console.log(`❌ فشل ${label} بعد ${maxRetries + 1} محاولات: ${error.message}`);
                throw error;
            }

            const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
            const jitter = Math.random() * delay * 0.1; // 10% jitter
            const totalDelay = Math.floor(delay + jitter);

            console.log(`⏳ محاولة ${attempt}/${maxRetries + 1} فشلت لـ ${label}: ${error.message}`);
            console.log(`   ⏱️ إعادة المحاولة بعد ${totalDelay}ms...`);

            await new Promise(resolve => setTimeout(resolve, totalDelay));
        }
    }

    throw lastError;
}

/**
 * تنفيذ طلب HTTP مع إعادة المحاولة
 * @param {Function} requestFn - دالة الطلب (axios.get, etc.)
 * @param {string} label - تسمية للسجلات
 * @param {Object} retryOptions - خيارات إعادة المحاولة
 */
async function retryRequest(requestFn, label = 'HTTP request', retryOptions = {}) {
    return retryWithBackoff(async () => {
        const response = await requestFn();
        if (response.status >= 400) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
    }, { ...retryOptions, label });
}

module.exports = { retryWithBackoff, retryRequest };
