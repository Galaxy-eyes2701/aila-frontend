import api from "@services/api";


// ======================================================
// UC-85
// Resource Limit Policies
// ======================================================


/**
 * Lấy danh sách chính sách giới hạn tài nguyên mặc định
 *
 * GET:
 * /api/admin/resource-limit-policies
 */
export async function getDefaultResourceLimitPolicies() {

    const response = await api.get(
        "/admin/resource-limit-policies"
    );

    return response.data;
}



/**
 * Cập nhật danh sách chính sách giới hạn tài nguyên mặc định
 *
 * PUT:
 * /api/admin/resource-limit-policies
 *
 * Body:
 * [
 *   {
 *      accountType,
 *      aiTokenLimit,
 *      aiPracticeScenarioLimit,
 *      expertEvaluationRequestLimit
 *   }
 * ]
 */
export async function updateDefaultResourceLimitPolicies(
    policies
) {

    const response = await api.put(
        "/admin/resource-limit-policies",
        policies
    );

    return response.data;
}





// ======================================================
// UC-86
// Resource Limit Overrides
// ======================================================


/**
 * Lấy danh sách account có thể override
 *
 * GET:
 * /api/admin/resource-limit-overrides/accounts
 *
 * Query:
 * keyword
 * pageIndex
 * pageSize
 */
export async function getOverrideEligibleAccounts(
    params
) {

    const response = await api.get(
        "/admin/resource-limit-overrides/accounts",
        {
            params
        }
    );


    return response.data;
}




/**
 * Lấy thông tin override của account
 *
 * GET:
 * /api/admin/resource-limit-overrides/{accountId}
 */
export async function getAccountResourceLimitOverride(
    accountId
) {

    const response = await api.get(
        `/admin/resource-limit-overrides/${accountId}`
    );


    return response.data;
}




/**
 * Tạo override resource limit
 *
 * POST:
 * /api/admin/resource-limit-overrides
 *
 * Body:
 * {
 *    accountId,
 *    aiTokenLimit,
 *    aiPracticeScenarioLimit,
 *    expertEvaluationRequestLimit
 * }
 */
export async function createAccountResourceLimitOverride(
    data
) {

    const response = await api.post(
        "/admin/resource-limit-overrides",
        data
    );


    return response.data;
}




/**
 * Cập nhật override resource limit
 *
 * PUT:
 * /api/admin/resource-limit-overrides/{accountId}
 */
export async function updateAccountResourceLimitOverride(
    accountId,
    data
) {

    const response = await api.put(
        `/admin/resource-limit-overrides/${accountId}`,
        data
    );


    return response.data;
}




/**
 * Xóa override resource limit
 *
 * DELETE:
 * /api/admin/resource-limit-overrides/{accountId}
 */
export async function deleteAccountResourceLimitOverride(
    accountId
) {

    const response = await api.delete(
        `/admin/resource-limit-overrides/${accountId}`
    );

    return response.data;
}