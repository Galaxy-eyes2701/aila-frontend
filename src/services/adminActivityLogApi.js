import api from "@services/api";

export const getAdminActivityLogs = async ({
    startDate,
    endDate,
    action,
}) => {
    const params = {};

    if (startDate) {
        params.startDate = startDate;
    }

    if (endDate) {
        params.endDate = endDate;
    }

    if (action) {
        params.action = action;
    }

    const response = await api.get("/admin/activity-logs", {
        params,
    });

    return response.data;
};